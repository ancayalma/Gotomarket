"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
                    {value
                        ? options.find((option) => option.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 glass border-white/20 shadow-2xl rounded-xl overflow-hidden mt-1" align="start">
                <Command className="bg-transparent">
                    <CommandInput placeholder={placeholder} />
                    <CommandList className="max-h-[400px]">
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        {options.length > 5 ? (
                            <>
                                <CommandGroup heading="Recent Campaigns">
                                    {options.slice(0, 5).map((option) => (
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
                                <CommandSeparator className="opacity-50" />
                                <CommandGroup heading="All Campaigns">
                                    {options.slice(5).map((option) => (
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
                            </>
                        ) : (
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
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
