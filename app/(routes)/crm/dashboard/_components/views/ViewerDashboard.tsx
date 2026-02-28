"use client";

import React from "react";
import DashboardCard from "../DashboardCard";
import { DollarSign, TrendingUp } from "lucide-react";

interface ViewerDashboardProps {
    revenue: number;
    activePipelineCount: number;
}

const ViewerDashboard = ({ revenue, activePipelineCount }: ViewerDashboardProps) => {
    return (
        <div className="flex flex-col space-y-8">
            <div>
                <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">
                    Executive Summary
                </h2>
                <p className="text-muted-foreground/80 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4 mb-8">
                    High-level insights.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard
                        icon={DollarSign}
                        label="Revenue Forecast"
                        count={revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                        variant="default"
                        className="cursor-default hover:scale-100"
                    />
                    <DashboardCard
                        icon={TrendingUp}
                        label="Active Pipeline"
                        count={activePipelineCount}
                        variant="default"
                        className="cursor-default hover:scale-100"
                    />
                </div>
            </div>
        </div>
    );
};

export default ViewerDashboard;
