import { useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Person } from "@/data/people";

type PersonFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Person, "id">) => Promise<void>;
};

const PersonFormModal = ({ isOpen, onClose, onSave }: PersonFormModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    householdId: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name: formData.name,
        address: formData.address,
        email: formData.email,
        householdId: formData.householdId || undefined,
      });
      // Reset form
      setFormData({
        name: "",
        address: "",
        email: "",
        householdId: "",
      });
      onClose();
    } catch (error) {
      console.error("Error saving person:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Neighbor" size="lg">
      <div className="space-y-6">
        {/* Name Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Name</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Contact</h3>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
          </div>
        </div>

        {/* Household ID Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Household ID (Optional)</h3>
          <input
            type="text"
            placeholder="Household ID"
            value={formData.householdId}
            onChange={(e) => handleInputChange("householdId", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-primary-200 pt-4">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PersonFormModal;

