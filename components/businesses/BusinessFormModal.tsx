import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Business, SponsorshipLevel, BusinessStatus } from "@/data/businesses";
import { searchPlaces, getPlaceDetails, GooglePlace } from "@/lib/googlePlaces";

type BusinessFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Business, "id">) => Promise<void>;
};

const sponsorshipLevels: SponsorshipLevel[] = ["Gold", "Silver", "Bronze", "In-Kind"];
const businessStatuses: BusinessStatus[] = ["activeMember", "pastSponsor", "yetToSupport"];

const BusinessFormModal = ({ isOpen, onClose, onSave }: BusinessFormModalProps) => {
  const [formData, setFormData] = useState({
    companyName: "",
    address: "",
    contactName: "",
    phone: "",
    email: "",
    website: "",
    sponsorshipTags: [] as SponsorshipLevel[],
    linkedEvents: [] as string[],
    notes: "",
    status: "yetToSupport" as BusinessStatus,
  });

  const [linkedEventInput, setLinkedEventInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Google Places search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | SponsorshipLevel[] | string[] | BusinessStatus
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSponsorshipTag = (tag: SponsorshipLevel) => {
    setFormData((prev) => ({
      ...prev,
      sponsorshipTags: prev.sponsorshipTags.includes(tag)
        ? prev.sponsorshipTags.filter((t) => t !== tag)
        : [...prev.sponsorshipTags, tag],
    }));
  };

  const handleAddLinkedEvent = () => {
    if (linkedEventInput.trim() && !formData.linkedEvents.includes(linkedEventInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        linkedEvents: [...prev.linkedEvents, linkedEventInput.trim()],
      }));
      setLinkedEventInput("");
    }
  };

  const handleRemoveLinkedEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedEvents: prev.linkedEvents.filter((e) => e !== event),
    }));
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.trim().length < 3) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
          }

          setIsSearching(true);
          setSearchError(null);
          try {
            // You can customize the location and radius here
            // For example, use a specific city: "43.6532,-79.3832" for Toronto
            const results = await searchPlaces(query);
            setSearchResults(results);
            setShowSearchResults(results.length > 0);
          } catch (error) {
            console.error("Error searching places:", error);
            setSearchError(error instanceof Error ? error.message : "Failed to search businesses");
            setSearchResults([]);
            setShowSearchResults(false);
          } finally {
            setIsSearching(false);
          }
        }, 500); // 500ms debounce
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSelectPlace = async (place: GooglePlace) => {
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Get full details for the selected place
      const details = await getPlaceDetails(place.place_id);
      
      if (details) {
        // Auto-fill form with place data
        setFormData((prev) => ({
          ...prev,
          companyName: details.name || prev.companyName,
          address: details.formatted_address || prev.address,
          phone: details.formatted_phone_number || details.international_phone_number || prev.phone,
          website: details.website || prev.website,
        }));
      } else {
        // Fallback to basic place data
        setFormData((prev) => ({
          ...prev,
          companyName: place.name || prev.companyName,
          address: place.formatted_address || prev.address,
          phone: place.formatted_phone_number || prev.phone,
          website: place.website || prev.website,
        }));
      }
      
      // Close search results
      setShowSearchResults(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error getting place details:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to load business details");
      // Still fill basic info even if details fail
      setFormData((prev) => ({
        ...prev,
        companyName: place.name || prev.companyName,
        address: place.formatted_address || prev.address,
        phone: place.formatted_phone_number || prev.phone,
        website: place.website || prev.website,
      }));
      setShowSearchResults(false);
      setSearchQuery("");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        companyName: formData.companyName,
        address: formData.address,
        contactName: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        sponsorshipTags: formData.sponsorshipTags,
        linkedEvents: formData.linkedEvents,
        notes: formData.notes,
        status: formData.status,
      });
      // Reset form
      setFormData({
        companyName: "",
        address: "",
        contactName: "",
        phone: "",
        email: "",
        website: "",
        sponsorshipTags: [],
        linkedEvents: [],
        notes: "",
        status: "yetToSupport",
      });
      setLinkedEventInput("");
      onClose();
    } catch (error) {
      console.error("Error saving business:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Business" size="lg">
      <div className="space-y-6">
        {/* Google Places Search Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Search for Business</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for businesses (e.g., 'restaurants in Toronto', 'coffee shops')"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700"></div>
              </div>
            )}
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-primary-200 bg-white shadow-lg">
                {searchResults.map((place) => (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none"
                  >
                    <div className="font-medium text-neutral-900">{place.name}</div>
                    <div className="text-xs text-neutral-600">{place.formatted_address}</div>
                    {place.formatted_phone_number && (
                      <div className="text-xs text-neutral-500">{place.formatted_phone_number}</div>
                    )}
                    {place.rating && (
                      <div className="mt-1 text-xs text-neutral-500">
                        ⭐ {place.rating} {place.user_ratings_total ? `(${place.user_ratings_total} reviews)` : ''}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {searchError && (
              <div className="mt-2 text-xs text-red-600">{searchError}</div>
            )}
            
            {!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
              <div className="mt-2 text-xs text-amber-600">
                ⚠️ Google Places API key not configured. Add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your .env.local file.
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500">Or enter manually</span>
          </div>
        </div>

        {/* Company Name Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Company name</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Company name"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
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
              type="text"
              placeholder="Contact name"
              value={formData.contactName}
              onChange={(e) => handleInputChange("contactName", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
            <input
              type="text"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
          </div>
        </div>

        {/* Website Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Website</h3>
          <input
            type="text"
            placeholder="Website URL"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          />
        </div>

        {/* Status Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Status</h3>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange("status", e.target.value as BusinessStatus)}
            className="w-full rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
          >
            {businessStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "activeMember" ? "Active Member" : status === "pastSponsor" ? "Past Sponsor" : "Yet to Support"}
              </option>
            ))}
          </select>
        </div>

        {/* Sponsorship Tags Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Sponsorship Tags</h3>
          <div className="flex flex-wrap gap-2">
            {sponsorshipLevels.map((tag) => (
              <label key={tag} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sponsorshipTags.includes(tag)}
                  onChange={() => handleToggleSponsorshipTag(tag)}
                  className="rounded border-primary-300 text-primary-700 focus:ring-primary-700"
                />
                <span className="text-sm text-neutral-700">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Linked Events Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Linked Events</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add event"
              value={linkedEventInput}
              onChange={(e) => setLinkedEventInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLinkedEvent();
                }
              }}
              className="flex-1 rounded border border-primary-300 bg-cream-100 px-3 py-2 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            />
            <Button variant="secondary" size="sm" onClick={handleAddLinkedEvent}>
              Add
            </Button>
          </div>
          {formData.linkedEvents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.linkedEvents.map((event) => (
                <span
                  key={event}
                  className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
                >
                  {event}
                  <button
                    type="button"
                    onClick={() => handleRemoveLinkedEvent(event)}
                    className="hover:text-primary-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-primary-800">Notes</h3>
          <textarea
            placeholder="Additional notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            rows={4}
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

export default BusinessFormModal;

