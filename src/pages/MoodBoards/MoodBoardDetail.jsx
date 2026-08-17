import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import DashMenu from "../../components/DashMenu.jsx";
import { buildApiUrl } from "../../utils/api.js";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_ATTACHMENTS = 5;

const isImageAttachment = (attachment) => /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment || "");

function BlockDropZone({ sectionId, children }) {
  const { setNodeRef } = useDroppable({
    id: `sectionbody-${sectionId}`,
    data: { type: "section-container", sectionId },
  });
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 p-3 min-h-[90px] flex-1">
      {children}
    </div>
  );
}

function SortableBlockCard({ block, onDelete, onStartEdit, onSaveText, isEditing, editingText, setEditingText }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `block-${block.BlockID}`,
    data: { type: "block", blockId: block.BlockID, sectionId: block.SectionID },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-slate-800/70 border border-slate-700 rounded-lg p-2 flex flex-col gap-1 group ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white text-xs">
          <i className="fa-solid fa-grip-vertical"></i>
        </span>
        <button
          onClick={() => onDelete(block.BlockID, block.SectionID)}
          className="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <i className="fa-regular fa-trash text-xs"></i>
        </button>
      </div>

      {block.BlockType === "image" && (
        <>
          <a href={block.ImageUrl} target="_blank" rel="noopener noreferrer">
            <img src={block.ImageUrl} alt={block.Caption || "Board image"} className="w-full rounded-md object-cover max-h-48" />
          </a>
          {block.Caption && <p className="text-xs text-slate-400">{block.Caption}</p>}
        </>
      )}

      {block.BlockType === "link" && (
        <a
          href={block.LinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[var(--accent)] hover:underline break-all text-sm"
        >
          <i className="fa-regular fa-link"></i> {block.LinkLabel || block.LinkUrl}
        </a>
      )}

      {block.BlockType === "text" &&
        (isEditing ? (
          <textarea
            className="bg-slate-900 text-white text-sm rounded-md p-2 w-full outline-none border border-[var(--accent)] resize-none"
            value={editingText}
            autoFocus
            rows={3}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => onSaveText(block.BlockID, block.SectionID)}
          />
        ) : (
          <p className="text-sm text-white whitespace-pre-wrap cursor-text" onClick={() => onStartEdit(block)}>
            {block.TextContent}
          </p>
        ))}

      {block.BlockType === "thought" && (
        <Link
          to={`/thought/${encodeURIComponent(block.ThoughtName || "")}`}
          className="flex items-center gap-2 text-[var(--accent)] hover:underline text-sm"
        >
          <i className="fa-solid fa-brain"></i> {block.ThoughtName || "View thought"}
        </Link>
      )}
    </div>
  );
}

function SortableSectionColumn({ section, onRename, onColorChange, onDelete, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `section-${section.SectionID}`,
    data: { type: "section", sectionId: section.SectionID },
  });

  const [nameInput, setNameInput] = useState(section.SectionName);
  useEffect(() => {
    setNameInput(section.SectionName);
  }, [section.SectionName]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: section.BackgroundColor,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-700 flex flex-col ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center gap-2 p-3 border-b border-slate-700/60">
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-white">
          <i className="fa-solid fa-grip-vertical"></i>
        </span>
        <input
          className="bg-transparent !text-white font-semibold flex-1 min-w-0 outline-none"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={() => {
            const trimmed = nameInput.trim();
            if (trimmed && trimmed !== section.SectionName) onRename(trimmed);
            else setNameInput(section.SectionName);
          }}
        />
        <label
          className="relative w-6 h-6 rounded-full border-2 border-slate-500 hover:border-white transition cursor-pointer shrink-0 flex items-center justify-center"
          style={{ backgroundColor: section.BackgroundColor }}
          title="Section color"
        >
          <i
            className="fa-solid fa-palette text-[9px] text-white pointer-events-none"
            style={{ textShadow: "0 0 2px rgba(0,0,0,0.9)" }}
          ></i>
          <input
            type="color"
            value={section.BackgroundColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <button onClick={onDelete} className="text-slate-300 hover:text-red-400 transition cursor-pointer">
          <i className="fa-regular fa-trash"></i>
        </button>
      </div>
      {children}
    </div>
  );
}

