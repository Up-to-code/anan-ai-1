"use client";

import { cn } from "@/lib/utils";

export interface TableColumn {
  header: string;
  accessor: string;
  align?: "right" | "left" | "center";
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, string | number | boolean | null | undefined>[];
}

export function TableView({ data }: { data: TableData }) {
  return (
    <div className="mt-3 mb-3 w-full overflow-x-auto rounded-xl border border-border/50 bg-card">
      <div className="min-w-full">
        <table className="w-full text-sm sm:text-base" dir="rtl">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {data.columns.map((column, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 sm:px-5 sm:py-4 text-right font-semibold text-foreground whitespace-nowrap leading-relaxed",
                    column.align === "left" && "text-left",
                    column.align === "center" && "text-center",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/30 hover:bg-muted/20 transition-colors"
              >
                {data.columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "px-4 py-3 sm:px-5 sm:py-4 text-right text-foreground/90 whitespace-nowrap leading-relaxed",
                      column.align === "left" && "text-left",
                      column.align === "center" && "text-center",
                    )}
                  >
                    {row[column.accessor] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
