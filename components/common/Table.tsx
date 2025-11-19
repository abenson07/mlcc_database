import { ReactNode, useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => ReactNode;
  sortable?: boolean;
};

type TableCellProps = {
  align?: "left" | "center" | "right";
  width?: string;
  content: ReactNode;
  text: string;
};

const TableCell = ({ align, width, content, text }: TableCellProps) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (cellRef.current) {
        const element = cellRef.current;
        setIsTruncated(element.scrollWidth > element.clientWidth);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [content]);

  return (
    <td
      className={clsx(
        "px-4 py-3 text-sm text-neutral-700",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
      style={{ width }}
    >
      <div className="relative group">
        <div
          ref={cellRef}
          className="truncate max-w-full"
          title={isTruncated && text ? text : undefined}
        >
          {content}
        </div>
        {isTruncated && text && (
          <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-neutral-900 rounded shadow-lg whitespace-nowrap pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
          </div>
        )}
      </div>
    </td>
  );
};

type SortDirection = "asc" | "desc" | null;

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  emptyState?: ReactNode;
  rowAction?: (item: T) => ReactNode;
  caption?: string;
  selectedId?: string | number;
  onRowClick?: (item: T) => void;
  onSort?: (columnKey: keyof T | string, direction: "asc" | "desc") => void;
  sortColumn?: keyof T | string;
  sortDirection?: SortDirection;
};

const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  emptyState,
  rowAction,
  caption,
  selectedId,
  onRowClick,
  onSort,
  sortColumn,
  sortDirection
}: TableProps<T>) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    columns.forEach((col) => {
      if (col.width) {
        const widthValue = parseInt(col.width);
        if (!isNaN(widthValue)) {
          widths[String(col.key)] = widthValue;
        }
      }
    });
    return widths;
  });

  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const headerRefs = useRef<Record<string, HTMLTableCellElement>>({});

  const handleSort = useCallback((columnKey: keyof T | string) => {
    if (!onSort) return;
    
    const currentDirection = sortColumn === columnKey ? sortDirection : null;
    const newDirection = currentDirection === "asc" ? "desc" : "asc";
    onSort(columnKey, newDirection);
  }, [onSort, sortColumn, sortDirection]);

  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const headerElement = headerRefs.current[columnKey];
    if (!headerElement) return;
    
    // Get the actual rendered width from the DOM
    const actualWidth = headerElement.getBoundingClientRect().width;
    
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(actualWidth);
  }, []);

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!resizingColumn) return;
      
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleResizeEnd = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  if (data.length === 0 && emptyState) {
    return <div className="rounded-lg border border-dashed border-primary-300 bg-cream-100 p-12 text-center text-sm text-neutral-600">{emptyState}</div>;
  }

  return (
    <div className="rounded-lg border border-primary-200 bg-cream-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="divide-y divide-primary-200" style={{ tableLayout: 'fixed', width: '100%', minWidth: '900px' }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-cream-100">
            <tr>
              {columns.map((column) => {
                const columnKey = String(column.key);
                const width = columnWidths[columnKey] || column.width || "auto";
                const isSortable = column.sortable !== false && onSort;
                const isSorted = sortColumn === column.key;
                const currentSortDirection = isSorted ? sortDirection : null;

                return (
                  <th
                    key={columnKey}
                    ref={(el) => {
                      if (el) {
                        headerRefs.current[columnKey] = el;
                      }
                    }}
                    scope="col"
                    className={clsx(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary-800 relative",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      !column.align && "text-left",
                      isSortable && "cursor-pointer hover:bg-primary-50 select-none"
                    )}
                    style={{ width: typeof width === 'number' ? `${width}px` : width }}
                  >
                    <div className="flex items-center gap-2 pr-2">
                      <span
                        onClick={() => isSortable && handleSort(column.key)}
                        className="flex-1"
                      >
                        {column.header}
                      </span>
                      {isSortable && (
                        <div className="flex flex-col shrink-0">
                          <svg
                            className={clsx(
                              "w-3 h-3",
                              currentSortDirection === "asc" ? "text-primary-700" : "text-neutral-400"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5 12l5-5 5 5H5z" />
                          </svg>
                          <svg
                            className={clsx(
                              "w-3 h-3 -mt-1",
                              currentSortDirection === "desc" ? "text-primary-700" : "text-neutral-400"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5 8l5 5 5-5H5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:w-1.5 hover:bg-primary-400 active:bg-primary-500 z-10 transition-all"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleResizeStart(e, columnKey);
                      }}
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
              {rowAction && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-800">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-200 bg-cream-100">
            {data.map((item, index) => {
              const isSelected = selectedId !== undefined && String(item.id ?? index) === String(selectedId);
              return (
                <tr
                  key={String(item.id ?? index)}
                  className={clsx(
                    "transition-colors",
                    onRowClick && "cursor-pointer",
                    isSelected 
                      ? "bg-primary-200" 
                      : "bg-cream-100 hover:bg-primary-100"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => {
                    const columnKey = String(column.key);
                    const width = columnWidths[columnKey] || column.width || "auto";
                    const cellContent = column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] ?? "");
                    const cellText = typeof cellContent === 'string' 
                      ? cellContent 
                      : String(item[column.key as keyof T] ?? "");
                    
                    return (
                      <TableCell
                        key={columnKey}
                        align={column.align}
                        width={typeof width === 'number' ? `${width}px` : width}
                        content={cellContent}
                        text={cellText}
                      />
                    );
                  })}
                  {rowAction && (
                    <td className="px-4 py-3 text-right text-sm text-neutral-600">
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

