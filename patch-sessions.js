const fs = require('fs');

const filesToPatch = [
    'app/api/user/resetPasswordWithToken/route.ts',
    'app/api/user/[userId]/admin-reset-password/route.ts',
    'app/api/user/[userId]/setnewpass/route.ts',
    'app/api/user/set-password/route.ts',
    'app/api/user/passwordReset/route.ts',
    'app/api/user/deactivateAdmin/[userId]/route.ts',
    'app/api/user/deactivate/[userId]/route.ts',
    'app/api/user/[userId]/role/route.ts',
    'app/api/user/mfa/webauthn/register-verify/route.ts'
];

for (const file of filesToPatch) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Add session version increment
        // Look for data: { and add session_version: { increment: 1 },
        content = content.replace(/(await prismadb\.users\.update\([\s\S]*?data:\s*\{)/g, "$1\n                    session_version: { increment: 1 },\n");
        fs.writeFileSync(file, content);
        console.log("Patched", file);
    } else {
        console.log("File not found:", file);
    }
}
