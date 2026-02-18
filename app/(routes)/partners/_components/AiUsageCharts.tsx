"use client";

import { Card, Title, BarChart, Subtitle } from "@tremor/react";

interface AiUsageChartsProps {
    title: string;
    subtitle: string;
    chartData: {
        name: string;
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
        requestCount: number;
    }[];
}

export const AiUsageCharts = ({ chartData, title, subtitle }: AiUsageChartsProps) => {
    return (
        <div className="space-y-6">
            <Card className="bg-card border-border/50">
                <Title className="text-foreground">{title} (Tokens)</Title>
                <Subtitle className="text-muted-foreground">{subtitle}</Subtitle>
                <BarChart
                    className="mt-6 h-72"
                    data={chartData}
                    index="name"
                    categories={["totalTokens", "promptTokens", "completionTokens"]}
                    colors={["indigo", "fuchsia", "purple"]}
                    yAxisWidth={60}
                    valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
                />
            </Card>

            <Card className="bg-card border-border/50">
                <Title className="text-foreground">Interaction Frequency</Title>
                <Subtitle className="text-muted-foreground">Number of AI requests/messages per organization.</Subtitle>
                <BarChart
                    className="mt-6 h-72"
                    data={chartData}
                    index="name"
                    categories={["requestCount"]}
                    colors={["indigo"]}
                    yAxisWidth={60}
                    valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
                />
            </Card>
        </div>
    );
};
