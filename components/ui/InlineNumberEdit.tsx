"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaSpinner } from "react-icons/fa6";

type InlineNumberEditProps = {
  value: number;
  label?: string;
  min?: number;
  onConfirm: (value: number) => Promise<void> | void;
};

export default function InlineNumberEdit({
  value,
  label = "value",
  min = 0,
  onConfirm,
}: InlineNumberEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(value));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(String(value));
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const parsedDraftValue = Number(draftValue);
  const hasChanged = parsedDraftValue !== value;
  const isValidNumber = Number.isFinite(parsedDraftValue) && parsedDraftValue >= min;

  const finishEditing = async () => {
    if (!hasChanged) {
      setIsEditing(false);
      return;
    }

    if (!isValidNumber) {
      setDraftValue(String(value));
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onConfirm(parsedDraftValue);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setDraftValue(String(value));
    setIsEditing(false);
  };

  return (
      <div className="flex items-center justify-center gap-2">
        {isEditing ? (
          <div className="flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <input
              ref={inputRef}
              type="number"
              min={min}
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
              className="h-9 w-20 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-2 text-center text-sm font-semibold text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]"
            />
            {isSaving ? <FaSpinner className="ml-2 animate-spin text-[var(--site-accent)]" /> : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsEditing(true);
            }}
            className="rounded-md px-1.5 py-0.5 text-sm font-medium text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)]"
            aria-label={`Edit ${label}`}
          >
            {value} in stock
          </button>
        )}
      </div>
  );
}
