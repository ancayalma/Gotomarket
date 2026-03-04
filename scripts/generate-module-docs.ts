import fs from 'fs';
import path from 'path';
import { CRM_MODULES } from '../lib/role-permissions';

const FEATURES_FILE = path.join(process.cwd(), 'CRM_FEATURES_OVERVIEW.md');

function scanModules() {
    console.log('🔍 Generating CRM Module Overview from Role Permissions...');

    const modules = CRM_MODULES;

    console.log(`✅ Processing ${modules.length} top-level modules.`);

    // Build the Markdown Content
    const title = "# CRM Core Feature List";
    const lastUpdate = `> Last Scan: ${new Date().toLocaleString()}\n`;
    const description = "Automatically generated list of functional modules defined in the permission system.\n";

    let content = `${title}\n\n${lastUpdate}\n${description}\n`;

    content += "## Active Feature Modules\n\n";
    content += "| Module Name | Identifier | Route | Description |\n";
    content += "| :--- | :--- | :--- | :--- |\n";

    modules.forEach(mod => {
        content += `| **${mod.name}** | \`${mod.id}\` | \`${mod.route || 'N/A'}\` | ${mod.description || ''} |\n`;
    });

    content += "\n## System Requirements\n- Every module listed here is gated via `lib/role-permissions.ts`.\n";
    content += "- New modules must be added to the permission matrix to be visible to users.\n";
    content += "- Every module listed here should have a corresponding policy in `lib/role-permissions.ts`.\n";

    fs.writeFileSync(FEATURES_FILE, content);
    console.log('📝 Updated CRM_FEATURES_OVERVIEW.md');
}

scanModules();
