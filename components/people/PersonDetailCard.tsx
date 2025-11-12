import { useState, useEffect } from "react";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { Person } from "@/data/people";

type PersonDetailCardProps = {
  person: Person;
  onClose: () => void;
};

const membershipVariants: Record<Person["membershipType"], "default" | "success" | "info"> = {
  Resident: "default",
  Member: "info",
  Volunteer: "success",
  Partner: "default"
};

const PersonDetailCard = ({ person, onClose }: PersonDetailCardProps) => {
  // TODO: These fields will come from the database eventually
  const memberSince = person.isMember ? "2021" : null;
  const householdMembers = person.householdId ? [] : []; // TODO: Fetch household members

  // Form state
  const [formData, setFormData] = useState({
    name: person.name,
    address: person.address,
    email: person.email
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.name !== person.name ||
      formData.address !== person.address ||
      formData.email !== person.email;
    setHasUnsavedChanges(hasChanges);
  }, [formData, person]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Save to database
    console.log("Saving person data:", formData);
    setHasUnsavedChanges(false);
    // After saving, you might want to update the person prop or refresh data
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
    <div className="flex h-fit flex-col rounded-lg border border-neutral-900 bg-white p-6 shadow-sm">
      {/* Name Section */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">Name</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={membershipVariants[person.membershipType]}>
            {person.membershipType}
          </Badge>
          {memberSince && (
            <Badge variant="default">Member since {memberSince}</Badge>
          )}
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Contact Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-base font-semibold text-neutral-900">Contact</h3>
        <div className="space-y-2">
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Volunteer Interests Section */}
      {person.volunteerInterests.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-base font-semibold text-neutral-900">Volunteer Interests</h3>
          <div className="flex flex-wrap gap-2">
            {person.volunteerInterests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Household Section */}
      {person.householdId && (
        <div className="mb-6 space-y-3">
          <h3 className="text-base font-semibold text-neutral-900">Household</h3>
          <p className="text-sm text-neutral-700">
            Household ID: {person.householdId}
          </p>
          {householdMembers.length > 0 && (
            <div className="space-y-2">
              {householdMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded border border-neutral-200 bg-white px-3 py-2"
                >
                  <span className="text-sm text-neutral-700">{member}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="mt-auto pt-4 border-t border-neutral-200">
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

export default PersonDetailCard;

