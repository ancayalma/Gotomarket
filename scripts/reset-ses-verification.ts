/**
 * reset-ses-verification.ts
 * ---------------------------------------------------------------------------
 * One-time migration script for SES account migration.
 *
 * When the platform moves to a new Amazon SES account, all previously created
 * email identities are gone. This script resets `sesEmailVerified` to false
 * for every user so the existing verification gate in `(routes)/layout.tsx`
 * automatically forces them through the re-verification flow on next login.
 *
 * Admin users are included by default because their emails are used as SES
 * sender identities for outreach campaigns, feedback replies, and other
 * transactional emails. While admins bypass the UI verification gate, they
 * still need valid SES identities on the new account to send mail.
 *
 * Usage:
 *   npx tsx scripts/reset-ses-verification.ts
 *
 * Options:
 *   --dry-run          Preview affected users without making changes
 *   --exclude-admins   Skip admin users (not recommended — breaks outreach)
 * ---------------------------------------------------------------------------
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");
const EXCLUDE_ADMINS = process.argv.includes("--exclude-admins");

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  SES Account Migration — Reset Email Verification Flags");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Mode:           ${DRY_RUN ? "🔍 DRY RUN (no changes)" : "⚡ LIVE"}`);
  console.log(`  Include Admins: ${EXCLUDE_ADMINS ? "No (⚠️ admin outreach will fail)" : "Yes"}`);
  console.log("");

  // Build the filter: only users currently marked as verified
  const where: any = {
    sesEmailVerified: true,
  };

  if (EXCLUDE_ADMINS) {
    where.is_admin = { not: true };
  }

  // Preview affected users
  const affectedUsers = await prisma.users.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      is_admin: true,
      team_role: true,
    },
  });

  console.log(`  Found ${affectedUsers.length} verified user(s) to reset:\n`);

  for (const u of affectedUsers) {
    const role = u.is_admin ? " [ADMIN]" : "";
    console.log(`    • ${u.email || "(no email)"}${role}  —  ${u.name || "(unnamed)"}`);
  }

  console.log("");

  if (affectedUsers.length === 0) {
    console.log("  ✅ No users need resetting. Exiting.");
    return;
  }

  if (DRY_RUN) {
    console.log("  🔍 Dry run complete. Re-run without --dry-run to apply changes.");
    return;
  }

  // Execute the bulk update
  const result = await prisma.users.updateMany({
    where,
    data: { sesEmailVerified: false },
  });

  console.log(`  ✅ Reset ${result.count} user(s) to sesEmailVerified = false.`);
  console.log("");
  console.log("  Users will be prompted to re-verify their email on next login.");
  console.log("  Platform admins bypass the verification gate automatically.");
  console.log("═══════════════════════════════════════════════════════════");
}

main()
  .catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
