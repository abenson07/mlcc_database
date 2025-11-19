import { useMemo, useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Topbar from "@/components/common/Topbar";
import FilterTabs from "@/components/common/FilterTabs";
import PeopleTable from "@/components/people/PeopleTable";
import PersonDetailCard from "@/components/people/PersonDetailCard";
import PersonFormModal from "@/components/people/PersonFormModal";
import { usePeople } from "@/hooks/usePeople";
import { useToast } from "@/components/common/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { Person } from "@/data/people";

const neighborFilters = [
  { id: "all", label: "All Neighbors" },
  { id: "members", label: "Members" },
  { id: "duplicates", label: "Duplicates" }
];

const NeighborsPage = () => {
  const { people, duplicateMemberships, loading, error, refetch } = usePeople();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const filteredPeople = useMemo(() => {
    let result = [...people];

    // Filter for members: must have membershipId and status must be active
    if (activeFilter === "members") {
      result = result.filter(
        (person) =>
          person.membershipId && 
          person.membershipStatus?.toLowerCase() === 'active'
      );
    }

    // Filter for duplicates: show people whose emails appear in duplicateMemberships
    if (activeFilter === "duplicates") {
      const duplicateEmails = new Set(
        duplicateMemberships.map(dup => dup.email.toLowerCase().trim())
      );
      result = result.filter(
        (person) => person.email && duplicateEmails.has(person.email.toLowerCase().trim())
      );
    }

    if (searchTerm) {
      const normalized = searchTerm.toLowerCase();
      result = result.filter(
        (person) =>
          person.name.toLowerCase().includes(normalized) ||
          person.email.toLowerCase().includes(normalized) ||
          person.address.toLowerCase().includes(normalized)
      );
    }

    result.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [people, activeFilter, searchTerm, sortKey, duplicateMemberships]);

  const header = (
    <div className="space-y-4">
      <Topbar
        title="Neighbors"
        ctaLabel="Add new neighbor"
        onAdd={() => {
          setIsModalOpen(true);
        }}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by name, email, or address"
        sortOptions={[
          { label: "Sort by name", value: "name" }
        ]}
        onSortChange={setSortKey}
      />
      <FilterTabs
        activeId={activeFilter}
        tabs={neighborFilters.map((filter) => {
          let badgeCount = 0;
          if (filter.id === "all") {
            badgeCount = people.length;
          } else if (filter.id === "members") {
            // Count active members
            badgeCount = people.filter(
              (p) => p.membershipId && p.membershipStatus?.toLowerCase() === 'active'
            ).length;
          } else if (filter.id === "duplicates") {
            // Count duplicate memberships
            badgeCount = duplicateMemberships.length;
          }
          return {
            ...filter,
            badgeCount
          };
        })}
        onTabChange={setActiveFilter}
      />
    </div>
  );

  const selectedPerson = activeFilter !== "duplicates" && selectedPersonId
    ? filteredPeople.find((p) => p.id === selectedPersonId)
    : null;

  // Scroll card into view when it's opened
  useEffect(() => {
    if (selectedPerson && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedPersonId]);

  const handleSavePerson = async (personData: Omit<Person, "id">) => {
    try {
      // Only insert full_name, email, and address (matching Supabase column names)
      const { error } = await supabase.from("people").insert({
        full_name: personData.name,
        email: personData.email,
        address: personData.address,
      });

      if (error) {
        throw error;
      }

      showToast("Neighbor added successfully!");
      await refetch();
    } catch (err) {
      console.error("Error saving person:", err);
      showToast("Failed to add neighbor. Please try again.");
      throw err;
    }
  };

  if (loading) {
    return (
      <AdminLayout header={header}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-lg text-gray-600">Loading neighbors...</div>
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
            <div className="text-lg text-red-600 mb-2">Error loading neighbors</div>
            <div className="text-sm text-gray-600">{error}</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout header={header}>
      <div className="flex gap-6">
        <div className={selectedPerson && activeFilter !== "duplicates" ? "w-2/3 transition-all duration-300" : "w-full transition-all duration-300"}>
          <PeopleTable
            data={filteredPeople}
            selectedId={selectedPersonId || undefined}
            onRowClick={(person) => {
              setSelectedPersonId(person.id);
            }}
            onClose={() => {
              setSelectedPersonId(null);
            }}
            showMembersColumns={activeFilter === "members"}
            showDuplicatesView={activeFilter === "duplicates"}
            duplicateMemberships={duplicateMemberships}
          />
        </div>
        {selectedPerson && (
          <div ref={cardRef} className="w-1/3 transition-all duration-300 sticky top-8 self-start">
            <PersonDetailCard
              person={selectedPerson}
              onClose={() => {
                setSelectedPersonId(null);
              }}
            />
          </div>
        )}
      </div>
      <PersonFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePerson}
      />
    </AdminLayout>
  );
};

export default NeighborsPage;

