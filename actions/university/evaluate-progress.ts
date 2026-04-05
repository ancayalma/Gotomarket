"use server";

import { dbAdapter } from "@/lib/database/db-adapter";
import { prismadb } from "@/lib/prisma";
import { addRawXP } from "@/actions/quests/add-raw-xp";
import { ObjectId } from "mongodb";

// Master lookup of XP values matching CertificationPaths.tsx
const LEVEL_XP_REWARDS: Record<number, number> = {
    1: 50,
    2: 50,
    3: 100,
    4: 100,
    5: 150,
    6: 200,
    7: 250,
    8: 150,
    9: 300,
    10: 200,
    11: 200,
    12: 500,
    13: 150,
    14: 300,
    15: 400,
    16: 600,
    17: 450,
    18: 500,
    19: 400,
    20: 550,
    21: 750,
    22: 600,
    23: 1000,
    24: 1200,
    25: 2500
};

// Which module should be temporarily unlocked at which level
const LEVEL_MODULE_UNLOCKS: Record<number, string> = {
    // Data Pioneer Phase unlocks some advanced sourcing
    11: "campaigns", // Outreach Architect starts
    16: "workflows", // Automation Specialist starts
};

export async function evaluateMasteryProgress(userId: string) {
    try {
        const usersCol = await dbAdapter.getNativeCollection("Users");
        const user = await usersCol.findOne({ _id: new ObjectId(userId) });
        if (!user) return null;

        const currentLevel = user.university_level || 1;
        let claimedLevels: number[] = user.university_claimed_levels || [];
        const teamId = user.current_team_id;

        // Self-healing: if currentLevel is 1, they shouldn't have claimed Level 1 XP yet 
        // (you get Level 1 XP when graduating to Level 2). This fixes legacy buggy claims.
        if (currentLevel === 1 && claimedLevels.includes(1)) {
            await usersCol.updateOne({ _id: new ObjectId(userId) }, { $pull: { university_claimed_levels: 1 } } as any);
            claimedLevels = claimedLevels.filter((lvl: number) => lvl !== 1);
        }

        // Backfill missing XP for levels they already passed
        for (let l = 1; l <= currentLevel; l++) {
            if (!claimedLevels.includes(l)) {
                
                // If it's the exact currentLevel, we only grant it if they JUST leveled up to it
                // Actually, if it's not in claimedLevels yet, they should get it. But currentLevel XP is granted when moving to the NEW level.
                // Wait, if they are already Level 2, they should have gotten Level 1 XP. So we grant for all l < currentLevel.
                if (l < currentLevel) {
                    await usersCol.updateOne({ _id: new ObjectId(userId) }, { $push: { university_claimed_levels: l } } as any);
                    await addRawXP({ userId, xpAmount: LEVEL_XP_REWARDS[l] || 100, reason: `Level ${l} Completed (Retroactive)` });
                    claimedLevels.push(l);
                }
            }
        }

        // We will run queries specifically for the current level the user is stuck on.
        let tasksDoneCount = 0;
        let totalTasks = 3;

        // Return a state object to the frontend
        const resultFlags: Record<string, boolean> = {};

        if (currentLevel === 1) {
            // Level 1 checks
            const hasAvatar = !!user.avatar;
            resultFlags["avatar"] = hasAvatar;
            
            const viewedDashboard = await prismadb.userMetrics.findUnique({
                where: { userId_metricKey: { userId, metricKey: "viewed_dashboard" } }
            });
            resultFlags["dashboard"] = !!viewedDashboard;
            
            const viewedSettings = await prismadb.userMetrics.findUnique({
                where: { userId_metricKey: { userId, metricKey: "updated_timezone" } }
            });
            resultFlags["timezone"] = !!viewedSettings;
            
            tasksDoneCount = [hasAvatar, !!viewedDashboard, !!viewedSettings].filter(Boolean).length;
        }

        if (currentLevel === 2) {
            // Level 2 checks
            // Check signature from Prisma to ensure we get the latest
            const realUser = await prismadb.users.findUnique({ where: { id: userId }});
            const hasSignature = !!realUser?.signature_html && realUser?.signature_html.length > 5;
            resultFlags["signature"] = hasSignature;

            // Check InternalMessage table
            const hasSentMessage = await prismadb.internalMessage.findFirst({
                where: { sender_id: userId }
            });
            resultFlags["message"] = !!hasSentMessage;

            // Check if they viewed or updated notifications using UserMetrics
            const viewedNotifs = await prismadb.userMetrics.findFirst({
                where: { userId, metricKey: { in: ["viewed_notifications", "updated_notification_settings"] } }
            });
            resultFlags["notifications"] = !!viewedNotifs; 

            tasksDoneCount = [hasSignature, !!hasSentMessage, !!viewedNotifs].filter(Boolean).length;
        }

        if (currentLevel === 3) {
            const hasLead = await prismadb.crm_Leads.findFirst({ 
                where: { OR: [{ createdBy: userId }, { assigned_to: userId }] } 
            });
            resultFlags["lead_created"] = !!hasLead;

            const hasNote = await prismadb.crm_Lead_Activities.findFirst({ 
                where: { user: userId, type: "note" } 
            });
            resultFlags["note_created"] = !!hasNote;
            
            // Check if a contact was updated by this user
            const updatedContact = await prismadb.crm_Contacts.findFirst({
                where: { updatedBy: userId }
            });
            resultFlags["contact_updated"] = !!updatedContact;

            tasksDoneCount = [!!hasLead, !!hasNote, !!updatedContact].filter(Boolean).length;
        }
        
        if (currentLevel === 4) {
            const userTasks = await prismadb.tasks.findFirst({ where: { user: userId } });
            const hasCreatedTask = !!userTasks;
            
            const completedTask = await prismadb.tasks.findFirst({ 
                where: { user: userId, taskStatus: "COMPLETE" } 
            });
            const hasCompletedTask = !!completedTask;
            
            // Linked task means opportunityId is set
            const linkedTask = await prismadb.tasks.findFirst({
                where: { user: userId, opportunityId: { not: null } }
            });
            resultFlags["linked_task"] = !!linkedTask;

            tasksDoneCount = [hasCreatedTask, hasCompletedTask, !!linkedTask].filter(Boolean).length;
        }
        
        if (currentLevel === 5) {
            const hasGlobalSearch = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "used_global_search" } } });
            const hasCustomFilter = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "used_custom_filter" } } });
            const hasBookmark = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "saved_bookmark" } } });
            
            resultFlags["global_search"] = !!hasGlobalSearch;
            resultFlags["custom_filter"] = !!hasCustomFilter;
            resultFlags["bookmark"] = !!hasBookmark;
            
            tasksDoneCount = [!!hasGlobalSearch, !!hasCustomFilter, !!hasBookmark].filter(Boolean).length;
        }
        
        if (currentLevel === 6) {
            const hasOppy = await prismadb.crm_Opportunities.findFirst({ where: { OR: [{ createdBy: userId }, { assigned_to: userId }] } });
            const hasOppyContact = await prismadb.crm_Opportunities.findFirst({ where: { OR: [{ createdBy: userId }, { assigned_to: userId }], contact: { not: null } } });
            const hasMoved = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "opportunity_moved" } } });

            resultFlags["opportunity_created"] = !!hasOppy;
            resultFlags["opportunity_contact"] = !!hasOppyContact;
            resultFlags["opportunity_moved"] = !!hasMoved;

            tasksDoneCount = [!!hasOppy, !!hasOppyContact, !!hasMoved].filter(Boolean).length;
        }

        if (currentLevel === 7) {
            const kanbanFiltered = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "kanban_filtered" } } });
            const opportunityTagged = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "opportunity_tagged" } } });
            const opportunityNextStep = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "opportunity_next_step" } } });

            resultFlags["kanban_filtered"] = !!kanbanFiltered;
            resultFlags["opportunity_tagged"] = !!opportunityTagged;
            resultFlags["opportunity_next_step"] = !!opportunityNextStep;

            tasksDoneCount = [!!kanbanFiltered, !!opportunityTagged, !!opportunityNextStep].filter(Boolean).length;
        }

        if (currentLevel === 8) {
            const emailConnected = await prismadb.crm_Emails.findFirst({ where: { userId } });
            const emailSent = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "sent_crm_email" } } });
            const emailTemplate = await prismadb.crm_Outreach_Items.findFirst({ where: { userId, type: "email" } });

            resultFlags["email_connected"] = !!emailConnected;
            resultFlags["email_sent"] = !!emailSent;
            resultFlags["email_template"] = !!emailTemplate;

            tasksDoneCount = [!!emailConnected, !!emailSent, !!emailTemplate].filter(Boolean).length;
        }

        if (currentLevel === 9) {
            const calendarConnected = user.calendar_selected_ids && user.calendar_selected_ids.length > 0;
            const meetingLink = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "shared_booking_link" } } });
            const meetingNote = await prismadb.crm_Lead_Activities.findFirst({ where: { user: userId, type: "meeting_note" } });

            resultFlags["calendar_connected"] = !!calendarConnected;
            resultFlags["meeting_link"] = !!meetingLink;
            resultFlags["meeting_note"] = !!meetingNote;

            tasksDoneCount = [!!calendarConnected, !!meetingLink, !!meetingNote].filter(Boolean).length;
        }

        if (currentLevel === 10) {
            const mentionUser = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "mentioned_user" } } });
            const reassignRecord = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "reassigned_record" } } });
            const shareRecord = await prismadb.userMetrics.findUnique({ where: { userId_metricKey: { userId, metricKey: "shared_record_link" } } });

            resultFlags["mention_user"] = !!mentionUser;
            resultFlags["reassign_record"] = !!reassignRecord;
            resultFlags["share_record"] = !!shareRecord;

            tasksDoneCount = [!!mentionUser, !!reassignRecord, !!shareRecord].filter(Boolean).length;
        }

        if (currentLevel > 10) {
            tasksDoneCount = 0; 
        }

        // Check if level should be incremented
        let newLevel = currentLevel;
        let leveledUp = false;

        if (tasksDoneCount === totalTasks) {
            newLevel = currentLevel + 1;
            leveledUp = true;

            // ALWAYS update the level up so it properly saves in DB
            await usersCol.updateOne({ _id: new ObjectId(userId) }, { 
                $set: { university_level: newLevel }
            } as any);

            // Grant XP for the level they just finished (currentLevel) only if not claimed
            if (!claimedLevels.includes(currentLevel)) {
                await usersCol.updateOne({ _id: new ObjectId(userId) }, { 
                    $push: { university_claimed_levels: currentLevel }
                } as any);
                await addRawXP({ userId, xpAmount: LEVEL_XP_REWARDS[currentLevel] || 100, reason: `Level ${currentLevel} Completed` });
                
                // Temporary unlock logic
                const requiredModuleToUnlock = LEVEL_MODULE_UNLOCKS[newLevel];
                if (requiredModuleToUnlock) {
                    const teamsCol = await dbAdapter.getNativeCollection("Teams");
                    const expiry = new Date();
                    expiry.setDate(expiry.getDate() + 14); // 14 Days

                    await teamsCol.updateOne(
                        { id: teamId }, 
                        { 
                            $push: { 
                                temporary_modules: { 
                                    module: requiredModuleToUnlock, 
                                    expires_at: expiry 
                                } 
                            } 
                        } as any
                    );
                }
            }
        }

        return {
            level: newLevel,
            flags: resultFlags,
            leveledUp
        };

    } catch (e) {
        console.error("Failed to evaluate mastery:", e);
        return null;
    }
}
