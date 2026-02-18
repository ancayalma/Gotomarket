"use client";

import { Card, Title, Subtitle, DonutChart, Legend } from "@tremor/react";

interface ModelDistributionChartProps {
    data: { name: string, value: number }[];
    title?: string;
    subtitle?: string;
}

export const ModelDistributionChart = ({ data, title = "Model Distribution", subtitle = "Token usage across different models." }: ModelDistributionChartProps) => {
    return (
        <Card className="bg-card border-border/50">
            {title && <Title className="text-foreground">{title}</Title>}
            {subtitle && <Subtitle className="text-muted-foreground">{subtitle}</Subtitle>}
            <DonutChart
                className="mt-8 h-48"
                data={data}
                category="value"
                index="name"
                colors={["indigo", "fuchsia", "purple", "emerald", "rose"]}
                valueFormatter={(number: number) => number.toLocaleString()}
            />
            <div className="mt-6">
                <Legend
                    categories={data.map(d => d.name)}
                    colors={["indigo", "fuchsia", "purple", "emerald", "rose"]}
                />
            </div>
        </Card>
    );
};
