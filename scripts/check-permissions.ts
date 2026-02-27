
import fs from 'fs';
import path from 'path';
import { CRM_MODULES } from '../lib/role-permissions';

/**
 * permission-check.ts
 * 
 * This script ensures that every physical route in `app/(routes)/crm`
 * has a corresponding entry in `lib/role-permissions.ts`.
 * 
 * It prevents "Shadow IT" pages that are reachable but ungated.
 */

const CRM_ROUTES_ROOT = path.join(process.cwd(), 'app', '(routes)', 'crm');

function getDirectories(source: string) {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

// Ignore utility folders that aren't pages
const IGNORED_FOLDERS = [
    'components',
    'layout',
    'api',
    'utils',
    'hooks',
    'types',
    'styles'
];

// Helper to flatten modules for easy searching
function getAllModuleIds(modules: typeof CRM_MODULES) {
    const ids: string[] = [];
    // We also want to check if the *route* matches, not just the ID.
    // But for top-level, we often use the ID as the key.
    // Let's gather top-level IDs and Routes.
    return modules.map(m => ({
        id: m.id,
        route: m.route
    }));
}

async function main() {
    console.log("🔍 Starting Full Platform Permission Integrity Check...");

    if (!fs.existsSync(CRM_ROUTES_ROOT)) {
        console.error(`❌ CRM Routes directory not found at: ${CRM_ROUTES_ROOT}`);
        process.exit(1);
    }

    // 1. Get Physical Routes from /crm/
    const physicalCrmRoutes = getDirectories(CRM_ROUTES_ROOT)
        .filter(dir => !IGNORED_FOLDERS.includes(dir));

    console.log(`📂 Scanning physical CRM routes in /app/(routes)/crm...`);

    // 2. Get Configured Modules from lib/role-permissions.ts
    const configuredModules = CRM_MODULES;
    const configuredRoutes = configuredModules.map(m => m.route).filter(Boolean) as string[];
    const configuredIds = configuredModules.map(m => m.id);

    console.log(`🛡️ Verified ${configuredModules.length} total modules in permission system.`);

    // 3. Bidirectional Check
    const errors: string[] = [];

    // Check 1: Physical -> Config (No ungated folders in /crm/)
    physicalCrmRoutes.forEach(dir => {
        const expectedRoute = `/crm/${dir}`;
        // Exceptions for renamed routes or special mappings
        const exceptions: Record<string, string> = {
            'prompt': 'ai_lab',
            'my-projects': 'projects',
            'validation-rules': 'guard-rules'
        };

        const mappedId = exceptions[dir] || dir;
        const isMapped = configuredRoutes.includes(expectedRoute) ||
            configuredRoutes.some(r => r.endsWith(`/${dir}`)) ||
            configuredIds.includes(mappedId);

        if (!isMapped) {
            errors.push(`❌ UNGATED ROUTE DETECTED: "/crm/${dir}" exists in filesystem but is not in CRM_MODULES.`);
        }
    });

    // Check 2: Config -> Physical (Ensure routes exist)
    configuredModules.forEach(mod => {
        if (mod.route && mod.route.startsWith('/crm/')) {
            const folderName = mod.route.split('/').pop();
            const folderPath = path.join(CRM_ROUTES_ROOT, folderName!);
            if (!fs.existsSync(folderPath)) {
                // Check if it's a dynamic route or special page
                if (!folderName?.includes('[')) {
                    errors.push(`⚠️ BROKEN CONFIG: Module "${mod.name}" points to "${mod.route}" but folder does not exist.`);
                }
            }
        }
    });

    if (errors.length > 0) {
        console.error("\n🚨 PERMISSION INTEGRITY FAILURE 🚨");
        errors.forEach(e => console.error(e));
        console.error("\nFix this by adjusting `lib/role-permissions.ts` or the filesystem.\n");
        process.exit(1);
    } else {
        console.log(`✅ Success: All ${configuredModules.length} modules are active and verified.`);
        process.exit(0);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
