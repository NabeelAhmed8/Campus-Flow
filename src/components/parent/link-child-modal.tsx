"use client";

import { Hash, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkChildModalProps {
  open: boolean;
  institutionName: string;
  childRollInput: string;
  linking: boolean;
  onRollChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function LinkChildModal({
  open,
  institutionName,
  childRollInput,
  linking,
  onRollChange,
  onSubmit,
  onClose,
}: LinkChildModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close link child modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <UserPlus className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Link Another Child</h2>
            <p className="text-xs text-muted-foreground">
              Add another enrolled child from {institutionName} to this same guardian account.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="parent-link-child-roll"
              className="block font-semibold mb-1.5 text-foreground"
            >
              Child&apos;s Enrolled Student Roll Number *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="parent-link-child-roll"
                name="childRollNumber"
                type="text"
                autoComplete="off"
                required
                value={childRollInput}
                onChange={(e) => onRollChange(e.target.value.toUpperCase())}
                placeholder="e.g. CF-102-B8C1"
                className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-3 text-xs font-mono uppercase tracking-wider outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Once linked, you can seamlessly switch between all your children using the Child Selector bar above.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={linking}>
              {linking ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Link Child to Portal
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
