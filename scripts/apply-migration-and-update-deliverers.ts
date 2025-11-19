// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkMigrationColumns() {
  try {
    console.log('📋 Checking if migration columns exist...\n');
    
    // Try to select the new columns to see if they exist
    const { error: columnCheckError } = await supabase
      .from('routes')
      .select('primary_deliverer_email, primary_deliverer_id')
      .limit(0);
    
    if (columnCheckError && (
      columnCheckError.message.includes('column') && 
      (columnCheckError.message.includes('does not exist') || 
       columnCheckError.message.includes('unknown column') ||
       columnCheckError.code === '42703')
    )) {
      console.log('❌ Columns do not exist yet.');
      console.log('\n📝 Please apply the migration manually:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy and paste the following SQL:\n');
      console.log('-- Add primary_deliverer_email and primary_deliverer_id columns');
      console.log('ALTER TABLE routes ADD COLUMN IF NOT EXISTS primary_deliverer_email TEXT;');
      console.log('ALTER TABLE routes ADD COLUMN IF NOT EXISTS primary_deliverer_id UUID REFERENCES people(id) ON DELETE SET NULL;');
      console.log('CREATE INDEX IF NOT EXISTS idx_routes_primary_deliverer_email ON routes(primary_deliverer_email);');
      console.log('CREATE INDEX IF NOT EXISTS idx_routes_primary_deliverer_id ON routes(primary_deliverer_id);\n');
      console.log('   3. Click "Run"');
      console.log('   4. Then re-run this script\n');
      throw new Error('Migration columns not found. Please apply migration first.');
    }
    
    console.log('✅ Migration columns exist!\n');
    
  } catch (error: any) {
    if (error.message?.includes('Migration columns not found')) {
      throw error;
    }
    // If we get here, columns might exist or there's another issue
    console.log('⚠️  Could not verify columns. Proceeding with update script...\n');
  }
}

interface RouteDelivererRow {
  routeName: string;
  emails: string[];
}

function parseCSV(csvPath: string): RouteDelivererRow[] {
  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const rows: RouteDelivererRow[] = [];
  
  for (const line of lines) {
    // Split by comma, but handle quoted values
    const match = line.match(/^(.+?),(.*)$/);
    if (!match) continue;
    
    let routeName = match[1].trim();
    let emailString = match[2].trim();
    
    // Remove quotes if present
    if (routeName.startsWith('"') && routeName.endsWith('"')) {
      routeName = routeName.slice(1, -1);
    }
    if (emailString.startsWith('"') && emailString.endsWith('"')) {
      emailString = emailString.slice(1, -1);
    }
    
    // Skip rows without email
    if (!emailString) continue;
    
    // Handle multiple emails (comma-separated)
    const emails = emailString
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);
    
    rows.push({
      routeName,
      emails
    });
  }
  
  return rows;
}

