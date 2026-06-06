"use client";

import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type InlineSelectEditProps = {
  value: string;
  displayValue?: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => Promise<void> | void;
};

export default function InlineSelectEdit({
  value,
  displayValue,
  options,
  onChange,
}: InlineSelectEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return isEditing ? (
    <div className="min-w-[9rem]">
      <Select
        value={value}
        onValueChange={async (nextValue) => {
          await onChange(nextValue);
          setIsEditing(false);
        }}
        open={isEditing}
        onOpenChange={setIsEditing}
      >
        <SelectTrigger className="w-full">
          <SelectValue>{selectedOption?.label || displayValue || value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
      className="rounded-md px-2 py-1 text-base font-medium text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)]"
    >
      {displayValue || selectedOption?.label || value}
    </button>
  );
}
