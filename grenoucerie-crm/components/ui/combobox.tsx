"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { label: string; value: string }[]
    value?: string | null
    onChange: (value: string) => void
    onSearch?: (query: string) => void
    isLoading?: boolean
    placeholder?: string
    emptyMessage?: string
    className?: string;
    disabled?: boolean;
    variant?: "outline" | "ghost" | "default" | "secondary" | "link" | "destructive";
}

export function Combobox({
    options,
    value,
    onChange,
    onSearch,
    isLoading,
    placeholder = "Select option...",
    emptyMessage = "No option found.",
    className,
    disabled,
    variant = "outline",
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={variant}
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {isLoading && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                        <span className="truncate">
                            {value
                                ? options.find((option) => option.value === value)?.label || "Selected"
                                : placeholder}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 glass border-white/20 shadow-2xl rounded-xl overflow-hidden mt-1" align="start">
                <Command className="bg-transparent" shouldFilter={!onSearch}>
                    <CommandInput
                        placeholder={placeholder}
                        onValueChange={onSearch}
                    />
                    <CommandList className="max-h-[400px]">
                        {isLoading ? (
                            <div className="p-4 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        ) : (
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                        )}
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => {
                                        onChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-primary",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
