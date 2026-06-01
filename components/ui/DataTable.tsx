"use client";

import React, { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type DataTableSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  searchableText?: (row: T) => string;
  select?: {
    value: (row: T) => string;
    options: DataTableSelectOption[];
    onChange: (row: T, value: string) => void | Promise<void>;
    placeholder?: string;
    disabled?: (row: T) => boolean;
    className?: string;
  };
};

type DataTableProps<T> = {
  title?: string;
  description?: string;
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  actions?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  autoFilter?: boolean;
};

function getAccessorValue<T>(row: T, accessor?: keyof T | ((row: T) => React.ReactNode)) {
  if (!accessor) return null;
  if (typeof accessor === "function") return accessor(row);
  return row[accessor] as React.ReactNode;
}

function TableCellSelect<T>({
  row,
  select,
}: {
  row: T;
  select: NonNullable<DataTableColumn<T>["select"]>;
}) {
  const selectedValue = select.value(row);
  const selectedOption = select.options.find((option) => option.value === selectedValue);
  const isDisabled = select.disabled?.(row) ?? false;

  return (
    <Select
      value={selectedValue}
      onValueChange={(value) => select.onChange(row, value)}
      disabled={isDisabled}
    >
      <div className={`relative w-full min-w-[9rem] ${select.className || ""}`}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={select.placeholder || "Select"}>
            {selectedOption?.label || select.placeholder || "Select"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
            {select.options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
        </SelectContent>
      </div>
    </Select>
  );
}

export default function DataTable<T>({
  title,
  description,
  data,
  columns,
  getRowId,
  actions,
  loading = false,
  emptyMessage = "No rows found.",
  className = "",
  tableClassName = "",
  enableSearch = false,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  enableSelection = false,
  selectedIds,
  onSelectionChange,
  autoFilter = true,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  const currentSearch = searchValue ?? internalSearch;
  const currentSelectedIds = selectedIds ?? internalSelectedIds;

  const filteredData = useMemo(() => {
    if (!enableSearch || !autoFilter || !currentSearch.trim()) return data;

    const query = currentSearch.trim().toLowerCase();
    return data.filter((row) =>
      columns.some((column) => {
        const value = column.searchableText
          ? column.searchableText(row)
          : String(getAccessorValue(row, column.accessor) ?? "");
        return value.toLowerCase().includes(query);
      })
    );
  }, [autoFilter, columns, currentSearch, data, enableSearch]);

  const visibleIds = filteredData.map(getRowId);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => currentSelectedIds.includes(id));

  const setSelectedIds = (ids: string[]) => {
    if (onSelectionChange) {
      onSelectionChange(ids);
    } else {
      setInternalSelectedIds(ids);
    }
  };

  const updateSearch = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearch(value);
    }
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(currentSelectedIds.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds([...new Set([...currentSelectedIds, ...visibleIds])]);
  };

  const toggleRow = (id: string) => {
    setSelectedIds(
      currentSelectedIds.includes(id)
        ? currentSelectedIds.filter((selectedId) => selectedId !== id)
        : [...currentSelectedIds, id]
    );
  };

  return (
    <section className={`w-full ${className}`}>
      {(title || description || actions || enableSearch) && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>}
            {description && (
              <p className="mt-2 max-w-3xl text-sm text-[var(--site-muted)]">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {enableSearch && (
              <input
                type="search"
                value={currentSearch}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-h-11 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-base text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]"
              />
            )}
            {actions}
          </div>
        </div>
      )}

      <div className="relative overflow-visible rounded-md border border-[var(--site-border)] bg-[var(--site-panel)]">
        <div className="overflow-x-auto">
          <table className={`admin-data-table w-full min-w-max text-base ${tableClassName}`}>
          <thead>
            <tr>
              {enableSelection && (
                <th className="w-12 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-4 text-center text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)] ${column.headerClassName || ""}`}
                >
                  <div className="flex w-full items-center justify-center text-center">
                    {column.header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0)}
                  className="px-4 py-10 text-center text-[var(--site-muted)]"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0)}
                  className="px-4 py-10 text-center text-[var(--site-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row) => {
                const rowId = getRowId(row);

                return (
                  <tr key={rowId} className="border-t border-[var(--site-border)] transition">
                    {enableSelection && (
                      <td className="px-4 py-3 text-center align-middle">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={currentSelectedIds.includes(rowId)}
                          onChange={() => toggleRow(rowId)}
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 text-center align-middle ${column.className || ""}`}
                      >
                        <div className="flex w-full items-center justify-center text-center">
                          {column.select ? (
                            <TableCellSelect row={row} select={column.select} />
                          ) : column.cell ? (
                            column.cell(row)
                          ) : (
                            getAccessorValue(row, column.accessor)
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