async function updateRouteDeliverers() {
  try {
    console.log('🚀 Starting route deliverer update...\n');
    
    // Parse CSV file
    const csvPath = '/Users/alexbenson/Downloads/route-deliverer.csv';
    console.log(`📄 Reading CSV from: ${csvPath}`);
    const routeDeliverers = parseCSV(csvPath);
    console.log(`Found ${routeDeliverers.length} route entries\n`);
    
    // Get all people for email lookup
    console.log('👥 Fetching people from database...');
    const { data: allPeople, error: peopleError } = await supabase
      .from('people')
      .select('id, email');
    
    if (peopleError) {
      throw peopleError;
    }
    
    // Create email lookup map (normalize to lowercase)
    const emailToPersonId = new Map<string, string>();
    allPeople?.forEach(person => {
      if (person.email) {
        emailToPersonId.set(person.email.toLowerCase().trim(), person.id);
      }
    });
    
    console.log(`Found ${allPeople?.length || 0} people in database\n`);
    
    // Get all routes for name matching
    console.log('🛣️  Fetching routes from database...');
    const { data: allRoutes, error: routesError } = await supabase
      .from('routes')
      .select('id, route_name, primary_deliverer_email, primary_deliverer_id');
    
    if (routesError) {
      throw routesError;
    }
    
    console.log(`Found ${allRoutes?.length || 0} routes in database\n`);
    
    // Create route name lookup map (normalize for matching)
    const routeNameToRoutes = new Map<string, typeof allRoutes>();
    allRoutes?.forEach(route => {
      const normalizedName = (route.route_name || '').toLowerCase().trim();
      if (!routeNameToRoutes.has(normalizedName)) {
        routeNameToRoutes.set(normalizedName, []);
      }
      routeNameToRoutes.get(normalizedName)!.push(route);
    });
    
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const notFoundRoutes: string[] = [];
    
    console.log('🔄 Processing route updates...\n');
    
    // Process each CSV row
    for (const { routeName, emails } of routeDeliverers) {
      // Find matching routes by name
      const normalizedRouteName = routeName.toLowerCase().trim();
      const matchingRoutes = routeNameToRoutes.get(normalizedRouteName) || [];
      
      if (matchingRoutes.length === 0) {
        notFound++;
        notFoundRoutes.push(routeName);
        console.log(`⚠️  Route not found: "${routeName}"`);
        continue;
      }
      
      // Find person ID from first valid email
      let personId: string | null = null;
      let matchedEmail: string | null = null;
      
      for (const email of emails) {
        const normalizedEmail = email.toLowerCase().trim();
        const foundId = emailToPersonId.get(normalizedEmail);
        if (foundId) {
          personId = foundId;
          matchedEmail = email;
          break;
        }
      }
      
      if (!personId) {
        skipped++;
        console.log(`⏭️  Skipped "${routeName}": No person found for emails: ${emails.join(', ')}`);
        continue;
      }
      
      // Update all matching routes
      for (const route of matchingRoutes) {
        // Skip if already set to the same values
        if (route.primary_deliverer_id === personId && 
            route.primary_deliverer_email === matchedEmail) {
          skipped++;
          continue;
        }
        
        try {
          const { error: updateError } = await supabase
            .from('routes')
            .update({
              primary_deliverer_email: matchedEmail,
              primary_deliverer_id: personId
            })
            .eq('id', route.id);
          
          if (updateError) {
            throw updateError;
          }
          
          updated++;
          console.log(`✅ Updated "${routeName}" (${route.id}): ${matchedEmail} → ${personId}`);
        } catch (error) {
          errors++;
          const errorMsg = `Error updating route "${routeName}" (${route.id}): ${error instanceof Error ? error.message : String(error)}`;
          errorDetails.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Routes updated: ${updated}`);
    console.log(`Routes skipped: ${skipped}`);
    console.log(`Routes not found: ${notFound}`);
    console.log(`Errors: ${errors}`);
    
    if (notFoundRoutes.length > 0) {
      console.log(`\n=== ROUTES NOT FOUND ===`);
      notFoundRoutes.forEach(route => console.log(`  - ${route}`));
    }
    
    if (errorDetails.length > 0) {
      console.log(`\n=== ERRORS ===`);
      errorDetails.forEach(err => console.log(`  ${err}`));
    }
    
    console.log('\n✅ Route deliverer update complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    // First check if migration columns exist
    try {
      await checkMigrationColumns();
    } catch (error: any) {
      if (error.message?.includes('Migration columns not found')) {
        // Don't exit, just warn and continue - the update will fail gracefully
        console.log('\n⚠️  Continuing anyway - update will fail if columns are missing...\n');
      } else {
        throw error;
      }
    }
    
    // Then run the update
    await updateRouteDeliverers();
    
  } catch (error: any) {
    if (error.message?.includes('column') && error.message.includes('does not exist')) {
      console.error('\n❌ Update failed: Migration columns do not exist.');
      console.error('   Please apply the migration first (see instructions above).\n');
    } else {
      console.error('Fatal error:', error);
    }
    process.exit(1);
  }
}

main();

