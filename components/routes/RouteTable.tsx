import { ReactNode } from "react";
import Table, { TableColumn } from "@/components/common/Table";
import Button from "@/components/common/Button";
import { Deliverer, Route } from "@/data/routes";

type RouteTableProps = {
  data: Route[];
  deliverers?: Deliverer[];
  selectedId?: string;
  onRowClick?: (route: Route) => void;
  onAssign?: (route: Route) => void;
  onPrint?: (route: Route) => void;
  onClose?: () => void;
};

const columns: TableColumn<Route>[] = [
  { key: "name", header: "Route name", width: "250px" },
  { key: "deliverer", header: "Deliverer", width: "194px" },
  { key: "email", header: "Email", width: "256px" },
  { key: "leaflets", header: "# of leaflets", align: "center", width: "128px" },
  { key: "routeType", header: "Route type", width: "256px" }
];

const RouteTable = ({ data, deliverers = [], selectedId, onRowClick, onAssign, onPrint, onClose }: RouteTableProps) => {
  const getDelivererInfo = (route: Route) => {
    if (!route.distributor) return null;
    return deliverers.find((d) => d.name === route.distributor) || null;
  };

  const renderers: Partial<Record<keyof Route | "deliverer" | "email", (route: Route) => ReactNode>> = {
    name: (route) => (
      <p className="text-base font-medium leading-[1.5] text-neutral-700">{route.name}</p>
    ),
    deliverer: (route) => {
      const deliverer = getDelivererInfo(route);
      if (!deliverer) {
        return <span className="text-neutral-400">Unassigned</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          <p className="text-base font-normal leading-[1.5] text-neutral-700">{deliverer.name}</p>
          <p className="text-xs font-medium leading-[1.5] opacity-50 text-neutral-700">{deliverer.address}</p>
        </div>
      );
    },
    email: (route) => {
      const deliverer = getDelivererInfo(route);
      if (!deliverer) {
        return <span className="text-neutral-400">—</span>;
      }
      return <span className="text-base font-normal leading-[1.5] text-neutral-700">{deliverer.email}</span>;
    },
    leaflets: (route) => (
      <span className="text-base font-normal leading-[1.5] text-neutral-700">{route.leaflets}</span>
    ),
    routeType: (route) => (
      <span className="text-base font-normal leading-[1.5] text-neutral-700">{route.routeType || "—"}</span>
    )
  };

  columns.forEach((column) => {
    const renderer = renderers[column.key as keyof typeof renderers];
    if (renderer) {
      column.render = renderer;
    }
  });

  return (
    <Table
      columns={columns}
      data={data}
      caption="Newsletter delivery routes grouped by route"
      selectedId={selectedId}
      onRowClick={onRowClick}
      rowAction={(route) => {
        const isSelected = selectedId === route.id;
        return (
          <div className="flex gap-6 items-center">
            {isSelected ? (
              <Button variant="ghost" size="sm" onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}>
                Close
              </Button>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign?.(route);
                  }}
                  className="text-base font-semibold leading-[1.5] text-neutral-700 hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrint?.(route);
                  }}
                  className="text-base font-semibold leading-[1.5] text-neutral-700 hover:underline cursor-pointer"
                >
                  Cover sheet
                </button>
              </>
            )}
          </div>
        );
      }}
    />
  );
};

export default RouteTable;

