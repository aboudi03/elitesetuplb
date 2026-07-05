"use client";

import React, { useEffect, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  FaBold,
  FaCheckSquare,
  FaHighlighter,
  FaItalic,
  FaListOl,
  FaListUl,
  FaPalette,
  FaUnderline,
} from "react-icons/fa";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeightClassName?: string;
};

const fonts = [
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Mono", value: "Consolas, monospace" },
];

const toolbarButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent-soft)]";

function decodeHtmlEntities(value: string) {
  if (!value) return "";

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function stripPastedThemeColors(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
    element.style.removeProperty("background");
    element.style.removeProperty("background-color");
    element.style.removeProperty("color");

    if (!element.getAttribute("style")?.trim()) {
      element.removeAttribute("style");
    }
  });

  template.content.querySelectorAll("[bgcolor], [color]").forEach((element) => {
    element.removeAttribute("bgcolor");
    element.removeAttribute("color");
  });

  return template.innerHTML;
}

const RichTextEditor = ({
  value,
  onChange,
  minHeightClassName = "min-h-[220px]",
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor || editor.innerHTML === value) return;

    editor.innerHTML = value || "";
  }, [value]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    const range = savedSelectionRef.current;

    if (!editor || !selection || !range) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const emitChange = () => {
    onChange(editorRef.current?.innerHTML || "");
    saveSelection();
  };

  const focusEditor = () => {
    editorRef.current?.focus();
    restoreSelection();
  };

  const runCommand = (command: string, commandValue?: string) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const insertChecklist = () => {
    focusEditor();
    document.execCommand(
      "insertHTML",
      false,
      '<ul data-list="checklist"><li>Checklist item</li></ul>'
    );
    emitChange();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const content = html
      ? stripPastedThemeColors(sanitizeHtml(decodeHtmlEntities(html)))
      : escapeHtml(decodeHtmlEntities(text)).replace(/\r?\n/g, "<br>");

    restoreSelection();
    document.execCommand("insertHTML", false, content);
    emitChange();
  };

  const handleToolbarMouseDown = (event: React.MouseEvent<HTMLButtonElement | HTMLLabelElement>) => {
    event.preventDefault();
    restoreSelection();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--site-border)] bg-[var(--site-panel)] p-2">
        <button
          type="button"
          className={toolbarButtonClassName}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("bold")}
          title="Bold"
          aria-label="Bold"
        >
          <FaBold />
        </button>
        <button
          type="button"
          className={toolbarButtonClassName}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("italic")}
          title="Italic"
          aria-label="Italic"
        >
          <FaItalic />
        </button>
        <button
          type="button"
          className={toolbarButtonClassName}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("underline")}
          title="Underline"
          aria-label="Underline"
        >
          <FaUnderline />
        </button>

        <select
          className="h-9 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-2 text-sm text-[var(--site-text)] outline-none focus:border-[var(--site-accent)]"
          defaultValue="p"
          onMouseDown={saveSelection}
          onChange={(event) => runCommand("formatBlock", event.target.value)}
          aria-label="Text style"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
        </select>

        <select
          className="h-9 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-2 text-sm text-[var(--site-text)] outline-none focus:border-[var(--site-accent)]"
          defaultValue={fonts[0].value}
          onMouseDown={saveSelection}
          onChange={(event) => runCommand("fontName", event.target.value)}
          aria-label="Font family"
        >
          {fonts.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={toolbarButtonClassName}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("insertUnorderedList")}
          title="Bullet list"
          aria-label="Bullet list"
        >
          <FaListUl />
        </button>
        <button
          type="button"
          className={toolbarButtonClassName}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("insertOrderedList")}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <FaListOl />
        </button>
        <button
          type="button"
          className={toolbarButtonClassName}
          onMouseDown={handleToolbarMouseDown}
          onClick={insertChecklist}
          title="Checklist"
          aria-label="Checklist"
        >
          <FaCheckSquare />
        </button>

        <label
          className={toolbarButtonClassName}
          title="Text color"
          aria-label="Text color"
          onMouseDown={saveSelection}
        >
          <FaPalette />
          <input
            type="color"
            className="sr-only"
            onChange={(event) => runCommand("foreColor", event.target.value)}
          />
        </label>
        <label
          className={toolbarButtonClassName}
          title="Highlight"
          aria-label="Highlight"
          onMouseDown={saveSelection}
        >
          <FaHighlighter />
          <input
            type="color"
            className="sr-only"
            defaultValue="#fff3a3"
            onChange={(event) => runCommand("hiliteColor", event.target.value)}
          />
        </label>
      </div>

      <div
        ref={editorRef}
        className={`rich-text-content block w-full overflow-auto px-4 py-3 text-base text-[var(--site-text)] outline-none ${minHeightClassName}`}
        dir="ltr"
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePaste}
        onInput={emitChange}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={emitChange}
        style={{ direction: "ltr", textAlign: "left" }}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    </div>
  );
};

export default RichTextEditor;
