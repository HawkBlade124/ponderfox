import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashMenu from "../../components/DashMenu.jsx";
import PonderFoxMark from "../../components/PonderFoxMark.jsx";

function Lists() {
  const { user, token, loading } = useAuth();
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !token) return;

    const fetchLists = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setLists(data.lists);
        } else {
          setError(data.error || "Failed to load lists");
        }
      } catch (err) {
        console.error("Error fetching lists:", err);
        setError("Failed to load lists");
      }
    };

    fetchLists();
  }, [token, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Lists</span></div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className="fa-regular fa-list-tree text-[#438eef]"></i> Lists
              </h1>
            </div>
          </div>

          <div className="mt-5">
            <section className="dashBody w-full">
              {lists.length === 0 ? (
                <div className="emptyState">
                  <PonderFoxMark size={120} className="emptyStateArt" />
                  <p>No lists yet — open a thought&apos;s Details tab and sort it into a list to create one.</p>
                </div>
              ) : (
                <div id="thoughtList" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-5 mt-5 place-items-center">
                  {lists.map((l) => (
                    <Link
                      key={l.ListName}
                      to={`/thoughts/${encodeURIComponent(l.ListName)}`}
                      className="thoughtItem w-full flex flex-col items-center justify-between"
                    >
                      <div className="flex justify-between w-full">
                        <i className="text-xl fa-regular fa-list-tree"></i>
                      </div>
                      <div className="thoughtName">{l.ListName}</div>
                      <div className="text-lg">{l.ThoughtCount} {l.ThoughtCount === 1 ? "thought" : "thoughts"}</div>
                    </Link>
                  ))}
                </div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lists;
