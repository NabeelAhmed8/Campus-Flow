"use client";

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

export function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdown must be used within a CustomDropdown");
  }
  return context;
}

export interface CustomDropdownProps {
  children: React.ReactNode;
  className?: string;
}

export function CustomDropdown({ children, className }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, close: () => setIsOpen(false) }}>
      <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({
  children,
  className,
  asChild,
}: {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { isOpen, setIsOpen } = useDropdown();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children.props as any).onClick?.(e);
        setIsOpen((prev) => !prev);
      },
      "aria-haspopup": "menu",
      "aria-expanded": isOpen,
    });
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen((prev) => !prev)}
      className={cn("outline-none transition-colors", className)}
      aria-haspopup="menu"
      aria-expanded={isOpen}
    >
      {children}
    </button>
  );
}

export function DropdownContent({
  children,
  className,
  align = "right",
  minWidth = "min-w-[200px]",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
  minWidth?: string;
}) {
  const { isOpen } = useDropdown();

  if (!isOpen) return null;

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 mt-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-1.5",
        "animate-in fade-in-50 zoom-in-95 duration-100 backdrop-blur-sm max-w-[calc(100vw-1.5rem)]",
        minWidth,
        align === "right" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  className,
  destructive = false,
  disabled = false,
  active = false,
  icon: Icon,
  iconClassName,
  description,
  badge,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
  disabled?: boolean;
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  const { close } = useDropdown();

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onClick?.();
          close();
        }
      }}
      className={cn(
        "w-full flex gap-2.5 px-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer",
        description ? "items-start py-2 sm:py-2.5" : "items-center py-1.5 sm:py-2",
        destructive
          ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
          : active
          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "shrink-0",
            description ? "mt-0.5 p-1 rounded-md bg-muted/60 text-muted-foreground" : "",
            active && description ? "bg-primary/15 text-primary" : "",
            iconClassName
          )}
        >
          <Icon className="h-3.5 w-3.5 opacity-90" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate">{children}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {description && (
          <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5 leading-tight">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

export function DropdownLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-border/60", className)} />;
}
