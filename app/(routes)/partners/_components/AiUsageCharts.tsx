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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
            <Card className="bg-[#09090b] border-[#27272a] h-full">
                <Title className="text-foreground">{title}</Title>
                <Subtitle className="text-muted-foreground">{subtitle}</Subtitle>
                <BarChart
                    className="mt-6 h-[220px]"
                    data={chartData}
                    index="name"
                    categories={["promptTokens", "completionTokens"]}
                    colors={["teal", "fuchsia"]}
                    yAxisWidth={60}
                    valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
                    stack={true}
                />
            </Card>

            <Card className="bg-[#09090b] border-[#27272a] h-full">
                <Title className="text-foreground">Interaction Frequency</Title>
                <Subtitle className="text-muted-foreground">Number of AI requests/messages per organization.</Subtitle>
                <BarChart
                    className="mt-6 h-[220px]"
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
