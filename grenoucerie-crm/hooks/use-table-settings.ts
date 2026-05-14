"use client";

import * as React from "react";
import { VisibilityState, SortingState } from "@tanstack/react-table";

interface TableSettings {
    columnVisibility?: VisibilityState;
    sorting?: SortingState;
    columnSizing?: Record<string, number>;
    viewMode?: string;
    pageSize?: number;
}

export function useTableSettings(storageKey: string, isMobile: boolean = false) {
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>({});
    const [viewMode, setViewMode] = React.useState<string>("card");
    const [pageSize, setPageSize] = React.useState<number>(10);
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Load settings from localStorage on mount
    React.useEffect(() => {
        const savedSettings = localStorage.getItem(storageKey);
        if (savedSettings) {
            try {
                const settings: TableSettings = JSON.parse(savedSettings);
                if (settings.columnVisibility) setColumnVisibility(settings.columnVisibility);
                if (settings.sorting) setSorting(settings.sorting);
                if (settings.columnSizing) setColumnSizing(settings.columnSizing);
                if (settings.viewMode && !isMobile) setViewMode(settings.viewMode);
                if (settings.pageSize) setPageSize(settings.pageSize);
            } catch (e) {
                console.error(`Failed to load table settings for ${storageKey}`, e);
            }
        }
        setIsLoaded(true);
    }, [storageKey, isMobile]);

    // Save settings to localStorage whenever they change
    React.useEffect(() => {
        if (!isLoaded) return;

        const settings: TableSettings = {
            columnVisibility,
            sorting,
            columnSizing,
            viewMode: isMobile ? "card" : viewMode,
            pageSize,
        };
        localStorage.setItem(storageKey, JSON.stringify(settings));
    }, [columnVisibility, sorting, columnSizing, viewMode, pageSize, isLoaded, isMobile, storageKey]);

    return {
        columnVisibility,
        setColumnVisibility,
        sorting,
        setSorting,
        columnSizing,
        setColumnSizing,
        viewMode,
        setViewMode,
        pageSize,
        setPageSize,
        isLoaded,
    };
}
