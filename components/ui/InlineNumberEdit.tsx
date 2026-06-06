"use client";

import React, { useEffect, useState } from "react";
import { FaCheck, FaSpinner, FaXmark } from "react-icons/fa6";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(String(value));
    }
  }, [isEditing, value]);

  const parsedDraftValue = Number(draftValue);
  const hasChanged = parsedDraftValue !== value;
  const isValidNumber = Number.isFinite(parsedDraftValue) && parsedDraftValue >= min;

  const requestConfirm = () => {
    if (!hasChanged || !isValidNumber) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!isValidNumber) return;

    try {
      setIsSaving(true);
      await onConfirm(parsedDraftValue);
      setShowConfirm(false);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setDraftValue(String(value));
    setShowConfirm(false);
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {isEditing ? (
          <>
            <input
              type="number"
              min={min}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              className="h-10 w-24 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-center text-base font-semibold text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]"
            />
            <button
              type="button"
              onClick={requestConfirm}
              disabled={!hasChanged || !isValidNumber || isSaving}
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
          </>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsEditing(true);
            }}
            className="rounded-md px-2 py-1 text-base font-medium text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)]"
            aria-label={`Edit ${label}`}
          >
            {value} in stock
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[var(--site-accent-soft)]">
              <div className="flex h-full w-full items-center justify-center">
                {isSaving ? (
                  <FaSpinner className="animate-spin text-[var(--site-accent)]" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-[var(--site-accent)] shadow-[0_0_0_6px_rgba(0,0,0,0.05)]" />
                )}
              </div>
            </div>
            <h3 className="text-center text-xl font-semibold text-[var(--site-text)]">
              Confirm stock update
            </h3>
            <p className="mt-3 text-center text-sm leading-6 text-[var(--site-muted)]">
              Are you sure you want to change {label} from <strong>{value}</strong> to{" "}
              <strong>{parsedDraftValue}</strong>?
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="inline-flex min-w-24 items-center justify-center gap-2 rounded-md bg-[var(--site-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--site-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? <FaSpinner className="animate-spin" /> : null}
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
