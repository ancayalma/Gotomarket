import { PrismaClient } from "@prisma/client";

/**
 * Seeds the Quests documentation article into the DocArticle collection.
 * Run: npx ts-node scripts/seed-quests-doc.ts
 */
const prisma = new PrismaClient();

const QUESTS_DOC_CONTENT = `# Quests

Quests are team-scoped gamification challenges that drive performance through competitive sprints and measurable goals. Admins create challenges, team members compete to complete them and earn Quest Points (QP).

## Overview

The Quests system transforms routine CRM activities into engaging competitive experiences. By setting clear targets with time-bound sprints, teams stay motivated and accountable.

### Key Concepts

- **Quest Points (QP)** - Earned by completing quests. QP accumulates on your profile and fuels the global leaderboard.
- **Sprints** - Time-boxed periods during which a quest is active. Presets range from Weekend Blitz to Quarterly campaigns.
- **Difficulty Tiers** - Easy, Medium, Hard, and Legendary, each with escalating QP rewards.
- **Leaderboards** - Real-time rankings visible in both the Quests page and the Sales Command dashboard.

## Plan Availability

Quests require an active paid plan:

- **Free**: No access (0 quests)
- **Individual Basic**: Up to 5 active quests
- **Individual Pro**: Up to 25 active quests
- **Enterprise / Exempt**: Unlimited quests

## Quest Types

Admins can choose from a catalog of pre-defined quest types:

### Sales & Pipeline
- **Close Leads** - Track lead closures
- **Convert Accounts** - Monitor account conversions
- **Close Deals** - Count won opportunities
- **Create Opportunities** - Track new pipeline entries
- **Revenue Target** - Hit revenue milestones

### Outreach
- **Send Emails** - Track outbound email volume
- **Book Meetings** - Count scheduled meetings
- **Make Calls** - Track dialer activity

### Productivity
- **Complete Tasks** - Track task completions
- **Add Contacts** - Monitor contact creation
- **Upload Documents** - Count document uploads

### Learning
- **Reach Mastery Level** - Hit University milestones
- **Login Streak** - Maintain daily login consistency

### Custom
- **Custom (Manual)** - Admin-tracked goals with manual progress updates

## Sprint Duration Presets

When creating a quest, admins select a sprint duration:

- **Weekend Blitz** - Friday 5pm to Sunday 11:59pm
- **Weekly Sprint** - 7-day sprint (Monday to Sunday)
- **Bi-Weekly** - 14-day challenge
- **Monthly Mission** - Full calendar month
- **Quarterly Quest** - 3-month campaign
- **Strong Start** - 1st to 4th of the month
- **Strong Finish** - 28th to last day of the month
- **Custom Duration** - Pick exact start and end dates
- **No Deadline** - Runs until manually closed

All presets support **auto-repeat**, automatically creating a new sprint when the current one ends.

## Quest Points & Rewards

### Base QP by Difficulty

| Difficulty | Base QP | XP Conversion |
|-----------|---------|---------------|
| Easy | 50 QP | 5 XP |
| Medium | 100 QP | 10 XP |
| Hard | 200 QP | 20 XP |
| Legendary | 500 QP | 50 XP + 50 bonus XP |

### Bonus Multipliers

Complete quests strategically to earn bonus QP:

- **Early Bird (+50%)** - Complete in the first 25% of the sprint duration
- **Speed Demon (+25%)** - Complete in the first 50% of the sprint duration
- **Overachiever (+30%)** - Exceed the target count by 50% or more
- **Perfect Streak (+20%)** - Maintain a streak of 3+ consecutive completed quests

### Badges

Unlock permanent badges on your profile:

- **Sharpshooter** - Complete 5 quests
- **Quest Champion** - Accumulate 1,000 QP
- **Streak Master** - Achieve a 5-quest completion streak
- **Legendary Hunter** - Complete a Legendary-difficulty quest

### University XP Integration

Quest Points convert to University XP at a rate of **100 QP = 10 XP**. Legendary quests grant an additional flat 50 XP bonus on completion. This means quest activity directly contributes to your Mastery Path progression.

## Leaderboards

### Global Leaderboard (Sales Command)

The primary Quest Points leaderboard is integrated into the Sales Command Team View. It ranks all team members by total QP and displays:

- Current rank position
- Total Quest Points
- Active streak count
- Quests completed
- Earned badges

### Per-Quest Leaderboard (Quests Page)

Each active quest shows a mini-leaderboard with participant progress and completion status visible on the quest card.

## Creating Quests (Admin Only)

Admins create quests through a guided 5-step wizard:

1. **Identity** - Set the quest title and optional description
2. **Quest Type** - Choose from the catalog of trackable activities
3. **Target & Difficulty** - Set the completion threshold and difficulty tier
4. **Duration** - Select a sprint preset or set custom dates
5. **Review** - Confirm all details and launch (or save as draft)

Quests can be launched immediately as Active or saved as Drafts for later activation.

## Progress Tracking

Quest progress is tracked automatically via hooks in existing CRM actions. When a team member performs a tracked action (e.g., closing a deal, sending an email), the system:

1. Checks for active quests matching that action type
2. Increments the user's progress count
3. Triggers reward calculation if the quest is completed

This is a non-blocking, fire-and-forget mechanism that does not impact CRM action performance.

## Permissions

| Action | Required Role |
|--------|--------------|
| View Quests | Member, Viewer, Admin, Super Admin |
| Participate in Quests | Member, Admin, Super Admin |
| Create Quests | Admin, Super Admin |
| Manage / Archive Quests | Admin, Super Admin |
| View Leaderboard | All roles |
`;

async function main() {
    console.log("Seeding Quests documentation article...");

    const existing = await prisma.docArticle.findUnique({
        where: { slug: "quests" },
    });

    if (existing) {
        await prisma.docArticle.update({
            where: { slug: "quests" },
            data: {
                title: "Quests",
                content: QUESTS_DOC_CONTENT,
                category: "Gamification",
                order: 50,
            },
        });
        console.log("Updated existing Quests article.");
    } else {
        await prisma.docArticle.create({
            data: {
                title: "Quests",
                slug: "quests",
                content: QUESTS_DOC_CONTENT,
                category: "Gamification",
                order: 50,
            },
        });
        console.log("Created new Quests article.");
    }

    console.log("Done. Article accessible at /docs/quests");
}

main()
    .catch((e) => {
        console.error("Failed to seed Quests doc:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
