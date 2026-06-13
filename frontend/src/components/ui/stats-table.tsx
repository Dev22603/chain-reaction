import { cn } from "@/lib/cn";

// Shared look for the stats tables on the leaderboard and player profile
// pages. Pages describe their columns as data; this component owns all the
// table markup (scroll wrapper, header row, cell padding).

export interface StatsColumn<T> {
  label: string;
  align?: "left" | "right";
  /** Extra classes for this column's body cells (e.g. accent colors). */
  cellClass?: string;
  render: (item: T, index: number) => React.ReactNode;
}

interface StatsTableProps<T> {
  /** Tailwind min-width class for the table, e.g. "min-w-[560px]". */
  minWidthClass: string;
  columns: Array<StatsColumn<T>>;
  rows: T[];
  rowKey: (item: T) => string;
}

// First column hugs the left edge, last hugs the right; the rest pad both sides.
function edgePadding(index: number, count: number): string {
  if (index === 0) return "pr-4";
  if (index === count - 1) return "pl-4";
  return "px-4";
}

export function StatsTable<T>({ minWidthClass, columns, rows, rowKey }: StatsTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm font-semibold", minWidthClass)}>
        <thead>
          <tr className="border-b-2 border-line text-left text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            {columns.map((column, i) => (
              <th
                key={column.label}
                className={cn(
                  "py-3 font-bold",
                  edgePadding(i, columns.length),
                  column.align === "right" && "text-right"
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowKey(row)} className="border-b border-line text-fg-soft">
              {columns.map((column, i) => (
                <td
                  key={column.label}
                  className={cn(
                    "py-4",
                    edgePadding(i, columns.length),
                    column.align === "right" && "text-right",
                    column.cellClass
                  )}
                >
                  {column.render(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
