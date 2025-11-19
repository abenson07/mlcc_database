import Button from "@/components/common/Button";
import Table, { TableColumn } from "@/components/common/Table";
import { Route } from "@/data/routes";

type OpenRoutesTableProps = {
  data: Route[];
  onAssign?: (route: Route) => void;
};

const columns: TableColumn<Route>[] = [
  { key: "name", header: "Route Name" },
  { key: "leaflets", header: "# Leaflets", align: "right" },
  { key: "dropoffLocation", header: "Dropoff Location" }
];

const OpenRoutesTable = ({ data, onAssign }: OpenRoutesTableProps) => {
  // Filter to only show routes without primary_deliverer_id
  const openRoutes = data.filter(route => !route.primary_deliverer_id);
  
  return (
    <Table
      columns={columns}
      data={openRoutes}
      caption="Routes currently unassigned to deliverers"
      rowAction={(route) => (
        <Button variant="primary" size="sm" onClick={() => onAssign?.(route)}>
          Assign
        </Button>
      )}
    />
  );
};

export default OpenRoutesTable;

