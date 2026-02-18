"use client";

import { Card, Title, AreaChart, Subtitle } from "@tremor/react";

interface AiUsageTrendsProps {
    data: {
        date: string;
        tokens: number;
        requests: number;
    }[];
}

export const AiUsageTrends = ({ data }: AiUsageTrendsProps) => {
    return (
        <Card className="bg-card border-border/50">
            <Title className="text-foreground">AI Consumption Pulse</Title>
            <Subtitle className="text-muted-foreground">Daily trend of token consumption and interaction volume.</Subtitle>
            <AreaChart
                className="mt-6 h-72"
                data={data}
                index="date"
                categories={["tokens", "requests"]}
                colors={["indigo", "fuchsia"]}
                showLegend={true}
                showGridLines={true}
                yAxisWidth={60}
                valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
            />
        </Card>
    );
};
