import { forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

function ToolbarButton({ active, disabled, onClick, icon, title }) {
  return (
    <button
      type="button"
      className={`richTextToolbarBtn ${active ? "richTextToolbarBtnActive" : ""}`}
      title={title}
      aria-label={title}
      disabled={disabled}
      // Prevent the editor from losing focus/selection before the command runs.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <i className={icon}></i>
    </button>
  );
}

// Compact WYSIWYG editor for the Thought chat composer. Renders its own
// formatting toolbar; `onSubmit` fires on Enter (Shift+Enter inserts a
// newline instead, matching most chat apps).
const RichTextEditor = forwardRef(function RichTextEditor(
  { placeholder = "Type a message…", onChange, onSubmit },
  ref
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        link: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.({ html: editor.getHTML(), text: editor.getText() });
    },
    editorProps: {
      attributes: { class: "richTextContent", id: "messageInput" },
      handleKeyDown: (_view, event) => {
        if (event.key !== "Enter" || event.shiftKey) return false;

        // Inside a list item or blockquote, Enter should do what it always
        // does in a rich text editor (new list item / new line) rather than
        // send — otherwise there'd be no way to write more than one bullet.
        if (editor?.isActive("listItem") || editor?.isActive("blockquote")) {
          return false;
        }

        event.preventDefault();
        onSubmit?.();
        return true;
      },
    },
  });

  useImperativeHandle(ref, () => ({
    clear: () => editor?.commands.clearContent(),
    focus: () => editor?.commands.focus(),
  }));

  if (!editor) return null;

  return (
    <div className="richTextEditor">
      <div className="richTextToolbar">
        <ToolbarButton
          title="Bold"
          icon="fa-solid fa-bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          title="Italic"
          icon="fa-solid fa-italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          title="Underline"
          icon="fa-solid fa-underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          title="Strikethrough"
          icon="fa-solid fa-strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <span className="richTextToolbarDivider"></span>
        <ToolbarButton
          title="Bulleted list"
          icon="fa-solid fa-list-ul"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          title="Numbered list"
          icon="fa-solid fa-list-ol"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          title="Quote"
          icon="fa-solid fa-quote-left"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          title="Inline code"
          icon="fa-solid fa-code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
      </div>
      <EditorContent editor={editor} className="richTextContentWrapper" />
    </div>
  );
});

export default RichTextEditor;
