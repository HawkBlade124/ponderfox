import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import DashMenu from "../../components/DashMenu.jsx";
import { buildApiUrl } from "../../utils/api.js";
import { getCategoryMeta, pickRandomPrompt } from "../../data/prompts.js";

function PromptDetail() {
  const { categoryKey } = useParams();
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const apiBase = buildApiUrl();
  const authHeader = { Authorization: `Bearer ${token}` };

  const category = getCategoryMeta(categoryKey);
  const [currentPrompt, setCurrentPrompt] = useState(() => pickRandomPrompt(categoryKey));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentPrompt(pickRandomPrompt(categoryKey));
    setError("");
  }, [categoryKey]);

  const shuffle = () => {
    setCurrentPrompt((prev) => pickRandomPrompt(categoryKey, prev));
    setError("");
  };

  const uniqueThoughtName = async (baseName) => {
    const res = await fetch(`${apiBase}/thoughts`, { headers: authHeader });
    if (res.status === 401 || res.status === 403) {
      navigate("/Unauthorized");
      return null;
    }
    const existing = await res.json();
    const names = new Set((Array.isArray(existing) ? existing : []).map((t) => t.ThoughtName.toLowerCase()));

    if (!names.has(baseName.toLowerCase())) return baseName;

    let n = 2;
    while (names.has(`${baseName} (${n})`.toLowerCase())) n++;
    return `${baseName} (${n})`;
  };

  const startThought = async () => {
    if (!currentPrompt) return;
    setStarting(true);
    setError("");
    try {
      const thoughtName = await uniqueThoughtName(currentPrompt.slice(0, 240));
      if (!thoughtName) return;

      const createRes = await fetch(`${apiBase}/thoughts`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ ThoughtName: thoughtName, ThoughtDescr: `${category.label} prompt` }),
      });
      if (createRes.status === 401 || createRes.status === 403) {
        navigate("/Unauthorized");
        return;
      }
      const createData = await createRes.json();
      if (!createData.success) {
        setError(createData.error || "Failed to start a thought.");
        return;
      }

      await fetch(`${apiBase}/messages`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ ThoughtName: thoughtName, message: currentPrompt, attachments: [] }),
      });

      navigate(`/thought/${encodeURIComponent(thoughtName)}`);
    } catch (err) {
      console.error("Error starting thought from prompt:", err);
      setError("Failed to start a thought.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!category) {
    return (
      <div id="dashboard" className="w-full">
        <div id="dashWrap" className="flex w-full">
          <DashMenu />
          <div className="rightScreen w-full p-6 ml">
            <p className="text-red-500">Unknown prompt category.</p>
            <Link to="/prompts" className="modalTextLink">Back to Prompts</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center gap-4">
            <Link to="/prompts" className="backtodashbtn flex items-center justify-center">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="dashBreadcrumb">
                <Link to="/prompts">Prompts</Link> <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i>{" "}
                <span>{category.label}</span>
              </div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className={`${category.icon} text-[#438eef]`}></i> {category.label}
              </h1>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <div className="dashBody w-full max-w-2xl flex flex-col items-center gap-6 p-10 text-center">
              <i className={`${category.icon} text-4xl text-[#438eef]`}></i>
              <p className="text-2xl font-semibold text-white leading-relaxed">{currentPrompt}</p>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  onClick={shuffle}
                  className="bg-slate-800 hover:bg-slate-700 transition text-white font-semibold h-11 px-5 rounded-lg cursor-pointer flex items-center gap-2 border border-slate-700"
                >
                  <i className="fa-regular fa-shuffle"></i> New Prompt
                </button>
                <button
                  onClick={startThought}
                  disabled={starting}
                  className="bg-[#438eef] hover:bg-[#2f7ae0] transition text-white font-semibold h-11 px-5 rounded-lg cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  <i className="fa-regular fa-message-plus"></i> {starting ? "Starting..." : "Start a Thought"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromptDetail;
