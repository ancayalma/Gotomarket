"use client";

import React from "react";
import { useSalesCommand } from "./SalesCommandProvider";
import TeamAnalytics from "../../dashboard/_components/TeamAnalytics";
import QuestLeaderboardWidget from "./QuestLeaderboardWidget";
import { motion } from "framer-motion";
import { Users2 } from "lucide-react";

export default function TeamCommandView() {
    const { data, handleUserSelect, isMember } = useSalesCommand();
    const { teamData } = data;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center">
                    <Users2 className="h-4.5 w-4.5 text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                        Team Command Center
                    </h2>
                    <p className="text-xs text-white/25 font-medium">Aggregate performance and leaderboards</p>
                </div>
            </div>

            {/* Reuse the existing robust component */}
            <TeamAnalytics
                team={teamData.team as any}
                leaderboard={teamData.leaderboard as any}
                weights={teamData.weights as any}
                onUserSelect={handleUserSelect}
                isMember={isMember}
            />

            {/* Quest Leaderboard */}
            <QuestLeaderboardWidget />
        </motion.div>
    );
}
