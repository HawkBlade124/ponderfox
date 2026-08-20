import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect, useRef } from "react";
import DashMenu from "../../components/DashMenu.jsx";
import EmptyStateArt from "../../components/EmptyStateArt.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import SearchBox from "../../components/SearchBox.jsx";
import { buildApiUrl } from "../../utils/api.js";
import AddTimerModal from "../../components/modals/AddTimer.jsx";

function formatDuration(totalSeconds) {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// While running, RemainingSeconds is only accurate as of StartedAt — the
// live value ticks down client-side so we don't need a request every second.
function getLiveRemaining(timer, now) {
  if (timer.Status !== "running" || !timer.StartedAt) return timer.RemainingSeconds;
  const elapsed = (now - new Date(timer.StartedAt).getTime()) / 1000;
  return Math.max(0, timer.RemainingSeconds - elapsed);
}

function Timers() {
  const { user, token, loading } = useAuth();
  const [timers, setTimers] = useState([]);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const autoStoppedRef = useRef(new Set());

  useEffect(() => {
    if (loading || !token) return;

    const fetchTimers = async () => {
      try {
        const res = await fetch(`${buildApiUrl()}/timers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setTimers(data.timers);
        } else {
          setError(data.error || "Failed to load timers");
        }
      } catch (err) {
        console.error("Error fetching timers:", err);
        setError("Failed to load timers");
      }
    };

    fetchTimers();
  }, [token, loading]);

  // Ticks once a second so running timers visibly count down.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const replaceTimer = (updated) => {
    setTimers((prev) => prev.map((t) => (t.TimerID === updated.TimerID ? updated : t)));
  };

  const createTimer = async (timerName, durationSeconds) => {
    try {
      const res = await fetch(`${buildApiUrl()}/timers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ TimerName: timerName.trim(), DurationSeconds: durationSeconds }),
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.details || data.error || "Failed to create timer" };
      }
      setTimers((prev) => [data.timer, ...prev]);
    } catch (err) {
      console.error("Error creating timer:", err);
      return { success: false, error: "Failed to create timer" };
    }
  };

  const runAction = async (timerId, action) => {
    try {
      const res = await fetch(`${buildApiUrl()}/timers/${timerId}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        replaceTimer(data.timer);
        // Reset/restart clears the "already auto-stopped" guard so a timer
        // that's run through more than one countdown can auto-stop again.
        if (action === "reset" || action === "start") {
          autoStoppedRef.current.delete(timerId);
        }
      } else {
        setError(data.error || `Failed to ${action} timer`);
      }
    } catch (err) {
      console.error(`Error running ${action} on timer:`, err);
      setError(`Failed to ${action} timer`);
    }
  };

  const deleteTimer = async (timerId) => {
    try {
      const res = await fetch(`${buildApiUrl()}/timers/${timerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTimers((prev) => prev.filter((t) => t.TimerID !== timerId));
        autoStoppedRef.current.delete(timerId);
      } else {
        setError(data.error || "Failed to delete timer");
      }
    } catch (err) {
      console.error("Error deleting timer:", err);
      setError("Failed to delete timer");
    }
  };

  // When a running timer's live countdown hits zero, freeze it server-side
  // so RemainingSeconds doesn't drift negative and Start re-enables cleanly
  // after a Reset. Guarded so each timer only auto-stops once per finish.
  useEffect(() => {
    timers.forEach((timer) => {
      if (timer.Status !== "running") return;
      if (getLiveRemaining(timer, now) > 0) return;
      if (autoStoppedRef.current.has(timer.TimerID)) return;
      autoStoppedRef.current.add(timer.TimerID);
      runAction(timer.TimerID, "stop");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, timers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const searchedTimers = timers.filter((t) =>
    t.TimerName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Timers</span></div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className="fa-regular fa-stopwatch text-[var(--accent)]"></i> Timers
              </h1>
              <p className="text-sm text-slate-400 mt-1">Count down the time you have left on a project.</p>
            </div>
            <div className="flex items-center gap-3">
              {timers.length > 1 && (
                <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search timers" />
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[var(--accent)] hover:bg-[color-mix(in srgb, var(--accent) 85%, black)] transition text-white font-semibold h-11 px-5 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <i className="fa-regular fa-plus"></i> New Timer
              </button>
              <TopProfileTile />
            </div>
          </div>

          <div className="mt-5">
            <section className="dashBody w-full">
              {timers.length === 0 ? (
                <div className="emptyState">
                  <EmptyStateArt size={120} className="emptyStateArt" />
                  <p>No timers yet — add one to count down the time left on a project.</p>
                </div>
              ) : searchedTimers.length === 0 ? (
                <div className="emptyState">
                  <EmptyStateArt size={120} className="emptyStateArt" />
                  <p>Nothing matches &quot;{search}&quot;.</p>
                  <button type="button" className="emptyStateAction" onClick={() => setSearch("")}>Clear search</button>
                </div>
              ) : (
                <div id="timerList" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-5 mt-5">
                  {searchedTimers.map((timer) => {
                    const liveRemaining = getLiveRemaining(timer, now);
                    const finished = liveRemaining <= 0;
                    const pct = Math.min(100, Math.max(0, (liveRemaining / timer.DurationSeconds) * 100));

                    return (
                      <div key={timer.TimerID} className="dashBody timerCard">
                        <div className="timerCardHead">
                          <div className="timerName" title={timer.TimerName}>{timer.TimerName}</div>
                          <i
                            className="fa-regular fa-trash-can timerDeleteIcon"
                            title="Delete timer"
                            onClick={() => deleteTimer(timer.TimerID)}
                          ></i>
                        </div>

                        <div className={`timerDisplay ${finished ? "timerDisplayFinished" : ""}`}>
                          {finished ? "Time's up" : formatDuration(liveRemaining)}
                        </div>

                        <div className="usageQuotaBar">
                          <div
                            className={`usageQuotaBarFill ${finished ? "usageQuotaBarFillWarning" : ""}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>

                        <div className="timerActions">
                          {timer.Status === "running" ? (
                            <button className="timerActionBtn" onClick={() => runAction(timer.TimerID, "stop")}>
                              <i className="fa-solid fa-pause"></i> Pause
                            </button>
                          ) : (
                            <button
                              className="timerActionBtn timerActionBtnPrimary"
                              onClick={() => runAction(timer.TimerID, "start")}
                              disabled={finished}
                            >
                              <i className="fa-solid fa-play"></i> Start
                            </button>
                          )}
                          <button className="timerActionBtn" onClick={() => runAction(timer.TimerID, "reset")}>
                            <i className="fa-solid fa-rotate-left"></i> Reset
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </section>
          </div>
        </div>
      </div>

      <AddTimerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(timerName, durationSeconds) => createTimer(timerName, durationSeconds)}
      />
    </div>
  );
}

export default Timers;
