-- Add primary_deliverer_email and primary_deliverer_id columns to routes table
-- These columns link routes to their primary deliverer (person)

-- Add email column for matching
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS primary_deliverer_email TEXT;

-- Add foreign key to people table
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS primary_deliverer_id UUID REFERENCES people(id) ON DELETE SET NULL;

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_routes_primary_deliverer_email ON routes(primary_deliverer_email);
CREATE INDEX IF NOT EXISTS idx_routes_primary_deliverer_id ON routes(primary_deliverer_id);

-- Add comments for documentation
COMMENT ON COLUMN routes.primary_deliverer_email IS 'Email address of the primary deliverer for this route, used for matching';
COMMENT ON COLUMN routes.primary_deliverer_id IS 'Foreign key to people table, links route to its primary deliverer';


