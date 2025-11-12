import { useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Topbar from "@/components/common/Topbar";
import FilterTabs from "@/components/common/FilterTabs";
import PeopleTable from "@/components/people/PeopleTable";
import PersonDetailCard from "@/components/people/PersonDetailCard";
import { people } from "@/data/people";

const neighborFilters = [
  { id: "all", label: "All Neighbors" },
  { id: "members", label: "Members" },
  { id: "nonMembers", label: "Non-Members" },
  { id: "interestedInVolunteering", label: "Interested in Volunteering" },
  { id: "byHousehold", label: "By Household" }
];

const NeighborsPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const filteredPeople = useMemo(() => {
    let result = [...people];

    if (activeFilter === "members") {
      result = result.filter((person) => person.isMember);
    } else if (activeFilter === "nonMembers") {
      result = result.filter((person) => !person.isMember);
    } else if (activeFilter === "interestedInVolunteering") {
      result = result.filter((person) => person.volunteerInterests.length > 0);
    } else if (activeFilter === "byHousehold") {
      // Group by household - for now, just show all but sorted by household
      result = result.sort((a, b) => {
        const householdA = a.householdId || "";
        const householdB = b.householdId || "";
        if (householdA !== householdB) {
          return householdA.localeCompare(householdB);
        }
        return a.name.localeCompare(b.name);
      });
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

    if (activeFilter !== "byHousehold") {
      result.sort((a, b) => {
        if (sortKey === "membershipType") {
          return a.membershipType.localeCompare(b.membershipType);
        }
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [activeFilter, searchTerm, sortKey]);

  const header = (
    <div className="space-y-4">
      <Topbar
        title="Neighbors"
        ctaLabel="Add new neighbor"
        onAdd={() => {
          // TODO: Open create-person modal or route once backend exists.
        }}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by name, email, or address"
        sortOptions={[
          { label: "Sort by name", value: "name" },
          { label: "Sort by membership", value: "membershipType" }
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
            badgeCount = people.filter((p) => p.isMember).length;
          } else if (filter.id === "nonMembers") {
            badgeCount = people.filter((p) => !p.isMember).length;
          } else if (filter.id === "interestedInVolunteering") {
            badgeCount = people.filter((p) => p.volunteerInterests.length > 0).length;
          } else if (filter.id === "byHousehold") {
            // Count unique households
            const households = new Set(people.map((p) => p.householdId).filter(Boolean));
            badgeCount = households.size;
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

  const selectedPerson = selectedPersonId
    ? filteredPeople.find((p) => p.id === selectedPersonId)
    : null;

  return (
    <AdminLayout header={header}>
      <div className="flex gap-6">
        <div className={selectedPerson ? "w-2/3 transition-all duration-300" : "w-full transition-all duration-300"}>
          <PeopleTable
            data={filteredPeople}
            selectedId={selectedPersonId || undefined}
            onRowClick={(person) => {
              setSelectedPersonId(person.id);
            }}
            onClose={() => {
              setSelectedPersonId(null);
            }}
            onView={(person) => {
              // TODO: Navigate to person detail once route is defined.
              console.info("view person", person.id);
            }}
            onEdit={(person) => {
              // TODO: Trigger edit flow once backend mutation exists.
              console.info("edit person", person.id);
            }}
          />
        </div>
        {selectedPerson && (
          <div className="w-1/3 transition-all duration-300">
            <PersonDetailCard
              person={selectedPerson}
              onClose={() => {
                setSelectedPersonId(null);
              }}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NeighborsPage;

