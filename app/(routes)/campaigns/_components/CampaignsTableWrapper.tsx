"use client";

import React from "react";
import { ProjectsDataTable } from "../../projects/table-components/data-table";
import { columns } from "../../projects/table-components/columns";

interface CampaignsTableWrapperProps {
    data: any[];
    stats: {
        activeTasks: number;
        documents: number;
    };
}

const CampaignsTableWrapper: React.FC<CampaignsTableWrapperProps> = ({ data, stats }) => {
    return (
        <ProjectsDataTable
            columns={columns}
            data={data}
            stats={stats}
            entityName="Campaigns"
            statsLinks={{
                total: "/campaigns",
                tasks: "/projects/tasks", // Keeping this for now, or change if there's a specific campaign tasks route
                documents: "/documents"
            }}
        />
    );
};

export default CampaignsTableWrapper;
