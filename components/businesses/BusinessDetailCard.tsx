import { useState, useEffect } from "react";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { Business } from "@/data/businesses";

type BusinessDetailCardProps = {
  business: Business;
  onClose: () => void;
};

const BusinessDetailCard = ({ business, onClose }: BusinessDetailCardProps) => {
  // TODO: These fields will come from the database eventually
  const memberSince = "2021";
  const totalLifetimeSponsorship = "$2050";
  const pastSponsorships = [
    { event: "Leaflet 2025", amount: "$3000" },
    { event: "Leaflet 2024", amount: "$2500" },
    { event: "Leaflet 2023", amount: "$2000" },
    { event: "Leaflet 2022", amount: "$1500" }
  ];

  // Form state
  const [formData, setFormData] = useState({
    companyName: business.companyName,
    address: business.address,
    contactName: business.contactName,
    phone: business.phone,
    email: business.email,
    website: "www.relume.io"
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.companyName !== business.companyName ||
      formData.address !== business.address ||
      formData.contactName !== business.contactName ||
      formData.phone !== business.phone ||
      formData.email !== business.email ||
      formData.website !== "www.relume.io";
    setHasUnsavedChanges(hasChanges);
  }, [formData, business]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Save to database
    console.log("Saving business data:", formData);
    setHasUnsavedChanges(false);
    // After saving, you might want to update the business prop or refresh data
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
      {/* Company Name Section */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-primary-800">Company name</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-neutral-600 hover:text-primary-800"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">Member since {memberSince}</Badge>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
        </div>
      </div>

      {/* Contact Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-base font-semibold text-primary-800">Contact</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => handleInputChange("contactName", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
        </div>
      </div>

      {/* Website Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-base font-semibold text-primary-800">Website</h3>
        <input
          type="text"
          value={formData.website}
          onChange={(e) => handleInputChange("website", e.target.value)}
          className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
        />
      </div>

      {/* Past Sponsorships Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-base font-semibold text-primary-800">Past sponsorships</h3>
        <p className="text-sm text-neutral-700">
          Total lifetime sponsorship: {totalLifetimeSponsorship}
        </p>
        <div className="space-y-2">
          {pastSponsorships.map((sponsorship, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded border border-primary-200 bg-cream-100 px-3 py-2"
            >
              <span className="text-sm text-neutral-700">{sponsorship.event}</span>
              <span className="text-sm font-medium text-primary-800">{sponsorship.amount}</span>
            </div>
          ))}
        </div>
      </div>

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

export default BusinessDetailCard;

