import { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import { Person } from "@/data/people";

type PersonDetailCardProps = {
  person: Person;
  onClose: () => void;
};

const PersonDetailCard = ({ person, onClose }: PersonDetailCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const householdMembers = person.householdId ? [] : []; // TODO: Fetch household members

  // Get phone from person (if it exists as an optional field)
  const personPhone = (person as any).phone || "";

  // Form state
  const [formData, setFormData] = useState({
    name: person.name || "",
    address: person.address || "",
    email: person.email || "",
    phone: personPhone
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Reset form data when person changes
  useEffect(() => {
    setFormData({
      name: person.name || "",
      address: person.address || "",
      email: person.email || "",
      phone: (person as any).phone || ""
    });
  }, [person]);

  // Check for unsaved changes
  useEffect(() => {
    if (!isEditing) {
      setHasUnsavedChanges(false);
      return;
    }
    const hasChanges =
      formData.name !== (person.name || "") ||
      formData.address !== (person.address || "") ||
      formData.email !== (person.email || "") ||
      formData.phone !== personPhone;
    setHasUnsavedChanges(hasChanges);
  }, [formData, person, personPhone, isEditing]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Save to database
    console.log("Saving person data:", formData);
    setHasUnsavedChanges(false);
    setIsEditing(false);
    // After saving, you might want to update the person prop or refresh data
  };

  const handleEdit = () => {
    setIsEditing(true);
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
      {/* Header with Close Button */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-base font-semibold text-primary-800">Name</h3>
        <button
          type="button"
          onClick={handleClose}
          className="text-sm text-neutral-600 hover:text-primary-800"
        >
          ✕
        </button>
      </div>

      {isEditing ? (
        /* Edit State */
        <>
          {/* Name Section */}
          <div className="mb-6 space-y-3 pb-6 border-b border-primary-200">
            <div className="space-y-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Full Name"
                className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
              />
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-6 space-y-3 pb-6 border-b border-primary-200">
            <h3 className="text-base font-semibold text-primary-800">Contact</h3>
            <div className="space-y-2">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Email"
                className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Phone"
                className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
              />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Address"
                className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
              />
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
        </>
      ) : (
        /* View State */
        <>
          {/* Name Display */}
          <div className="mb-6 space-y-3 pb-6 border-b border-primary-200">
            <p className="text-xl font-bold leading-tight text-primary-800">
              {person.name || "No data available"}
            </p>
          </div>

          {/* Contact Section */}
          <div className="mb-6 space-y-3 pb-6 border-b border-primary-200">
            <h3 className="text-base font-semibold text-primary-800">Contact</h3>
            <div className="flex flex-col gap-2 items-start">
              <p className="text-base text-neutral-700">
                {person.email || "No data available"}
              </p>
              <p className="text-xs font-medium text-neutral-700 opacity-50">
                {formData.phone || "No data available"}
              </p>
              <p className="text-xs font-medium text-neutral-700 opacity-50">
                {person.address || "No data available"}
              </p>
            </div>
          </div>

          {/* Household Section - Always show */}
          <div className="mb-6 space-y-3 pb-6 border-b border-primary-200">
            <h3 className="text-base font-semibold text-primary-800">Household</h3>
            {person.householdId ? (
              <>
                <p className="text-sm text-neutral-700">
                  Household ID: {person.householdId}
                </p>
                {householdMembers.length > 0 ? (
                  <div className="space-y-2">
                    {householdMembers.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border border-primary-200 bg-cream-100 px-3 py-2"
                      >
                        <span className="text-sm text-neutral-700">{member}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-700 opacity-50">
                    No household members found
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-700 opacity-50">
                No data available
              </p>
            )}
          </div>

          {/* Membership Section - Always show */}
          <div className="mb-6 space-y-3 pb-6 border-b border-primary-200">
            <h3 className="text-base font-semibold text-primary-800">Membership</h3>
            {person.membershipId || person.membershipTier || person.membershipStatus ? (
              <div className="space-y-1">
                {person.membershipTier && (
                  <p className="text-sm text-neutral-700">
                    Tier: {person.membershipTier}
                  </p>
                )}
                {person.membershipStatus && (
                  <p className="text-sm text-neutral-700">
                    Status: {person.membershipStatus}
                  </p>
                )}
                {person.lastRenewal && (
                  <p className="text-xs font-medium text-neutral-700 opacity-50">
                    Last renewed: {person.lastRenewal}
                  </p>
                )}
                {person.membershipId && (
                  <p className="text-xs font-medium text-neutral-700 opacity-50">
                    Membership ID: {person.membershipId}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-700 opacity-50">
                No data available
              </p>
            )}
          </div>

          {/* Edit Link */}
          <div className="mt-auto pt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={handleEdit}
              className="text-xs font-medium text-neutral-700 opacity-50 hover:opacity-75 hover:text-primary-800 transition-colors"
            >
              Edit profile
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PersonDetailCard;

