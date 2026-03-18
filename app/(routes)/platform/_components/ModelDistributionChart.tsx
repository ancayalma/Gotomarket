"use client";

import { Card, Title, Subtitle, DonutChart, Legend } from "@tremor/react";

interface ModelDistributionChartProps {
    data: { name: string, value: number }[];
    title?: string;
    subtitle?: string;
}

export const ModelDistributionChart = ({ data, title = "Model Distribution", subtitle = "Token usage across different models." }: ModelDistributionChartProps) => {
    // Format the data to shorten the model name lengths
    const formattedData = data.map(item => {
        let shortName = item.name;
        // e.g. "anthropic.claude-3-5-haiku-20241022-v1:0" -> "claude-3-5-haiku"
        if (shortName.includes('.')) {
            const parts = shortName.split('.');
            shortName = parts[parts.length - 1]; 
        }
        if (shortName.includes(':')) {
            shortName = shortName.split(':')[0];
        }
        // General fallback if names are still excessively long
        if (shortName.length > 25) {
            shortName = shortName.substring(0, 25) + '...';
        }
        
        return {
            ...item,
            formattedName: shortName
        };
    });

    return (
        <Card className="bg-[#09090b] border-[#27272a] h-full flex flex-col">
            {title && <Title className="text-foreground">{title}</Title>}
            {subtitle && <Subtitle className="text-muted-foreground">{subtitle}</Subtitle>}
            <div className="flex-grow flex flex-col justify-center">
                <DonutChart
                    className="mt-6 h-48"
                    data={formattedData}
                    category="value"
                    index="formattedName"
                    colors={["blue", "emerald", "amber", "rose", "cyan"]}
                    valueFormatter={(number: number) => number.toLocaleString()}
                />
                <div className="mt-6">
                    <Legend
                        categories={formattedData.map(d => d.formattedName)}
                        colors={["blue", "emerald", "amber", "rose", "cyan"]}
                        className="flex flex-wrap gap-2 justify-center"
                    />
                </div>
            </div>
        </Card>
    );
};
