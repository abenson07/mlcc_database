import { useState, useEffect } from "react";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { Route } from "@/data/routes";

type DelivererInfo = {
  id: string;
  name: string;
  email: string;
  address: string;
};

type RouteDetailCardProps = {
  route: Route;
  deliverer?: DelivererInfo | null;
  onClose: () => void;
};

const statusVariants: Record<Route["status"], "default" | "success" | "info" | "warning"> = {
  Scheduled: "info",
  "In Progress": "warning",
  Completed: "success",
  Open: "default"
};

const RouteDetailCard = ({ route, deliverer, onClose }: RouteDetailCardProps) => {
  // TODO: These fields will come from the database eventually
  const createdAt = "2024-01-15";
  const lastUpdated = "2024-10-20";
  const deliveryHistory = [
    { date: "2024-10-18", status: "Completed", deliverer: "Alex Johnson" },
    { date: "2024-09-15", status: "Completed", deliverer: "Alex Johnson" }
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: route.name,
    dropoffLocation: route.dropoffLocation,
    delivererName: deliverer?.name || "",
    delivererAddress: deliverer?.address || "",
    delivererEmail: deliverer?.email || ""
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update form data when route or deliverer changes
  useEffect(() => {
    setFormData({
      name: route.name,
      dropoffLocation: route.dropoffLocation,
      delivererName: deliverer?.name || "",
      delivererAddress: deliverer?.address || "",
      delivererEmail: deliverer?.email || ""
    });
  }, [route, deliverer]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.name !== route.name ||
      formData.dropoffLocation !== route.dropoffLocation ||
      formData.delivererName !== (deliverer?.name || "") ||
      formData.delivererAddress !== (deliverer?.address || "") ||
      formData.delivererEmail !== (deliverer?.email || "");
    setHasUnsavedChanges(hasChanges);
  }, [formData, route, deliverer]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Save to database
    console.log("Saving route data:", formData);
    setHasUnsavedChanges(false);
    // After saving, you might want to update the route prop or refresh data
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close without saving?"
      );
      if (!confirmed) {
        return;
      }
    }
    onClose();
  };

  return (
    <div className="flex h-fit flex-col rounded-lg border border-primary-300 bg-cream-100 p-6 shadow-sm">
      {/* Route Name Section */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-primary-800">Route name</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-neutral-600 hover:text-primary-800"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[route.status]}>
            {route.status}
          </Badge>
          {route.routeType && (
            <Badge variant="default">{route.routeType}</Badge>
          )}
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
          <input
            type="text"
            value={formData.dropoffLocation}
            onChange={(e) => handleInputChange("dropoffLocation", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
        </div>
      </div>

      {/* Route Details Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-base font-semibold text-primary-800">Route Details</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded border border-primary-200 bg-cream-100 px-3 py-2">
            <span className="text-sm text-neutral-700">Number of leaflets</span>
            <span className="text-sm font-medium text-primary-800">{route.leaflets}</span>
          </div>
          <div className="flex items-center justify-between rounded border border-primary-200 bg-cream-100 px-3 py-2">
            <span className="text-sm text-neutral-700">Created</span>
            <span className="text-sm font-medium text-primary-800">{createdAt}</span>
          </div>
          <div className="flex items-center justify-between rounded border border-primary-200 bg-cream-100 px-3 py-2">
            <span className="text-sm text-neutral-700">Last updated</span>
            <span className="text-sm font-medium text-primary-800">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Deliverer Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-base font-semibold text-primary-800">Deliverer</h3>
        {deliverer ? (
          <div className="space-y-2">
            <input
              type="text"
              value={formData.delivererName}
              onChange={(e) => handleInputChange("delivererName", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
            <input
              type="text"
              value={formData.delivererAddress}
              onChange={(e) => handleInputChange("delivererAddress", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
            <input
              type="email"
              value={formData.delivererEmail}
              onChange={(e) => handleInputChange("delivererEmail", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-600">No deliverer assigned</p>
        )}
      </div>

      {/* Delivery History Section */}
      {deliveryHistory.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Delivery History</h3>
          <div className="space-y-2">
            {deliveryHistory.map((delivery, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded border border-primary-200 bg-cream-100 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-neutral-700">{delivery.date}</span>
                  <span className="text-xs text-neutral-600">{delivery.deliverer}</span>
                </div>
                <Badge variant={delivery.status === "Completed" ? "success" : "default"}>
                  {delivery.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-auto pt-4 border-t border-primary-200">
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className="w-full"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default RouteDetailCard;

