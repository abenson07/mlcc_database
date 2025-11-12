import { useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Topbar from "@/components/common/Topbar";
import FilterTabs from "@/components/common/FilterTabs";
import RouteTable from "@/components/routes/RouteTable";
import DelivererTable from "@/components/routes/DelivererTable";
import OpenRoutesTable from "@/components/routes/OpenRoutesTable";
import RouteDetailCard from "@/components/routes/RouteDetailCard";
import { deliverers, openRoutes, routes } from "@/data/routes";

type TabOption = "byRoute" | "byDeliverer" | "openRoutes";

const routeTabs = [
  { id: "byRoute", label: "By Route" },
  { id: "byDeliverer", label: "By Deliverer" },
  { id: "openRoutes", label: "Open Routes" }
];

const RoutesPage = () => {
  const [activeTab, setActiveTab] = useState<TabOption>("byRoute");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const normalizedSearch = searchTerm.toLowerCase();

  const filteredRoutes = useMemo(() => {
    if (!normalizedSearch) return routes;
    return routes.filter(
      (route) =>
        route.name.toLowerCase().includes(normalizedSearch) ||
        route.dropoffLocation.toLowerCase().includes(normalizedSearch) ||
        route.distributor?.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredDeliverers = useMemo(() => {
    if (!normalizedSearch) return deliverers;
    return deliverers.filter(
      (deliverer) =>
        deliverer.name.toLowerCase().includes(normalizedSearch) ||
        deliverer.status.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  const filteredOpenRoutes = useMemo(() => {
    if (!normalizedSearch) return openRoutes;
    return openRoutes.filter(
      (route) =>
        route.name.toLowerCase().includes(normalizedSearch) ||
        route.dropoffLocation.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch]);

  // Reset selected route when switching tabs
  const handleTabChange = (id: string) => {
    setActiveTab(id as TabOption);
    setSelectedRouteId(null);
  };

  const header = (
    <div className="space-y-4">
      <Topbar
        title="Routes"
        ctaLabel="Add new route"
        onAdd={() => {
          // TODO: Launch route creation wizard when backend endpoints exist.
        }}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by route, deliverer, or dropoff location"
      />
      <FilterTabs
        activeId={activeTab}
        tabs={routeTabs.map((tab) => ({
          ...tab,
          badgeCount:
            tab.id === "byRoute"
              ? routes.length
              : tab.id === "byDeliverer"
              ? deliverers.length
              : openRoutes.length
        }))}
        onTabChange={handleTabChange}
      />
    </div>
  );

  const selectedRoute = selectedRouteId
    ? filteredRoutes.find((r) => r.id === selectedRouteId)
    : null;

  const selectedRouteDeliverer = selectedRoute
    ? deliverers.find((d) => d.name === selectedRoute.distributor) || null
    : null;

  return (
    <AdminLayout header={header}>
      {activeTab === "byRoute" && (
        <div className="flex gap-6">
          <div className={selectedRoute ? "w-2/3 transition-all duration-300" : "w-full transition-all duration-300"}>
            <RouteTable
              data={filteredRoutes}
              deliverers={deliverers}
              selectedId={selectedRouteId || undefined}
              onRowClick={(route) => {
                setSelectedRouteId(route.id);
              }}
              onClose={() => {
                setSelectedRouteId(null);
              }}
              onAssign={(route) => {
                // TODO: Connect to assignment workflow.
                console.info("assign route", route.id);
              }}
              onPrint={(route) => {
                // TODO: Generate printable route sheet.
                console.info("print route", route.id);
              }}
            />
          </div>
          {selectedRoute && (
            <div className="w-1/3 transition-all duration-300">
              <RouteDetailCard
                route={selectedRoute}
                deliverer={selectedRouteDeliverer}
                onClose={() => {
                  setSelectedRouteId(null);
                }}
              />
            </div>
          )}
        </div>
      )}
      {activeTab === "byDeliverer" && (
        <DelivererTable
          data={filteredDeliverers}
          routes={routes}
          searchTerm={searchTerm}
          onSkip={(deliverer) => {
            // TODO: Implement skip deliverer action.
            console.info("skip deliverer", deliverer.id);
          }}
          onUnassign={(deliverer) => {
            // TODO: Implement unassign deliverer action.
            console.info("unassign deliverer", deliverer.id);
          }}
          onSkipRoute={(route) => {
            // TODO: Implement skip route action.
            console.info("skip route", route.id);
          }}
          onUnassignRoute={(route) => {
            // TODO: Implement unassign route action.
            console.info("unassign route", route.id);
          }}
        />
      )}
      {activeTab === "openRoutes" && (
        <OpenRoutesTable
          data={filteredOpenRoutes}
          onAssign={(route) => {
            // TODO: Connect to volunteer assignment flow.
            console.info("assign open route", route.id);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default RoutesPage;

