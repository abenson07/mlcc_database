# Feature Request Template

Use this template when requesting new features that involve database changes, API endpoints, or data relationships.

## Feature

**Short title**: [e.g., "Assign routes to people"]

## Outcome

**What should the user be able to do?**
- [e.g., "Users should be able to assign a delivery route to a specific person"]
- [e.g., "Users should see which person is assigned to each route in the routes table"]

## Entities/Data

**Tables/Columns**:
- [e.g., `routes` table needs `person_id` column (foreign key to `people.id`)]
- [e.g., New `route_assignments` table with `route_id`, `person_id`, `assigned_at`]

**Relationships**:
- [e.g., `routes.person_id` → `people.id` (many-to-one)]
- [e.g., `routes` ←→ `people` (many-to-many via junction table)]

**Existing Tables Affected**:
- [List any existing tables that need modification]

## Access Rules

**Who can read/write?**
- [e.g., "Authenticated users can read all routes and people"]
- [e.g., "Only admins can assign routes to people"]
- [e.g., "Users can see their own assigned routes"]

**RLS Policies Needed**:
- [e.g., "Public read access for routes"]
- [e.g., "Admin-only write access for assignments"]

## API Actions

**Endpoints needed**:
- [ ] `POST /api/routes/assign` - Assign a route to a person
- [ ] `DELETE /api/routes/:id/assign` - Unassign a route
- [ ] `GET /api/routes?person_id=xxx` - Get routes for a person

**Operations**:
- Create: [e.g., "Create route assignment"]
- Read: [e.g., "List routes with assigned person"]
- Update: [e.g., "Reassign route to different person"]
- Delete: [e.g., "Remove assignment"]

## Client Hooks/Components

**Hooks needed**:
- [e.g., `useAssignRoute(personId, routeId)`]
- [e.g., `useRoutesByPerson(personId)`]

**Components to create/update**:
- [e.g., "Add person dropdown to RouteTable"]
- [e.g., "Show assigned person name in route list"]
- [e.g., "Add 'Assign Route' button to person detail card"]

**Frontend Views**:
- [e.g., "Routes table should show person name column"]
- [e.g., "Person detail should show list of assigned routes"]

## Validation/Constraints

**Required fields**:
- [e.g., `person_id` is required when assigning]

**Uniques**:
- [e.g., "A route can only be assigned to one person at a time"]

**Business rules**:
- [e.g., "A person can have maximum 5 routes assigned"]
- [e.g., "Cannot assign route if person already has 5 routes"]

## CSV Import (if applicable)

**CSV format**:
```
route_id,person_id,assigned_at
route-001,person-123,2025-01-11
route-002,person-456,2025-01-11
```

**Import behavior**:
- [e.g., "Upsert assignments (update if exists, create if new)"]
- [e.g., "Validate that route_id and person_id exist before creating"]

**Endpoint**: [e.g., `POST /api/routes/import-assignments`]

## Tests

**Happy paths**:
1. [e.g., "Assign route to person successfully"]
2. [e.g., "List routes shows assigned person name"]

**Failure cases**:
1. [e.g., "Cannot assign route if person already has 5 routes"]
2. [e.g., "Cannot assign non-existent route"]

**Edge cases**:
- [e.g., "What happens when person is deleted?"]
- [e.g., "What happens when route is deleted?"]

## Additional Context

**Related features**:
- [e.g., "This relates to the route management feature"]

**Dependencies**:
- [e.g., "Requires people table to exist"]
- [e.g., "Requires routes table to exist"]

**Notes**:
- [Any additional information that would help implementation]


