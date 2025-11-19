export type RouteStatus = "Scheduled" | "In Progress" | "Completed" | "Open";
export type RouteType = "Single family residence" | "Multi-family" | "Commercial" | "Mixed";

export type Route = {
  id: string;
  name: string;
  leaflets: number;
  dropoffLocation: string;
  distributor: string | null;
  status: RouteStatus;
  routeType?: RouteType;
  primary_deliverer_id?: string | null;
  primary_deliverer_email?: string | null;
  deliverer?: {
    id: string;
    name: string;
    email: string;
    address: string;
  } | null;
};

export type Deliverer = {
  id: string;
  name: string;
  address: string;
  email: string;
  routes: number;
  lastDelivery: string;
  status: "Active" | "On Hold";
};

export const routes: Route[] = [
  {
    id: "route-001",
    name: "Roosevelt: 90th to 95th",
    leaflets: 32,
    dropoffLocation: "Community Center",
    distributor: "Alex Johnson",
    status: "Scheduled",
    routeType: "Single family residence"
  },
  {
    id: "route-002",
    name: "Roosevelt: 90th to 95th",
    leaflets: 32,
    dropoffLocation: "Library Annex",
    distributor: "Alex Johnson",
    status: "In Progress",
    routeType: "Single family residence"
  },
  {
    id: "route-003",
    name: "Roosevelt: 90th to 95th",
    leaflets: 32,
    dropoffLocation: "Lakeside Pavilion",
    distributor: null,
    status: "Open",
    routeType: "Single family residence"
  },
  {
    id: "route-004",
    name: "Roosevelt: 90th to 95th",
    leaflets: 32,
    dropoffLocation: "Community Center",
    distributor: "Alex Johnson",
    status: "Scheduled",
    routeType: "Single family residence"
  },
  {
    id: "route-005",
    name: "North Maple Loop",
    leaflets: 120,
    dropoffLocation: "Southside Park",
    distributor: "Taylor Brooks",
    status: "Completed",
    routeType: "Multi-family"
  },
  {
    id: "route-006",
    name: "Downtown Corridor",
    leaflets: 85,
    dropoffLocation: "Library Annex",
    distributor: "Morgan Lee",
    status: "Scheduled",
    routeType: "Commercial"
  }
];

export const deliverers: Deliverer[] = [
  {
    id: "deliverer-001",
    name: "Alex Johnson",
    address: "8811 8th Ave NE",
    email: "alex@email.com",
    routes: 3,
    lastDelivery: "2024-10-18",
    status: "Active"
  },
  {
    id: "deliverer-002",
    name: "Alex Johnson",
    address: "8811 8th Ave NE",
    email: "alex@email.com",
    routes: 2,
    lastDelivery: "2024-09-30",
    status: "Active"
  },
  {
    id: "deliverer-003",
    name: "Alex Johnson",
    address: "8811 8th Ave NE",
    email: "alex@email.com",
    routes: 3,
    lastDelivery: "2024-08-12",
    status: "On Hold"
  },
  {
    id: "deliverer-004",
    name: "Morgan Lee",
    address: "123 Main St",
    email: "morgan@email.com",
    routes: 1,
    lastDelivery: "2024-07-22",
    status: "Active"
  }
];

export const openRoutes = routes.filter((route) => route.status === "Open");

// TODO: Replace mock data with API integration once backend endpoints are available.

