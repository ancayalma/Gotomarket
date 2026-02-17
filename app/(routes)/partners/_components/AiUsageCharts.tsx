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
        <div className="dark">
            <Card className="bg-[#09090b] border-[#27272a]">
                <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">{title}</Title>
                <Subtitle className="text-tremor-content dark:text-dark-tremor-content">{subtitle}</Subtitle>
                <BarChart
                    className="mt-6"
                    data={chartData}
                    index="name"
                    categories={["totalTokens", "promptTokens", "completionTokens"]}
                    colors={["blue", "cyan", "indigo"]}
                    yAxisWidth={48}
                    valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
                />
            </Card>
        </div>
    );
};
