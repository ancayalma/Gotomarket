"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { TrendingUp, DollarSign, Settings2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RevenueTargetModal } from "./RevenueTargetModal";
import { updateRevenueTarget } from "../../_actions/update-revenue-target";

export const RevenuePacingWidget = ({
    currentRevenue = 0,
    targetRevenue = 10000,
    projectedEOM = 0,
    daysLeft = 0
}: {
    currentRevenue?: number,
    targetRevenue?: number,
    projectedEOM?: number,
    daysLeft?: number
}) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const progress = targetRevenue > 0 ? (currentRevenue / targetRevenue) * 100 : 0;

    const handleUpdateTarget = async (newTarget: number) => {
        const result = await updateRevenueTarget(newTarget);
        if (!result.success) {
            throw new Error(result.error || "Failed to update target");
        }
    };

    return (
        <>
            <WidgetWrapper
                title="Revenue Pacing"
                icon={TrendingUp}
                iconColor="text-emerald-400"
                rightAction={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                        title="Adjust Target"
                    >
                        <Settings2 size={14} />
                    </button>
                }
            >
                <div className="space-y-6 pt-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground pb-1">Current Period</p>
                            <div className="flex items-center gap-1 text-2xl font-bold text-foreground tracking-tight">
                                <span className="text-muted-foreground font-normal text-lg">$</span>
                                {(currentRevenue).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Pacing vs Target</span>
                            <span>{Math.round(progress)}% of ${targetRevenue.toLocaleString()}</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-muted/40" indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Projected EOM</p>
                            <p className="text-sm font-medium text-foreground">${Math.round(projectedEOM).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                            <p className="text-sm font-medium text-foreground">{daysLeft} Days</p>
                        </div>
                    </div>
                </div>
            </WidgetWrapper>

            <RevenueTargetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentTarget={targetRevenue}
                onUpdate={handleUpdateTarget}
            />
        </>
    );
};
