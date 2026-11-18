"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  dropdownClassName?: string;
  size?: "sm" | "default";
  align?: "left" | "right";
  id?: string;
  name?: string;
  required?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  searchable,
  className,
  dropdownClassName,
  size = "default",
  align = "left",
  id,
  name,
  required,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Auto-enable search if there are more than 6 options unless explicitly set to false
  const isSearchable = searchable ?? options.length > 6;

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && isSearchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen, isSearchable]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Filter options by search query
  const filteredOptions = searchQuery.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.sublabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const SelectedIcon = selectedOption?.icon;

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {/* Hidden native input for form compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "w-full rounded-lg border border-border bg-background text-foreground transition-all duration-150",
          "flex items-center justify-between gap-2 px-3 text-left font-medium shadow-2xs",
          "hover:border-primary/50 hover:bg-muted/30",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-background",
          size === "sm" ? "h-8.5 text-xs py-1.5" : "h-9 text-xs py-2",
          isOpen && "ring-2 ring-primary/20 border-primary shadow-xs",
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {SelectedIcon && <SelectedIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {selectedOption ? (
            <span className="truncate text-foreground font-medium">
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-[10px] text-muted-foreground ml-1.5 opacity-80 font-normal">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground font-normal truncate">{placeholder}</span>
          )}
        </span>

        <span className="flex items-center gap-1.5 shrink-0 ml-1">
          {selectedOption?.badge && (
            <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-foreground"
            )}
          />
        </span>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 w-full min-w-[200px] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-1.5",
            "animate-in fade-in-50 zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            dropdownClassName
          )}
        >
          {/* Search Bar for Quick Filtering */}
          {isSearchable && (
            <div className="relative mb-1 px-1 pt-1 pb-1.5 border-b border-border/60">
              <Search className="absolute left-2.5 top-3 h-3 w-3 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                name="selectSearchQuery"
                autoComplete="off"
                aria-label="Filter dropdown options"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-7 rounded-md border border-border/80 bg-background pl-7 pr-6 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-muted-foreground">
                No matching options found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground font-normal"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {Icon && (
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isSelected ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        />
                      )}
                      <div className="truncate">
                        <span className="truncate leading-tight block">{opt.label}</span>
                        {opt.sublabel && (
                          <span
                            className={cn(
                              "text-[10px] block leading-tight truncate",
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}
                          >
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span
                          className={cn(
                            "text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
