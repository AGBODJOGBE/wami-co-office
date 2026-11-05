"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
}

/**
 * Tableau simple : défile horizontalement sur petit écran.
 * `onSelect` rend chaque ligne activable au clavier (bouton dans la 1re cellule).
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectedKey,
  onSelect,
  empty = "Aucun élément.",
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  selectedKey?: string | null;
  onSelect?: (row: T) => void;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <div className="flex min-h-28 items-center justify-center text-sm text-muted">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn("whitespace-nowrap border-b border-[#E3E6EB] px-3 py-2.5 text-[11px] font-bold text-muted", c.align === "right" ? "text-right" : "text-left")}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const k = rowKey(row);
            const selected = selectedKey === k;
            return (
              <tr key={k} className={cn(selected && "bg-brand-soft", onSelect && !selected && "hover:bg-canvas")}>
                {columns.map((c, i) => (
                  <td
                    key={c.key}
                    className={cn("tabular whitespace-nowrap border-b border-field px-3 py-2 align-middle", c.align === "right" && "text-right")}
                  >
                    {i === 0 && onSelect ? (
                      <button type="button" onClick={() => onSelect(row)} aria-pressed={selected} className="text-left font-semibold hover:underline">
                        {c.render(row)}
                      </button>
                    ) : (
                      c.render(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
