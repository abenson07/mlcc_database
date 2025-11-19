import Button from "@/components/common/Button";
import CopyableText from "@/components/common/CopyableText";
import { Route } from "@/data/routes";

type DelivererInfo = {
  id: string;
  name: string;
  email: string;
  address: string;
};

type DelivererTableProps = {
  routes: Route[];
  searchTerm?: string;
  onSkip?: (deliverer: DelivererInfo) => void;
  onUnassign?: (deliverer: DelivererInfo) => void;
  onSkipRoute?: (route: Route) => void;
  onUnassignRoute?: (route: Route) => void;
};

const DelivererTable = ({
  routes,
  searchTerm,
  onSkip,
  onUnassign,
  onSkipRoute,
  onUnassignRoute
}: DelivererTableProps) => {
  // Group routes by primary_deliverer_id and extract unique deliverers
  const deliverersMap = new Map<string, { deliverer: DelivererInfo; routes: Route[] }>();
  
  routes.forEach((route) => {
    if (route.primary_deliverer_id && route.deliverer) {
      if (!deliverersMap.has(route.primary_deliverer_id)) {
        deliverersMap.set(route.primary_deliverer_id, {
          deliverer: route.deliverer,
          routes: []
        });
      }
      deliverersMap.get(route.primary_deliverer_id)!.routes.push(route);
    }
  });

  const deliverers = Array.from(deliverersMap.values());

  const filteredDeliverers = searchTerm
    ? deliverers.filter(({ deliverer, routes: delivererRoutes }) => {
        const normalized = searchTerm.toLowerCase();
        const delivererMatches = 
          deliverer.name.toLowerCase().includes(normalized) ||
          deliverer.address.toLowerCase().includes(normalized) ||
          deliverer.email.toLowerCase().includes(normalized);
        
        const routeMatches = delivererRoutes.some(route =>
          route.name.toLowerCase().includes(normalized) ||
          route.routeType?.toLowerCase().includes(normalized) ||
          route.leaflets.toString().includes(normalized)
        );
        
        return delivererMatches || routeMatches;
      })
    : deliverers;

  return (
    <div className="space-y-3">
      {filteredDeliverers.map(({ deliverer, routes: assignedRoutes }) => {

        const filteredRoutes = searchTerm
          ? assignedRoutes.filter((route) => {
              const normalized = searchTerm.toLowerCase();
              return (
                route.name.toLowerCase().includes(normalized) ||
                route.routeType?.toLowerCase().includes(normalized) ||
                route.leaflets.toString().includes(normalized)
              );
            })
          : assignedRoutes;

        return (
          <div
            key={deliverer.id}
            className="overflow-hidden rounded-lg border border-primary-200 bg-cream-100 shadow-sm"
          >
            {/* Deliverer Header Row */}
            <div className="flex items-center border-b border-primary-200 bg-cream-100">
              <div className="flex grow items-center">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-primary-800">
                    {deliverer.name}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-neutral-700">
                    {deliverer.address}
                  </p>
                </div>
                <div className="flex grow px-4 py-3">
                  <CopyableText
                    text={deliverer.email}
                    successMessage="Email copied to clipboard!"
                    className="cursor-pointer text-sm text-neutral-700 hover:text-primary-800 hover:underline"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSkip?.(deliverer)}
                >
                  Skip
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUnassign?.(deliverer)}
                >
                  Unassign
                </Button>
              </div>
            </div>

            {/* Routes Sub-table */}
            {filteredRoutes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-primary-200">
                  <thead className="bg-cream-100">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-800"
                      >
                        Route name
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-800"
                      >
                        # of leaflets
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-800"
                      >
                        Route type
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-800"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-200 bg-cream-100">
                    {filteredRoutes.map((route) => (
                      <tr
                        key={route.id}
                        className="bg-cream-100 hover:bg-primary-100 transition-colors"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                          {route.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                          {route.leaflets}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                          {route.routeType || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-neutral-600">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSkipRoute?.(route)}
                            >
                              Skip
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onUnassignRoute?.(route)}
                            >
                              Unassign
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-neutral-600">
                No routes assigned to this deliverer
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DelivererTable;
