import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layout/AdminLayout";
import Topbar from "@/components/common/Topbar";
import FilterTabs from "@/components/common/FilterTabs";
import BusinessTable from "@/components/businesses/BusinessTable";
import BusinessDetailCard from "@/components/businesses/BusinessDetailCard";
import BusinessFormModal from "@/components/businesses/BusinessFormModal";
import { BusinessStatus, Business } from "@/data/businesses";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useToast } from "@/components/common/ToastProvider";
import { supabase } from "@/lib/supabaseClient";

const businessFilters: { id: "all" | BusinessStatus; label: string }[] = [
  { id: "all", label: "All Businesses" },
  { id: "activeMember", label: "Active Members" },
  { id: "pastSponsor", label: "Past Sponsors" },
  { id: "yetToSupport", label: "Yet to Support" }
];

const BusinessesPage = () => {
  const router = useRouter();
  const { businesses, loading, error, refetch } = useBusinesses();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const filteredBusinesses = useMemo(() => {
    const normalized = searchTerm.toLowerCase();
    return businesses.filter((business) => {
      const matchesFilter =
        activeFilter === "all" ||
        business.status === activeFilter;

      const matchesSearch =
        !normalized ||
        business.companyName.toLowerCase().includes(normalized) ||
        business.contactName.toLowerCase().includes(normalized) ||
        business.linkedEvents.some((event) =>
          event.toLowerCase().includes(normalized)
        );

      return matchesFilter && matchesSearch;
    });
  }, [businesses, activeFilter, searchTerm]);

  const header = (
    <div className="space-y-4">
      <Topbar
        title="Businesses"
        ctaLabel="Add new businesses"
        onAdd={() => {
          setIsModalOpen(true);
        }}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by company, contact, or event"
      />
      <FilterTabs
        activeId={activeFilter}
        tabs={businessFilters.map((filter) => ({
          ...filter,
          badgeCount:
            filter.id === "all"
              ? businesses.length
              : businesses.filter((business) =>
                  business.status === filter.id
                ).length
        }))}
        onTabChange={setActiveFilter}
      />
    </div>
  );

  const selectedBusiness = selectedBusinessId
    ? filteredBusinesses.find((b) => b.id === selectedBusinessId)
    : null;

  // Scroll card into view when it's opened
  useEffect(() => {
    if (selectedBusiness && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedBusinessId]);

  const handleSaveBusiness = async (businessData: Omit<Business, "id">) => {
    try {
      // Only insert basic fields that are likely to exist
      // Start with just name, email, and address like we did for people
      const insertData: Record<string, any> = {
        name: businessData.companyName,
        email: businessData.email,
        address: businessData.address,
      };

      // Add optional fields only if they might exist (we'll discover the actual columns from errors)
      // For now, let's be conservative and only add the basics
      // Uncomment these as we discover which columns exist:
      // if (businessData.contactName) insertData.contact_name = businessData.contactName;
      // if (businessData.phone) insertData.phone = businessData.phone;

      const { error } = await supabase.from("businesses").insert(insertData);

      if (error) {
        throw error;
      }

      showToast("Business added successfully!");
      await refetch();
    } catch (err) {
      console.error("Error saving business:", err);
      showToast("Failed to add business. Please try again.");
      throw err;
    }
  };

  if (loading) {
    return (
      <AdminLayout header={header}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-lg text-gray-600">Loading businesses...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout header={header}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-2">Error loading businesses</div>
            <div className="text-sm text-gray-600">{error}</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout header={header}>
      <div className="flex gap-6">
        <div className={selectedBusiness ? "w-2/3 transition-all duration-300" : "w-full transition-all duration-300"}>
          <BusinessTable
            data={filteredBusinesses}
            selectedId={selectedBusinessId || undefined}
            onRowClick={(business) => {
              setSelectedBusinessId(business.id);
            }}
            onClose={() => {
              setSelectedBusinessId(null);
            }}
          />
        </div>
        {selectedBusiness && (
          <div ref={cardRef} className="w-1/3 transition-all duration-300 sticky top-8 self-start">
            <BusinessDetailCard
              business={selectedBusiness}
              onClose={() => {
                setSelectedBusinessId(null);
              }}
            />
          </div>
        )}
      </div>
      <BusinessFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBusiness}
      />
    </AdminLayout>
  );
};

export default BusinessesPage;

