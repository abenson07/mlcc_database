import { ReactNode } from "react";
import Table, { TableColumn } from "@/components/common/Table";
import Button from "@/components/common/Button";
import { Route } from "@/data/routes";

type RouteTableProps = {
  data: Route[];
  selectedId?: string;
  onRowClick?: (route: Route) => void;
  onClose?: () => void;
};

const columns: TableColumn<Route>[] = [
  { key: "name", header: "Route name", width: "300px" },
  { key: "deliverer", header: "Deliverer", width: "200px" },
  { key: "email", header: "Email", width: "250px" },
  { key: "leaflets", header: "# of leaflets", align: "center", width: "150px" },
  { key: "routeType", header: "Route type", width: "200px" }
];

const RouteTable = ({ data, selectedId, onRowClick, onClose }: RouteTableProps) => {
  // Filter out routes without primary_deliverer_id (unclaimed routes)
  const claimedRoutes = data.filter(route => route.primary_deliverer_id);

  const renderers: Partial<Record<keyof Route | "deliverer" | "email", (route: Route) => ReactNode>> = {
    name: (route) => (
      <div className="max-w-full overflow-hidden">
        <p className="text-sm font-medium leading-[1.5] text-neutral-700 truncate" title={route.name}>
          {route.name}
        </p>
      </div>
    ),
    deliverer: (route) => {
      const deliverer = route.deliverer;
      if (!deliverer) {
        return <span className="text-neutral-400">Unassigned</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-normal leading-[1.5] text-neutral-700">{deliverer.name}</p>
          <p className="text-xs font-medium leading-[1.5] opacity-50 text-neutral-700">{deliverer.address}</p>
        </div>
      );
    },
    email: (route) => {
      const deliverer = route.deliverer;
      if (!deliverer) {
        return <span className="text-neutral-400">—</span>;
      }
      return <span className="text-sm font-normal leading-[1.5] text-neutral-700">{deliverer.email}</span>;
    },
    leaflets: (route) => (
      <span className="text-sm font-normal leading-[1.5] text-neutral-700">{route.leaflets}</span>
    ),
    routeType: (route) => (
      <span className="text-sm font-normal leading-[1.5] text-neutral-700">{route.routeType || "—"}</span>
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
      data={claimedRoutes}
      caption="Newsletter delivery routes grouped by route"
      selectedId={selectedId}
      onRowClick={onRowClick}
      rowAction={(route) => {
        const isSelected = selectedId === route.id;
        if (!isSelected) return null;
        return (
          <div className="flex gap-6 items-center">
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}>
              Close
            </Button>
          </div>
        );
      }}
    />
  );
};

export default RouteTable;

