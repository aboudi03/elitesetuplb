"use client";

import React, { useEffect, useState } from "react";
import { FaCheck, FaPen, FaSpinner, FaXmark } from "react-icons/fa6";

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

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
    }
  }, [isEditing, value]);

  const hasChanged = draftValue !== value;
  const parsedNumber = Number(draftValue);
  const isValid =
    type !== "number" || (Number.isFinite(parsedNumber) && (min === undefined || parsedNumber >= min));

  const handleConfirm = async () => {
    if (!hasChanged || !isValid) return;

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
        className="group inline-flex max-w-full items-center gap-2 rounded-md px-2 py-1 text-left text-base font-medium text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)]"
        aria-label={`Edit ${label}`}
      >
        <span className="truncate">{displayValue ?? value ?? "-"}</span>
        <FaPen className="text-xs opacity-0 transition group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div
      className="flex items-center justify-center gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type={type}
        min={min}
        step={step}
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        className={`h-10 min-w-[7rem] rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-center text-base font-semibold text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)] ${inputClassName}`}
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!hasChanged || !isValid || isSaving}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Confirm ${label} update`}
      >
        {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
      </button>
      <button
        type="button"
        onClick={cancelEditing}
        disabled={isSaving}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-muted)] transition hover:text-[var(--site-text)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Cancel ${label} update`}
      >
        <FaXmark />
      </button>
    </div>
  );
}
