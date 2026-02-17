"use client";

import { Card, Title, Subtitle, DonutChart, Legend } from "@tremor/react";

interface ModelDistributionChartProps {
    data: { name: string, value: number }[];
    title?: string;
    subtitle?: string;
}

export const ModelDistributionChart = ({ data, title = "Model Distribution", subtitle = "Token usage across different models." }: ModelDistributionChartProps) => {
    return (
        <Card className="bg-[#09090b] border-[#27272a]">
            {title && <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">{title}</Title>}
            {subtitle && <Subtitle className="text-tremor-content dark:text-dark-tremor-content">{subtitle}</Subtitle>}
            <DonutChart
                className="mt-8 h-48"
                data={data}
                category="value"
                index="name"
                colors={["indigo", "fuchsia", "amber", "emerald", "rose"]}
                valueFormatter={(number: number) => number.toLocaleString()}
            />
            <div className="mt-6">
                <Legend
                    categories={data.map(d => d.name)}
                    colors={["indigo", "fuchsia", "amber", "emerald", "rose"]}
                />
            </div>
        </Card>
    );
};
