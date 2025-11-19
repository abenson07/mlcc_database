-- Add membership_id foreign key to people table
-- This links people to their active membership

ALTER TABLE people 
ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL;

-- Create index for membership lookups
CREATE INDEX IF NOT EXISTS idx_people_membership_id ON people(membership_id);

-- Add comment for documentation
COMMENT ON COLUMN people.membership_id IS 'Foreign key to memberships table, links person to their active membership';


