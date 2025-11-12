import Button from "@/components/common/Button";
import CopyableText from "@/components/common/CopyableText";
import { Deliverer, Route } from "@/data/routes";

type DelivererTableProps = {
  data: Deliverer[];
  routes: Route[];
  searchTerm?: string;
  onSkip?: (deliverer: Deliverer) => void;
  onUnassign?: (deliverer: Deliverer) => void;
  onSkipRoute?: (route: Route) => void;
  onUnassignRoute?: (route: Route) => void;
};

const DelivererTable = ({
  data,
  routes,
  searchTerm,
  onSkip,
  onUnassign,
  onSkipRoute,
  onUnassignRoute
}: DelivererTableProps) => {
  const filteredDeliverers = searchTerm
    ? data.filter((deliverer) => {
        const normalized = searchTerm.toLowerCase();
        return (
          deliverer.name.toLowerCase().includes(normalized) ||
          deliverer.address.toLowerCase().includes(normalized) ||
          deliverer.email.toLowerCase().includes(normalized)
        );
      })
    : data;

  return (
    <div className="space-y-3">
      {filteredDeliverers.map((deliverer) => {
        const assignedRoutes = routes.filter(
          (route) => route.distributor === deliverer.name
        );

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
            className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
          >
            {/* Deliverer Header Row */}
            <div className="flex items-center border-b border-neutral-200 bg-neutral-50">
              <div className="flex grow items-center">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-neutral-900">
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
                    className="cursor-pointer text-sm text-neutral-700 hover:text-neutral-900 hover:underline"
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
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        Route name
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        # of leaflets
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        Route type
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredRoutes.map((route) => (
                      <tr
                        key={route.id}
                        className="hover:bg-neutral-50"
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
                        <td className="px-4 py-3 text-right text-sm text-neutral-500">
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
              <div className="px-4 py-12 text-center text-sm text-neutral-500">
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
