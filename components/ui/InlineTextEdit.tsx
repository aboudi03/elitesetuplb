"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaPen, FaSpinner } from "react-icons/fa6";

type InlineTextEditProps = {
  value: string;
  label?: string;
  type?: "text" | "number";
  inputClassName?: string;
  displayValue?: string;
  min?: number;
  step?: number;
  onConfirm: (value: string) => Promise<void> | void;
};

export default function InlineTextEdit({
  value,
  label = "value",
  type = "text",
  inputClassName = "",
  displayValue,
  min,
  step,
  onConfirm,
}: InlineTextEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const hasChanged = draftValue !== value;
  const parsedNumber = Number(draftValue);
  const isValid =
    type !== "number" || (Number.isFinite(parsedNumber) && (min === undefined || parsedNumber >= min));

  const finishEditing = async () => {
    if (!hasChanged) {
      setIsEditing(false);
      return;
    }

    if (!isValid) {
      setDraftValue(value);
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onConfirm(draftValue);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setDraftValue(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsEditing(true);
        }}
        className="group inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-sm font-medium text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)]"
        aria-label={`Edit ${label}`}
      >
        <span className="block min-w-0 truncate">{displayValue ?? value ?? "-"}</span>
        <FaPen className="text-xs opacity-0 transition group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
      <input
        ref={inputRef}
        type={type}
        min={min}
        step={step}
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        onBlur={() => void finishEditing()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void finishEditing();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            cancelEditing();
          }
        }}
        className={`h-9 min-w-[6rem] rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-2.5 text-center text-sm font-semibold text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)] ${inputClassName}`}
      />
      {isSaving ? <FaSpinner className="ml-2 animate-spin text-[var(--site-accent)]" /> : null}
    </div>
  );
}
