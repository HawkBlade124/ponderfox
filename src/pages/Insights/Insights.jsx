import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import DashMenu from "../../components/DashMenu.jsx";
import { getTierColor } from "../../utils/tier.js";

const CHART_DAYS = 14;

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

function formatMemberSince(dateCreated) {
  if (!dateCreated) return "—";
  const date = new Date(dateCreated);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function getDailyCounts(thoughts) {
  const days = [];
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const count = thoughts.filter((t) => t.DateCreated && t.DateCreated.slice(0, 10) === key).length;
    return { key, count, label: d.toLocaleDateString(undefined, { weekday: "short" })[0] };
  });
}

function roundedTopBarPath(x, y, width, height, radius) {
  if (height <= 0) return "";
  const r = Math.min(radius, height, width / 2);
  if (r <= 0) {
    return `M${x},${y + height} L${x},${y} L${x + width},${y} L${x + width},${y + height} Z`;
  }
  return `M${x},${y + height}
    L${x},${y + r}
    Q${x},${y} ${x + r},${y}
    L${x + width - r},${y}
    Q${x + width},${y} ${x + width},${y + r}
    L${x + width},${y + height}
    Z`;
}

function ThoughtsChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = 22;
  const gap = 14;
  const chartHeight = 160;
  const labelHeight = 20;
  const width = data.length * barWidth + (data.length - 1) * gap;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${chartHeight + labelHeight}`} role="img" aria-label={`Thoughts added over the last ${CHART_DAYS} days`}>
      <defs>
        <linearGradient id="insightsPageBarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in srgb, var(--accent) 65%, white)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <line x1="0" y1={chartHeight} x2={width} y2={chartHeight} className="insightsChartAxis" strokeWidth="1" />
      {data.map((d, i) => {
        const barHeight = d.count === 0 ? 0 : Math.max(4, (d.count / max) * (chartHeight - 8));
        const x = i * (barWidth + gap);
        const y = chartHeight - barHeight;
        return (
          <g key={d.key}>
            <path d={roundedTopBarPath(x, y, barWidth, barHeight, 4)} fill="url(#insightsPageBarGradient)">
              <title>{`${d.count} thought${d.count === 1 ? "" : "s"}`}</title>
            </path>
            <text x={x + barWidth / 2} y={chartHeight + 15} textAnchor="middle" fontSize="10" className="insightsChartLabel">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Insights() {
  const { user, token, loading, todayActiveSeconds } = useAuth();
  const [thoughts, setThoughts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !token) return;

    const fetchThoughts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setThoughts(Array.isArray(data) ? data : data.Thoughts || data.data || []);
      } catch (err) {
        console.error("Error fetching thoughts:", err);
        setError("Failed to load insights");
      }
    };

    fetchThoughts();
  }, [token, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const chartData = getDailyCounts(thoughts);

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Insights</span></div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className="fa-regular fa-chart-line text-[var(--accent)]"></i> Insights
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mt-6">
            <div className="statTile">
              <div>
                <div className="statTileLabel">Thoughts added</div>
                <div className="statTileValue">{thoughts.length}</div>
              </div>
              <div className="statTileIcon"><i className="fa-regular fa-brain"></i></div>
            </div>
            <div className="statTile">
              <div>
                <div className="statTileLabel">Favorites</div>
                <div className="statTileValue">{thoughts.filter((t) => t.Favorite).length}</div>
              </div>
              <div className="statTileIcon"><i className="fa-solid fa-heart"></i></div>
            </div>
            <div className="statTile">
              <div>
                <div className="statTileLabel">Time today</div>
                <div className="statTileValue">{formatDuration(todayActiveSeconds)}</div>
              </div>
              <div className="statTileIcon"><i className="fa-regular fa-clock"></i></div>
            </div>
            <div className="statTile">
              <div>
                <div className="statTileLabel">Member since</div>
                <div className="statTileValue text-lg">{formatMemberSince(user.DateCreated)}</div>
              </div>
              <div className="statTileIcon"><i className="fa-regular fa-calendar-star"></i></div>
            </div>
            <div className="statTile">
              <div>
                <div className="statTileLabel">Account tier</div>
                <div className="statTileValue text-lg" style={{ color: getTierColor(user.Tier) }}>{user.Tier}</div>
              </div>
              <div className="statTileIcon"><i className="fa-regular fa-crown"></i></div>
            </div>
          </div>

          <div className="mt-5">
            <section className="dashBody w-full">
              <h2 className="text-lg flex items-center gap-2"><i className="fa-regular fa-chart-simple text-[var(--accent)]"></i> Thoughts added, last {CHART_DAYS} days</h2>
              <div className="mt-4">
                <ThoughtsChart data={chartData} />
              </div>
            </section>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default Insights;
