export type Person = {
  id: string;
  name: string;
  email: string;
  address: string;
  householdId?: string;
  membershipId?: string;
  membershipTier?: string;
  membershipStatus?: string;
  lastRenewal?: string;
};

export type TierInfo = {
  tier: string;
  lastRenewal?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
};

export type DuplicateMembership = {
  email: string;
  personName?: string;
  membershipCount: number;
  tiers: TierInfo[];
};

export const people: Person[] = [
  {
    id: "person-001",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    address: "421 Pine Street, Maplewood",
    householdId: "household-001"
  },
  {
    id: "person-002",
    name: "Morgan Lee",
    email: "morgan.lee@example.com",
    address: "77 Cedar Avenue, Maplewood",
    householdId: "household-002"
  },
  {
    id: "person-003",
    name: "Priya Desai",
    email: "priya.desai@example.com",
    address: "19 Birch Road, Maplewood",
    householdId: "household-003"
  },
  {
    id: "person-004",
    name: "Jordan Smith",
    email: "jordan.smith@example.com",
    address: "301 Oak Lane, Maplewood",
    householdId: "household-004"
  },
  {
    id: "person-005",
    name: "Cameron Wu",
    email: "cameron.wu@example.com",
    address: "55 Elm Street, Maplewood",
    householdId: "household-001"
  }
];

// TODO: Replace mock data with API integration once backend endpoints are available.

