import { ReactNode } from "react";
import clsx from "clsx";

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => ReactNode;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  emptyState?: ReactNode;
  rowAction?: (item: T) => ReactNode;
  caption?: string;
  selectedId?: string | number;
  onRowClick?: (item: T) => void;
};

const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  emptyState,
  rowAction,
  caption,
  selectedId,
  onRowClick
}: TableProps<T>) => {
  if (data.length === 0 && emptyState) {
    return <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500">{emptyState}</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-neutral-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={clsx(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              {rowAction && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {data.map((item, index) => {
              const isSelected = selectedId !== undefined && String(item.id ?? index) === String(selectedId);
              return (
                <tr
                  key={String(item.id ?? index)}
                  className={clsx(
                    "hover:bg-neutral-50",
                    isSelected && "bg-neutral-100",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={clsx(
                        "whitespace-nowrap px-4 py-3 text-sm text-neutral-700",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? "")}
                    </td>
                  ))}
                  {rowAction && (
                    <td className="px-4 py-3 text-right text-sm text-neutral-500">
                      {rowAction(item)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;

