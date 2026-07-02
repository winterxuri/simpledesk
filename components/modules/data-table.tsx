import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  selectedIds,
  onSelect,
  empty
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  selectedIds?: string[];
  onSelect?: (id: string, selected: boolean) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return <div>{empty}</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              {onSelect ? <th className="w-10 px-4 py-3" /> : null}
              {columns.map((column) => (
                <th key={column.key} className={cn("px-4 py-3 font-medium", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-muted/35">
                {onSelect ? (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={selectedIds?.includes(row.id) ?? false}
                      onChange={(event) => onSelect(row.id, event.target.checked)}
                    />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3 align-middle", column.className)}>
                    {column.cell(row)}
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
