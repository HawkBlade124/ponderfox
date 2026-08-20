import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SearchBox from "../../components/SearchBox.jsx";
import RichTextEditor from "../../components/RichTextEditor.jsx";
import axios from "axios";
import DOMPurify from "dompurify";

function buildApiUrl() {
  const raw = (import.meta.env.VITE_API_URL || window.location.origin).trim();
  const base = raw.replace(/\/+$/, "");
  const hasApi = /\/api$/.test(base);
  return hasApi ? base : `${base}/api`;
}

// Keep in sync with MESSAGE_HTML_OPTIONS in server.js — this is a second
// line of defense at render time, not a substitute for server-side sanitizing.
const MESSAGE_HTML_TAGS = ["p", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "code", "br"];
function sanitizeMessageHtml(html) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: MESSAGE_HTML_TAGS, ALLOWED_ATTR: [] });
}
function messageToPlainText(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const REMINDER_DISMISSED_KEY = "thoughtReminderDismissed";

function Thought() {
  const [message, setMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const editorRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [h1Visible, setH1Visible] = useState(true);
  const [reminderHidden, setReminderHidden] = useState(
    () => localStorage.getItem(REMINDER_DISMISSED_KEY) === "true"
  );
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [ThoughtDescription, setThoughtDescription] = useState("");

  const [addCat, setCat] = useState("");
  const [addTag, setTag] = useState("");
  const [addList, setList] = useState("");
  const [ThoughtID, setThoughtID] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [activeTab, setActiveTab] = useState("main");

  const [pendingAttachments, setPendingAttachments] = useState([]); // [{ url, name, type }]
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const sentMessagesRef = useRef(null);
  const MAX_ATTACHMENTS = 5;

  const { token, loading } = useAuth();
  const navigate = useNavigate();
  const { ThoughtName } = useParams();
  const apiBase = buildApiUrl();

  const isImageAttachment = (attachment) =>
    /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment || "");

  useEffect(() => {
    if (!loading && !token) {
      navigate("/Unauthorized");
    }
  }, [loading, token, navigate]);

  // ---------- Fetch messages ----------
  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${apiBase}/messages/${encodeURIComponent(ThoughtName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setMessages(res.data.messages || []);
        setThoughtDescription(res.data.Thought?.ThoughtDescr || "");
        setThoughtID(res.data.Thought?.ThoughtID || null);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) navigate("/Unauthorized");
      else if (status === 404) navigate("/404");
      else console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMessages();
    }
  }, [token, ThoughtName]);

  // Always land on the newest entry — on first load and after every new message.
  useEffect(() => {
    const el = sentMessagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // ---------- Attachments ----------
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file(s) later
    if (files.length === 0) return;

    const remainingSlots = MAX_ATTACHMENTS - pendingAttachments.length;
    if (remainingSlots <= 0) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > filesToUpload.length) {
      setError(`Only ${remainingSlots} more file(s) can be attached (max ${MAX_ATTACHMENTS}).`);
    } else {
      setError("");
    }

    const oversized = filesToUpload.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" is too large (max 10MB)`);
      return;
    }

    const formData = new FormData();
    filesToUpload.forEach((file) => formData.append("files", file));

    setUploading(true);

    try {
      const res = await axios.post(`${apiBase}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const uploaded = res.data.urls.map((url, i) => ({
          url,
          name: filesToUpload[i].name,
          type: filesToUpload[i].type,
        }));
        setPendingAttachments((prev) => [...prev, ...uploaded]);
      }
    } catch (err) {
      console.error("Error uploading file:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Could not upload file(s).");
    } finally {
      setUploading(false);
    }
  };

  const removePendingAttachment = (url) => {
    setPendingAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  // ---------- Enter message ----------
  const enteredMessage = async () => {
    if (!messageText.trim()) return;

    const attachmentUrls = pendingAttachments.map((a) => a.url);
    const messageHtml = message;

    setMessage("");
    setMessageText("");
    editorRef.current?.clear();
    setPendingAttachments([]);
    setH1Visible(false);
    if (localStorage.getItem(REMINDER_DISMISSED_KEY) !== "true") {
      setReminderHidden(false);
    }

    try {
      const res = await axios.post(
        `${apiBase}/messages`,
        { ThoughtName, message: messageHtml, attachments: attachmentUrls },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.newMessage) {
        setMessages((prev) => [...prev, res.data.newMessage]);
      }
    } catch (err) {
      console.error("Error saving message:", err.response?.data || err.message);
      setError("Could not save your message.");
    }
  };

  // ---------- Delete message ----------
  const deleteMessage = async (messageId) => {
    try {
      const res = await fetch(`${apiBase}/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.MessageID !== messageId));
      } else {
        setError(data.error || "Failed to delete message");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("An error occurred while deleting.");
    }
  };

  // ---------- Search ----------
  // Uses its own `searchResults` state (kept separate from `messages`) so
  // searching in the sidebar doesn't overwrite the main chat, which is
  // visible at the same time as the sidebar on wide screens.
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearch(term);

    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(
        `${apiBase}/search?q=${encodeURIComponent(term)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setSearchResults(res.data.messages || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // ---------- Categories ----------
  useEffect(() => {
    if (!ThoughtID) return;
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${apiBase}/categories/${ThoughtID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    loadCategories();
  }, [ThoughtID, apiBase, token]);

  const addCategory = async () => {
    if (!addCat.trim()) {
      setError("Please enter a category name");
      return;
    }

    try {
      const res = await axios.post(
        `${apiBase}/categories`,
        { category: addCat, ThoughtID },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) { 
          setCategories((prev) => [
          ...prev,
          { CategoryName: addCat, CategoryID: res.data.CategoryID },
        ]);
        setCat("");
        setError("");
      } else {
        console.error("Category add failed:", res.data.error);
      }
    } catch (err) {
      console.error("Error Adding Category:", err.response?.data || err.message);
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const res = await fetch(`${apiBase}/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setCategories((prev) =>
          prev.filter((cat) => cat.CategoryID !== categoryId)
        );
      } else {
        setError(data.error || "Failed to delete category");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("An error occurred while deleting.");
    }
  };

  // ---------- Tags ----------
  useEffect(() => {
    if (!ThoughtID) return;
    const loadTags = async () => {
      try {
        const res = await axios.get(`${apiBase}/tags/${ThoughtID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setTags(res.data.tags || []);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };
    loadTags();
  }, [ThoughtID, apiBase, token]);

  const addTags = async () => {
    if (!addTag.trim()) {
      setError("Please enter a tag name");
      return;
    }

    try {
      const res = await axios.post(
        `${apiBase}/tags`,
        { tag: addTag, ThoughtID },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setTags((prev) => [
          ...prev,
          { TagName: addTag, TagID: res.data.TagID },
        ]);
        setTag("");
        setError("");
      } else {
        console.error("Tag add failed:", res.data.error);
      }
    } catch (err) {
      console.error("Error Adding Tag:", err.response?.data || err.message);
    }
  };

  const deleteTag = async (tagId) => {
    try {
      const res = await fetch(`${apiBase}/tags/${tagId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setTags((prev) => prev.filter((tag) => tag.TagID !== tagId));
      } else {
        setError(data.error || "Failed to delete tag");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("An error occurred while deleting.");
    }
  };

  // ---------- Lists ----------
  useEffect(() => {
    if (!ThoughtID) return;
    const loadLists = async () => {
      try {
        const res = await axios.get(`${apiBase}/lists/${ThoughtID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setLists(res.data.lists || []);
      } catch (err) {
        console.error("Error fetching lists:", err);
      }
    };
    loadLists();
  }, [ThoughtID, apiBase, token]);

  const addLists = async () => {
    if (!addList.trim()) {
      setError("Please enter a list name");
      return;
    }

    try {
      const res = await axios.post(
        `${apiBase}/lists`,
        { list: addList, ThoughtID },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setLists((prev) => [
          ...prev,
          { ListName: addList, ListID: res.data.ListID },
        ]);
        setList("");
        setError("");
      } else {
        console.error("List add failed:", res.data.error);
      }
    } catch (err) {
      console.error("Error Adding List:", err.response?.data || err.message);
    }
  };

  const deleteList = async (listId) => {
    try {
      const res = await fetch(`${apiBase}/lists/${listId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setLists((prev) => prev.filter((list) => list.ListID !== listId));
      } else {
        setError(data.error || "Failed to delete list");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("An error occurred while deleting.");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div id="headBar" className="lg:hidden flex items-center justify-between p-4">
        <Link to="/dashboard" className="mobileBackBtn flex items-center justify-center">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div id="headBarWrap" className="flex items-center justify-center rounded-md">
          <div className={`thoughtTab ${activeTab === "search" ? "thoughtTabActive" : ""}`} onClick={() => setActiveTab("search")}>
            <i className="fa-regular fa-magnifying-glass"></i> Search
          </div>
          <div className={`thoughtTab ${activeTab === "main" ? "thoughtTabActive" : ""}`} onClick={() => setActiveTab("main")}>
            <i className="fa-regular fa-comment-dots"></i> Main
          </div>
          <div className={`thoughtTab ${activeTab === "details" ? "thoughtTabActive" : ""}`} onClick={() => setActiveTab("details")}>
            <i className="fa-regular fa-circle-info"></i> Details
          </div>
        </div>
      </div>

      <div id="thoughtBody" className="flex flex-col lg:flex-row w-full flex-1 min-h-0 gap-5 p-5">

        {/* LEFT SIDEBAR */}
        <div id="leftSide" className={`sidebar dashBody ${activeTab === "search" ? "block" : "hidden"} lg:block`}>
          <div id="searchThoughts">
            <SearchBox
              value={search}
              onChange={handleSearch}
              placeholder="Search your thoughts"
              className="dashSearchInputFull"
            />

            {search.trim() ? (
              <div className="searchResults mt-4">
                {searchResults.length === 0 ? (
                  <p className="modalEmptyNote">
                    No matches for &quot;{search}&quot;. Try a different word or phrase.
                  </p>
                ) : (
                  <>
                    <p className="searchResultCount">
                      {searchResults.length} {searchResults.length === 1 ? "result" : "results"} across all your thoughts
                    </p>
                    <ul className="flex flex-col gap-2">
                      {searchResults.map((msg) => (
                        <li
                          key={msg.MessageID}
                          className="searchResultItem"
                          onClick={() => {
                            const targetThought = msg.ThoughtName || ThoughtName || "";
                            navigate(`/thought/${encodeURIComponent(targetThought)}`);
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="searchResultTitle">{msg.ThoughtName || "Unknown Thought"}</div>
                            {msg.DateSent && (
                              <div className="searchResultMeta">{new Date(msg.DateSent).toLocaleDateString()}</div>
                            )}
                          </div>
                          <div className="searchResultSnippet">
                            {msg.ContentFormat === "html" ? messageToPlainText(msg.Message) : msg.Message}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <p className="modalEmptyNote mt-4">
                Search matches message text from every thought you&apos;ve written — not just this one. Start typing to find a word, phrase, or memory.
              </p>
            )}
          </div>
        </div>

        {/* MAIN AREA */}
        <div id="mainSection" className={`dashBody flex flex-col w-full min-h-0 chatInput justify-between ${activeTab === "main" ? "flex" : "hidden"} lg:flex`}>
          <div className="thoughtInfoHead flex items-center gap-4">
            <Link to="/dashboard" className="backtodashbtn hidden lg:flex items-center justify-center">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="flex-1 text-center">
              <div id="thoughtName" className="text-2xl font-bold text-white">Thoughts of {ThoughtName}</div>
              {ThoughtDescription && <p className="text-sm text-slate-400 mt-1">{ThoughtDescription}</p>}
            </div>
          </div>

          {!reminderHidden && (
            <p id="reminder">
              Remember, no one will reply to you in any of these chats. It's
              purely a space for your thoughts.
              <i
                onClick={() => {
                  localStorage.setItem(REMINDER_DISMISSED_KEY, "true");
                  setReminderHidden(true);
                }}
                className="fa-solid fa-xmark cursor-pointer ml-2"
              ></i>
            </p>
          )}

          {/* EMPTY STATE */}
          {messages.length === 0 && h1Visible ? (
            <div className="initialChatBody w-full max-w-2xl m-auto flex flex-col gap-8 mb-5">
              <div className="flex items-center justify-center gap-4">
                <h1 className="text-2xl font-semibold text-white">This thought is empty.</h1>
                <i className="fa-solid fa-thought-bubble text-5xl text-[var(--accent)]"></i>
              </div>
              <div className="text-center">
                <p className="text-slate-400">
                 Enter what you are thinking into the the text bar to begin this thought.
                </p>
              </div>
            </div>
          ) : (
            <div className="chatbox w-full h-full ">
              <div className="sentMessages w-full" ref={sentMessagesRef}>
                {messages.map((msg) => (
                  <div key={msg.MessageID} className="sentMessage flex flex-col justify-start items-start w-full">
                    <div className="flex items-start justify-between w-full" onMouseEnter={() => setHoveredId(msg.MessageID)} onMouseLeave={() => setHoveredId(null)}>
                      <span className="messageTimestamp">
                        {msg.DateSent ? new Date(msg.DateSent).toLocaleString() : ""}
                      </span>
                      <div className={`editGroup ${hoveredId === msg.MessageID ? "editGroupVisible" : ""}`}>
                        <div className="editGroupIcon" onClick={() => deleteMessage(msg.MessageID)}>
                          <i className="fa-regular fa-trash-can"></i>
                        </div>
                      </div>
                    </div>
                    {msg.Message && msg.ContentFormat === "html" ? (
                      <div
                        className="messageString"
                        dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(msg.Message) }}
                      />
                    ) : (
                      msg.Message && <div className="messageString">{msg.Message}</div>
                    )}
                    {msg.Attachments && msg.Attachments.length > 0 && (
                      <div
                        className="messageAttachments"
                        style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}
                      >
                        {msg.Attachments.map((url, i) =>
                          isImageAttachment(url) ? (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt="Attachment"
                                className="messageAttachmentImage"
                                style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px" }}
                              />
                            </a>
                          ) : (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="messageAttachmentLink"
                              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                            >
                              <i className="fa-regular fa-paperclip"></i> Attachment
                            </a>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingAttachments.map((att) => (
                <div
                  key={att.url}
                  className="modalChip"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "fit-content" }}
                >
                  <i className="fa-regular fa-paperclip"></i>
                  <span>{att.name}</span>
                  <i
                    className="fa-solid fa-xmark cursor-pointer"
                    onClick={() => removePendingAttachment(att.url)}
                  ></i>
                </div>
              ))}
            </div>
          )}

          <div className="sendWrapper w-full flex gap-3">
            <div id="fileInput">
              <input
                type="file"
                id="attachFile"
                ref={fileInputRef}
                onChange={handleFileSelected}
                accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
                multiple
                style={{ display: "none" }}
              />
              <button
                className="fileUploadButton"
                type="button"
                onClick={triggerFileSelect}
                disabled={uploading || pendingAttachments.length >= MAX_ATTACHMENTS}
              >
                {uploading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paperclip"></i>}
              </button>
            </div>

            <RichTextEditor
              ref={editorRef}
              placeholder="A Penny For Your Thoughts?"
              onChange={({ html, text }) => {
                setMessage(html);
                setMessageText(text);
              }}
              onSubmit={enteredMessage}
            />

            <button onClick={enteredMessage} id="sendChat" className="send" disabled={!messageText.trim() || uploading}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div id="rightSide" className={`sidebar dashBody flex-col ${activeTab === "details" ? "flex" : "hidden"} lg:flex`}>
          <h2 className="settingsSectionTitle"><i className="fa-regular fa-circle-info text-[var(--accent)]"></i> Detailed Information</h2>

          <section className="sidebarSection">
            <h3 className="modalFieldLabel">Categories</h3>
            {categories.length > 0 && (
              <div className="modalChipRow mb-2">
                {categories.map((cat) => (
                  <span key={cat.CategoryID} className="modalChip modalChipRemovable">
                    {cat.CategoryName}
                    <i className="fa-solid fa-xmark" onClick={() => deleteCategory(cat.CategoryID)}></i>
                  </span>
                ))}
              </div>
            )}
            <div className="modalInlineAdd">
              <input type="text" className="modalFieldInput" value={addCat} onChange={(e) => setCat(e.target.value)} placeholder="New category" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
              <button type="button" onClick={addCategory} className="modalInlineAddBtn"><i className="fa-solid fa-plus"></i></button>
            </div>
          </section>

          <section className="sidebarSection">
            <h3 className="modalFieldLabel">Tags</h3>
            {tags.length > 0 && (
              <div className="modalChipRow mb-2">
                {tags.map((tag) => (
                  <span key={tag.TagID} className="modalChip modalChipRemovable">
                    {tag.TagName}
                    <i className="fa-solid fa-xmark" onClick={() => deleteTag(tag.TagID)}></i>
                  </span>
                ))}
              </div>
            )}
            <div className="modalInlineAdd">
              <input type="text" className="modalFieldInput" value={addTag} onChange={(e) => setTag(e.target.value)} placeholder="New tag" onKeyDown={(e) => e.key === "Enter" && addTags()} />
              <button type="button" onClick={addTags} className="modalInlineAddBtn"><i className="fa-solid fa-plus"></i></button>
            </div>
          </section>

          <section className="sidebarSection">
            <h3 className="modalFieldLabel">Lists</h3>
            {lists.length > 0 && (
              <div className="modalChipRow mb-2">
                {lists.map((list) => (
                  <span key={list.ListID} className="modalChip modalChipRemovable">
                    {list.ListName}
                    <i className="fa-solid fa-xmark" onClick={() => deleteList(list.ListID)}></i>
                  </span>
                ))}
              </div>
            )}
            <div className="modalInlineAdd">
              <input type="text" className="modalFieldInput" value={addList} onChange={(e) => setList(e.target.value)} placeholder="New list" onKeyDown={(e) => e.key === "Enter" && addLists()} />
              <button type="button" onClick={addLists} className="modalInlineAddBtn"><i className="fa-solid fa-plus"></i></button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Thought;
