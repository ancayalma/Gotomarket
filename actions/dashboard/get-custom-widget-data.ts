"use server";

import { dbAdapter } from "@/lib/database/db-adapter";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { ObjectId } from "mongodb";

const MODEL_MAP: Record<string, string> = {
    "Accounts": "crm_Accounts",
    "Contacts": "crm_Contacts",
    "Leads": "crm_Leads",
    "Opportunities": "crm_Opportunities",
    "Invoices": "Invoices",
    "Tasks": "Tasks",
    "Tickets": "crm_Cases",
};

export async function getCustomWidgetData(widgetId: string) {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return null;

        const collection = await dbAdapter.getNativeCollection("crm_CustomWidget");
        const widget = await collection.findOne({ _id: new ObjectId(widgetId) as any });

        if (!widget) return null;

        const targetModel = MODEL_MAP[widget.dataSource] || widget.dataSource;
        const targetCollection = await dbAdapter.getNativeCollection(targetModel);

        // Build the query
        const query: any = {
            team_id: teamInfo.teamId
        };

        // Apply custom filters
        if (widget.filters && Array.isArray(widget.filters)) {
            widget.filters.forEach((f: any) => {
                const { field, operator, value } = f;
                if (!field || !operator) return;

                const dateNow = new Date();
                switch (operator) {
                    case "equals":
                        query[field] = value;
                        break;
                    case "gt":
                        query[field] = { $gt: parseFloat(value) || value };
                        break;
                    case "lt":
                        query[field] = { $lt: parseFloat(value) || value };
                        break;
                    case "contains":
                        query[field] = { $regex: value, $options: "i" };
                        break;
                    case "last_7_days":
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        query[field] = { $gte: sevenDaysAgo };
                        break;
                    case "this_month":
                        const beginningOfMonth = new Date(dateNow.getFullYear(), dateNow.getMonth(), 1);
                        query[field] = { $gte: beginningOfMonth };
                        break;
                    case "overdue":
                        query[field] = { $lt: dateNow };
                        break;
                }
            });
        }

        // Perform Aggregation
        let value = 0;
        if (widget.aggregation === "COUNT") {
            value = await targetCollection.countDocuments(query);
        } else if (widget.aggregation === "SUM" || widget.aggregation === "AVG") {
            const pipeline = [
                { $match: query },
                {
                    $group: {
                        _id: null,
                        result: widget.aggregation === "SUM"
                            ? { $sum: `$${widget.targetField || "amount"}` }
                            : { $avg: `$${widget.targetField || "amount"}` }
                    }
                }
            ];
            const results = await targetCollection.aggregate(pipeline).toArray();
            value = results.length > 0 ? results[0].result : 0;
        }

        return {
            id: widgetId,
            name: widget.name,
            icon: widget.icon,
            color: widget.color,
            chartType: widget.chartType,
            targetValue: widget.targetValue,
            value: typeof value === 'number' ? Math.round(value * 100) / 100 : value,
            dataSource: widget.dataSource
        };
    } catch (error) {
        console.error("Intelligence Engine failure for widget:", widgetId, error);
        return null;
    }
}