function MoodBoardDetail() {
  const { moodBoardId } = useParams();
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const apiBase = buildApiUrl();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [board, setBoard] = useState(null);
  const [sections, setSections] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [error, setError] = useState("");

  const [boardNameInput, setBoardNameInput] = useState("");

  const [userThoughts, setUserThoughts] = useState(null);
  const [addBlockForm, setAddBlockForm] = useState(null); // { sectionId, type, linkUrl, linkLabel, thoughtId }
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const imageFileInputRef = useRef(null);
  const [imageUploadSectionId, setImageUploadSectionId] = useState(null);

  // ---------- Chat ----------
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [chatUploading, setChatUploading] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const chatFileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ---------- Load board + chat ----------
  const loadBoard = async () => {
    setLoadingBoard(true);
    try {
      const res = await fetch(`${apiBase}/moodboards/${moodBoardId}`, { headers: authHeader });
      const data = await res.json();
      if (data.success) {
        setBoard(data.board);
        setBoardNameInput(data.board.BoardName);
        setSections(data.sections);
      } else {
        setError(data.error || "Failed to load mood board");
      }
    } catch (err) {
      console.error("Error loading mood board:", err);
      setError("Failed to load mood board");
    } finally {
      setLoadingBoard(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch(`${apiBase}/moodboards/${moodBoardId}/messages`, { headers: authHeader });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      } else if (res.status === 403) {
        navigate("/Unauthorized");
      }
    } catch (err) {
      console.error("Error loading mood board messages:", err);
    }
  };

  useEffect(() => {
    if (loading || !token) return;
    loadBoard();
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, token, moodBoardId]);

  // ---------- Board rename ----------
  const saveBoardName = async () => {
    const name = boardNameInput.trim();
    if (!board || !name || name === board.BoardName) {
      setBoardNameInput(board?.BoardName || "");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/moodboards/${moodBoardId}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ boardName: name }),
      });
      const data = await res.json();
      if (data.success) setBoard(data.board);
      else setError(data.error || "Failed to rename board");
    } catch (err) {
      console.error("Error renaming board:", err);
      setError("Failed to rename board");
    }
  };

  const deleteBoard = async () => {
    if (!window.confirm("Delete this entire mood board? This can't be undone.")) return;
    try {
      const res = await fetch(`${apiBase}/moodboards/${moodBoardId}`, { method: "DELETE", headers: authHeader });
      const data = await res.json();
      if (data.success) navigate("/mood-boards");
      else setError(data.error || "Failed to delete board");
    } catch (err) {
      console.error("Error deleting board:", err);
      setError("Failed to delete board");
    }
  };

  // ---------- Sections ----------
  const addSection = async () => {
    try {
      const res = await fetch(`${apiBase}/moodboards/${moodBoardId}/sections`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ sectionName: "New Section" }),
      });
      const data = await res.json();
      if (data.success) setSections((prev) => [...prev, data.section]);
      else setError(data.error || "Failed to add section");
    } catch (err) {
      console.error("Error adding section:", err);
      setError("Failed to add section");
    }
  };

  const updateSection = async (sectionId, fields) => {
    const section = sections.find((s) => s.SectionID === sectionId);
    if (!section) return;
    const body = {
      sectionName: fields.sectionName ?? section.SectionName,
      backgroundColor: fields.backgroundColor ?? section.BackgroundColor,
    };
    try {
      const res = await fetch(`${apiBase}/mood-board-sections/${sectionId}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) =>
          prev.map((s) => (s.SectionID === sectionId ? { ...s, SectionName: data.section.SectionName, BackgroundColor: data.section.BackgroundColor } : s))
        );
      } else {
        setError(data.error || "Failed to update section");
      }
    } catch (err) {
      console.error("Error updating section:", err);
      setError("Failed to update section");
    }
  };

  const deleteSection = async (sectionId) => {
    if (!window.confirm("Delete this section and all its blocks?")) return;
    try {
      const res = await fetch(`${apiBase}/mood-board-sections/${sectionId}`, { method: "DELETE", headers: authHeader });
      const data = await res.json();
      if (data.success) setSections((prev) => prev.filter((s) => s.SectionID !== sectionId));
      else setError(data.error || "Failed to delete section");
    } catch (err) {
      console.error("Error deleting section:", err);
      setError("Failed to delete section");
    }
  };

  // ---------- Blocks ----------
  const addBlock = async (sectionId, payload) => {
    try {
      const res = await fetch(`${apiBase}/mood-board-sections/${sectionId}/blocks`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => prev.map((s) => (s.SectionID === sectionId ? { ...s, blocks: [...s.blocks, data.block] } : s)));
        return true;
      }
      setError(data.error || data.details || "Failed to add block");
      return false;
    } catch (err) {
      console.error("Error adding block:", err);
      setError("Failed to add block");
      return false;
    }
  };

  const deleteBlock = async (blockId, sectionId) => {
    try {
      const res = await fetch(`${apiBase}/mood-board-blocks/${blockId}`, { method: "DELETE", headers: authHeader });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => prev.map((s) => (s.SectionID === sectionId ? { ...s, blocks: s.blocks.filter((b) => b.BlockID !== blockId) } : s)));
      } else {
        setError(data.error || "Failed to delete block");
      }
    } catch (err) {
      console.error("Error deleting block:", err);
      setError("Failed to delete block");
    }
  };

  const startEditText = (block) => {
    setEditingBlockId(block.BlockID);
    setEditingText(block.TextContent || "");
  };

  const saveBlockText = async (blockId, sectionId) => {
    const textContent = editingText.trim();
    setEditingBlockId(null);
    if (!textContent) return;
    try {
      const res = await fetch(`${apiBase}/mood-board-blocks/${blockId}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ textContent }),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) =>
          prev.map((s) => (s.SectionID === sectionId ? { ...s, blocks: s.blocks.map((b) => (b.BlockID === blockId ? data.block : b)) } : s))
        );
      } else {
        setError(data.error || "Failed to update text");
      }
    } catch (err) {
      console.error("Error updating block text:", err);
      setError("Failed to update text");
    }
  };

  const addTextBlock = async (sectionId) => {
    await addBlock(sectionId, { blockType: "text", textContent: "Click to edit..." });
  };

  const triggerImageUpload = (sectionId) => {
    setImageUploadSectionId(sectionId);
    imageFileInputRef.current?.click();
  };

  const handleImageFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const sectionId = imageUploadSectionId;
    setImageUploadSectionId(null);
    if (files.length === 0 || !sectionId) return;

    const filesToUpload = files.slice(0, MAX_ATTACHMENTS);
    if (files.length > filesToUpload.length) {
      setError(`You can upload up to ${MAX_ATTACHMENTS} images at once.`);
    }

    const oversized = filesToUpload.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" is too large (max 10MB)`);
      return;
    }

    const formData = new FormData();
    filesToUpload.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`${apiBase}/upload`, { method: "POST", headers: authHeader, body: formData });
      const data = await res.json();
      if (data.success && data.urls?.length) {
        for (const url of data.urls) {
          await addBlock(sectionId, { blockType: "image", imageUrl: url });
        }
      } else {
        setError(data.error || "Failed to upload image(s)");
      }
    } catch (err) {
      console.error("Error uploading images:", err);
      setError("Failed to upload image(s)");
    }
  };

  const openLinkForm = (sectionId) => setAddBlockForm({ sectionId, type: "link", linkUrl: "", linkLabel: "" });

  const submitLinkBlock = async () => {
    if (!addBlockForm) return;
    const { sectionId, linkUrl, linkLabel } = addBlockForm;
    if (!linkUrl.trim()) {
      setError("Enter a URL for the link.");
      return;
    }
    const ok = await addBlock(sectionId, { blockType: "link", linkUrl: linkUrl.trim(), linkLabel: linkLabel.trim() || undefined });
    if (ok) setAddBlockForm(null);
  };

  const openThoughtForm = async (sectionId) => {
    if (userThoughts === null) {
      try {
        const res = await fetch(`${apiBase}/thoughts`, { headers: authHeader });
        const data = await res.json();
        setUserThoughts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading thoughts:", err);
        setUserThoughts([]);
      }
    }
    setAddBlockForm({ sectionId, type: "thought", thoughtId: "" });
  };

  const submitThoughtBlock = async () => {
    if (!addBlockForm) return;
    const { sectionId, thoughtId } = addBlockForm;
    if (!thoughtId) {
      setError("Pick a thought to reference.");
      return;
    }
    const ok = await addBlock(sectionId, { blockType: "thought", thoughtId: Number(thoughtId) });
    if (ok) setAddBlockForm(null);
  };

  // ---------- Drag and drop ----------
  const reorderSectionsOnServer = async (orderedSections) => {
    try {
      await fetch(`${apiBase}/moodboards/${moodBoardId}/sections/order`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: orderedSections.map((s) => s.SectionID) }),
      });
    } catch (err) {
      console.error("Error saving section order:", err);
    }
  };

  const reorderBlocksOnServer = async (sectionId, blockIds) => {
    if (blockIds.length === 0) return;
    try {
      await fetch(`${apiBase}/mood-board-sections/${sectionId}/blocks/order`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ blockIds }),
      });
    } catch (err) {
      console.error("Error saving block order:", err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;

    if (activeType === "section") {
      // `over` may be the section itself, its (empty) block drop zone, or a block
      // inside it — all three carry `sectionId` in their data, so read that
      // generically rather than requiring an exact "section" type match.
      const destSectionId = over.data.current?.sectionId;
      if (destSectionId == null) return;
      const oldIndex = sections.findIndex((s) => s.SectionID === active.data.current.sectionId);
      const newIndex = sections.findIndex((s) => s.SectionID === destSectionId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const reordered = arrayMove(sections, oldIndex, newIndex);
      setSections(reordered);
      reorderSectionsOnServer(reordered);
      return;
    }

    if (activeType === "block") {
      const sourceSectionId = active.data.current.sectionId;
      const destSectionId = over.data.current?.sectionId;
      if (!destSectionId) return;

      if (sourceSectionId === destSectionId) {
        // Reordering within one section: source and dest are the same array,
        // so this must use arrayMove rather than a splice-out/splice-in pair
        // (which would cancel itself out against a shared array reference).
        setSections((prev) => {
          const sectionIndex = prev.findIndex((s) => s.SectionID === sourceSectionId);
          if (sectionIndex === -1) return prev;
          const section = prev[sectionIndex];

          const oldIndex = section.blocks.findIndex((b) => `block-${b.BlockID}` === active.id);
          const newIndex = section.blocks.findIndex((b) => `block-${b.BlockID}` === over.id);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

          const reorderedBlocks = arrayMove(section.blocks, oldIndex, newIndex);
          const next = [...prev];
          next[sectionIndex] = { ...section, blocks: reorderedBlocks };

          reorderBlocksOnServer(sourceSectionId, reorderedBlocks.map((b) => b.BlockID));
          return next;
        });
        return;
      }

      setSections((prev) => {
        const next = prev.map((s) => ({ ...s, blocks: [...s.blocks] }));
        const source = next.find((s) => s.SectionID === sourceSectionId);
        const dest = next.find((s) => s.SectionID === destSectionId);
        if (!source || !dest) return prev;

        const activeIndex = source.blocks.findIndex((b) => `block-${b.BlockID}` === active.id);
        if (activeIndex === -1) return prev;
        const [movedBlock] = source.blocks.splice(activeIndex, 1);

        const overBlockIndex = dest.blocks.findIndex((b) => `block-${b.BlockID}` === over.id);
        if (overBlockIndex === -1) {
          dest.blocks.push(movedBlock);
        } else {
          dest.blocks.splice(overBlockIndex, 0, movedBlock);
        }

        reorderBlocksOnServer(destSectionId, dest.blocks.map((b) => b.BlockID));
        reorderBlocksOnServer(sourceSectionId, source.blocks.map((b) => b.BlockID));

        return next;
      });
    }
  };

  // ---------- Chat ----------
  const triggerChatFileSelect = () => chatFileInputRef.current?.click();

  const handleChatFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const remainingSlots = MAX_ATTACHMENTS - pendingAttachments.length;
    if (remainingSlots <= 0) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const oversized = filesToUpload.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" is too large (max 10MB)`);
      return;
    }

    const formData = new FormData();
    filesToUpload.forEach((file) => formData.append("files", file));

    setChatUploading(true);
    try {
      const res = await fetch(`${apiBase}/upload`, { method: "POST", headers: authHeader, body: formData });
      const data = await res.json();
      if (data.success) {
        const uploaded = data.urls.map((url, i) => ({ url, name: filesToUpload[i].name, type: filesToUpload[i].type }));
        setPendingAttachments((prev) => [...prev, ...uploaded]);
      } else {
        setError(data.error || "Could not upload file(s).");
      }
    } catch (err) {
      console.error("Error uploading chat attachment:", err);
      setError("Could not upload file(s).");
    } finally {
      setChatUploading(false);
    }
  };

  const removePendingAttachment = (url) => setPendingAttachments((prev) => prev.filter((a) => a.url !== url));

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    const attachmentUrls = pendingAttachments.map((a) => a.url);
    const messageText = chatMessage;
    setChatMessage("");
    setPendingAttachments([]);

    try {
      const res = await fetch(`${apiBase}/moodboards/${moodBoardId}/messages`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, attachments: attachmentUrls }),
      });
      const data = await res.json();
      if (data.success && data.newMessage) {
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        setError(data.error || "Could not save your message.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Could not save your message.");
    }
  };

  const deleteChatMessage = async (messageId) => {
    try {
      const res = await fetch(`${apiBase}/mood-board-messages/${messageId}`, { method: "DELETE", headers: authHeader });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.MessageID !== messageId));
      } else {
        setError(data.error || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      setError("Failed to delete message");
    }
  };

  if (loading || loadingBoard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user || !board) return null;

  const sectionSortableIds = sections.map((s) => `section-${s.SectionID}`);

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full ml flex flex-col" style={{ height: "100vh" }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 pb-3 shrink-0 gap-4">
            <Link to="/mood-boards" className="backtodashbtn flex items-center justify-center">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="dashBreadcrumb">
                <Link to="/mood-boards">Mood Boards</Link> <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i>{" "}
                <span>{board.BoardName}</span>
              </div>
              <input
                className="text-3xl font-semibold !text-white bg-transparent outline-none w-full"
                value={boardNameInput}
                onChange={(e) => setBoardNameInput(e.target.value)}
                onBlur={saveBoardName}
              />
            </div>
            <button onClick={deleteBoard} className="text-red-400 hover:text-red-300 transition flex items-center gap-2 cursor-pointer shrink-0">
              <i className="fa-regular fa-trash"></i> <span className="hidden sm:inline">Delete Board</span>
            </button>
          </div>

          {error && <p className="text-red-500 text-sm px-6">{error}</p>}

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sectionSortableIds} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                  {sections.map((section) => (
                    <SortableSectionColumn
                      key={section.SectionID}
                      section={section}
                      onRename={(name) => updateSection(section.SectionID, { sectionName: name })}
                      onColorChange={(color) => updateSection(section.SectionID, { backgroundColor: color })}
                      onDelete={() => deleteSection(section.SectionID)}
                    >
                      <div className="p-3 border-b border-slate-700/60 flex flex-col gap-2">
                        {addBlockForm?.sectionId === section.SectionID && addBlockForm.type === "link" && (
                          <div className="flex flex-col gap-2 mb-1">
                            <input
                              className="modalFieldInput"
                              placeholder="https://..."
                              value={addBlockForm.linkUrl}
                              onChange={(e) => setAddBlockForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                            />
                            <input
                              className="modalFieldInput"
                              placeholder="Label (optional)"
                              value={addBlockForm.linkLabel}
                              onChange={(e) => setAddBlockForm((prev) => ({ ...prev, linkLabel: e.target.value }))}
                            />
                            <div className="flex gap-2">
                              <button onClick={submitLinkBlock} className="modalPrimaryButton" style={{ width: "auto" }}>
                                Add
                              </button>
                              <button onClick={() => setAddBlockForm(null)} className="modalTextLink">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {addBlockForm?.sectionId === section.SectionID && addBlockForm.type === "thought" && (
                          <div className="flex flex-col gap-2 mb-1">
                            <select
                              className="modalFieldInput"
                              value={addBlockForm.thoughtId}
                              onChange={(e) => setAddBlockForm((prev) => ({ ...prev, thoughtId: e.target.value }))}
                            >
                              <option value="">Select a thought...</option>
                              {(userThoughts || []).map((t) => (
                                <option key={t.ThoughtID} value={t.ThoughtID}>
                                  {t.ThoughtName}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button onClick={submitThoughtBlock} className="modalPrimaryButton" style={{ width: "auto" }}>
                                Add
                              </button>
                              <button onClick={() => setAddBlockForm(null)} className="modalTextLink">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-around text-slate-300">
                          <button
                            onClick={() => triggerImageUpload(section.SectionID)}
                            title="Add image"
                            className="flex flex-col items-center gap-1 hover:text-white transition cursor-pointer"
                          >
                            <i className="fa-regular fa-image"></i>
                            <span className="text-[10px] text-slate-400">Image</span>
                          </button>
                          <button
                            onClick={() => openLinkForm(section.SectionID)}
                            title="Add link"
                            className="flex flex-col items-center gap-1 hover:text-white transition cursor-pointer"
                          >
                            <i className="fa-regular fa-link"></i>
                            <span className="text-[10px] text-slate-400">Link</span>
                          </button>
                          <button
                            onClick={() => addTextBlock(section.SectionID)}
                            title="Add text"
                            className="flex flex-col items-center gap-1 hover:text-white transition cursor-pointer"
                          >
                            <i className="fa-regular fa-text"></i>
                            <span className="text-[10px] text-slate-400">Text</span>
                          </button>
                          <button
                            onClick={() => openThoughtForm(section.SectionID)}
                            title="Add thought"
                            className="flex flex-col items-center gap-1 hover:text-white transition cursor-pointer"
                          >
                            <i className="fa-solid fa-brain"></i>
                            <span className="text-[10px] text-slate-400">Thought</span>
                          </button>
                        </div>
                      </div>

                      <SortableContext
                        items={section.blocks.map((b) => `block-${b.BlockID}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <BlockDropZone sectionId={section.SectionID}>
                          {section.blocks.map((block) => (
                            <SortableBlockCard
                              key={block.BlockID}
                              block={block}
                              onDelete={deleteBlock}
                              onStartEdit={startEditText}
                              onSaveText={saveBlockText}
                              isEditing={editingBlockId === block.BlockID}
                              editingText={editingText}
                              setEditingText={setEditingText}
                            />
                          ))}
                        </BlockDropZone>
                      </SortableContext>
                    </SortableSectionColumn>
                  ))}

                  <button
                    onClick={addSection}
                    className="rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition flex items-center justify-center gap-2 h-24 cursor-pointer"
                  >
                    <i className="fa-regular fa-plus"></i> Add section
                  </button>
                </div>
              </SortableContext>
            </DndContext>

          </div>

          <input
            type="file"
            ref={imageFileInputRef}
            onChange={handleImageFileSelected}
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            style={{ display: "none" }}
          />

          {/* Chat */}
          <div className="shrink-0 border-t border-slate-700 flex flex-col" style={{ height: "480px" }}>
            <div className="chatbox w-full flex-1 overflow-y-auto px-6 pt-3">
              {messages.length === 0 ? (
                <p className="modalEmptyNote">No messages yet — jot down thoughts about this board.</p>
              ) : (
                <div className="sentMessages w-full">
                  {messages.map((msg) => (
                    <div key={msg.MessageID} className="sentMessage flex flex-col justify-start items-start w-full">
                      <div
                        className="flex items-start justify-between w-full"
                        onMouseEnter={() => setHoveredMessageId(msg.MessageID)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        <span className="messageTimestamp">{msg.DateSent ? new Date(msg.DateSent).toLocaleString() : ""}</span>
                        <div className={`editGroup ${hoveredMessageId === msg.MessageID ? "editGroupVisible" : ""}`}>
                          <div className="editGroupIcon" onClick={() => deleteChatMessage(msg.MessageID)}>
                            <i className="fa-regular fa-trash-can"></i>
                          </div>
                        </div>
                      </div>
                      {msg.Message && <div className="messageString">{msg.Message}</div>}
                      {msg.Attachments && msg.Attachments.length > 0 && (
                        <div className="messageAttachments" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                          {msg.Attachments.map((url, i) =>
                            isImageAttachment(url) ? (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt="Attachment"
                                  className="messageAttachmentImage"
                                  style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
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
              )}
            </div>

            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 pt-2">
                {pendingAttachments.map((att) => (
                  <div key={att.url} className="modalChip" style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "fit-content" }}>
                    <i className="fa-regular fa-paperclip"></i>
                    <span>{att.name}</span>
                    <i className="fa-solid fa-xmark cursor-pointer" onClick={() => removePendingAttachment(att.url)}></i>
                  </div>
                ))}
              </div>
            )}

            <div className="sendWrapper w-full flex gap-3 px-6 py-3">
              <div id="fileInput">
                <input
                  type="file"
                  ref={chatFileInputRef}
                  onChange={handleChatFileSelected}
                  accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
                  multiple
                  style={{ display: "none" }}
                />
                <button
                  className="fileUploadButton"
                  type="button"
                  onClick={triggerChatFileSelect}
                  disabled={chatUploading || pendingAttachments.length >= MAX_ATTACHMENTS}
                >
                  {chatUploading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paperclip"></i>}
                </button>
              </div>

              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Say something about this board..."
              />

              <button onClick={sendChatMessage} className="send" disabled={!chatMessage.trim() || chatUploading}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodBoardDetail;
