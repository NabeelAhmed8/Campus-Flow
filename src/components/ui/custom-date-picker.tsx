"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
  align?: "left" | "right";
  id?: string;
  name?: string;
  required?: boolean;
  clearable?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { year: y, month: m - 1, day: d };
}

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatReadableDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return "";
  return `${String(parsed.day).padStart(2, "0")} ${SHORT_MONTHS[parsed.month]} ${parsed.year}`;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  disabled = false,
  className,
  size = "default",
  align = "left",
  id,
  name,
  required,
  clearable = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [todayIso, setTodayIso] = useState("");
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const pickerId = id || generatedId;

  // Resolve client today safely inside useEffect (Next.js 16 cacheComponents safe)
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    setTodayIso(toIsoDate(y, m, d));

    const parsed = parseIsoDate(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    } else {
      setViewYear(y);
      setViewMonth(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep calendar month synced when value changes externally
  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  // Close popover on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  // Close popover on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      const parsed = parseIsoDate(value) || parseIsoDate(todayIso);
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
      }
    }
    setIsOpen((prev) => !prev);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const iso = toIsoDate(viewYear, viewMonth, day);
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    if (!todayIso) return;
    const parsed = parseIsoDate(todayIso);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
    onChange(todayIso);
    setIsOpen(false);
  };

  // Build calendar cells for viewYear / viewMonth
  const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const displayLabel = formatReadableDate(value);

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={pickerId}
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "w-full rounded-lg border border-border bg-background text-foreground transition-all duration-150",
          "flex items-center justify-between gap-2 px-3 text-left font-medium shadow-2xs",
          "hover:border-primary/50 hover:bg-muted/30",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          size === "sm" ? "h-8.5 text-xs py-1.5" : "h-9 text-xs py-2",
          isOpen && "ring-2 ring-primary/20 border-primary shadow-xs",
          className
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarDays
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-colors",
              isOpen ? "text-primary" : "text-muted-foreground"
            )}
          />
          {displayLabel ? (
            <span className="truncate text-foreground font-medium">
              {displayLabel}
            </span>
          ) : (
            <span className="truncate text-muted-foreground font-normal">
              {placeholder}
            </span>
          )}
        </span>

        {clearable && value ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
            title="Clear date"
          >
            <X className="h-3 w-3" />
          </span>
        ) : null}
      </button>

      {/* Themed Calendar Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose date"
          className={cn(
            "absolute z-50 mt-1.5 w-[272px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-3",
            "animate-in fade-in-50 zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {/* Month / Year Header */}
          <div className="flex items-center justify-between gap-1 mb-2.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg border border-transparent hover:border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-xs font-bold text-foreground tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg border border-transparent hover:border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((dayLabel) => (
              <div
                key={dayLabel}
                className="h-6 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {dayLabel}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const cellIso = toIsoDate(viewYear, viewMonth, day);
              const isSelected = cellIso === value;
              const isToday = cellIso === todayIso;

              return (
                <button
                  key={cellIso}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : isToday
                      ? "border border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/20"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-border/70">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-semibold text-primary hover:underline px-1.5 py-0.5 rounded"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
