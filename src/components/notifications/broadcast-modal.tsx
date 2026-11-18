"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  ShieldCheck,
  AlertTriangle,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  ALL_CLASSES_GRADE_OPTIONS,
  BROADCAST_AUDIENCE_OPTIONS,
  BROADCAST_CATEGORY_OPTIONS,
} from "@/lib/constants";

interface BroadcastNotificationModalProps {
  open: boolean;
  userRole: string | null;
  onClose: () => void;
  onSent: () => void;
}

export function BroadcastNotificationModal({
  open,
  userRole,
  onClose,
  onSent,
}: BroadcastNotificationModalProps) {
  const [audience, setAudience] = useState("parents_students");
  const [category, setCategory] = useState("announcement");
  const [grade, setGrade] = useState("All Classes");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please enter both a headline and message.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audience,
          category,
          grade,
          priority: category === "urgent" ? "urgent" : priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send notification.");
        return;
      }

      toast.success(data.message || "Notification sent successfully.");
      setTitle("");
      setMessage("");
      setPriority("normal");
      onClose();
      onSent();
    } catch {
      toast.error("Network error while sending notification.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Send Campus Notification"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Send Campus Notification
              </h2>
              <p className="text-xs text-muted-foreground">
                Deliver instant portal alerts to Parents, Students, or Faculty.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {userRole === "coordinator" && (
          <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-[11px] text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Admin Oversight Active:</strong>{" "}
              Every notification sent from the Coordinator Desk is also automatically delivered to the School Admin.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label
              htmlFor="bc-audience"
              className="block text-[11px] font-semibold mb-1"
            >
              Target Audience
            </label>
            <CustomSelect
              id="bc-audience"
              value={audience}
              onChange={setAudience}
              options={BROADCAST_AUDIENCE_OPTIONS}
              size="sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="bc-category"
                className="block text-[11px] font-semibold mb-1"
              >
                Category
              </label>
              <CustomSelect
                id="bc-category"
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  if (val === "urgent") setPriority("urgent");
                }}
                options={BROADCAST_CATEGORY_OPTIONS}
                size="sm"
              />
            </div>

            <div>
              <label
                htmlFor="bc-grade"
                className="block text-[11px] font-semibold mb-1"
              >
                Applicable Class
              </label>
              <CustomSelect
                id="bc-grade"
                value={grade}
                onChange={setGrade}
                options={ALL_CLASSES_GRADE_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold mb-1">
              Priority Level
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriority("normal")}
                className={`h-8.5 rounded-lg border text-xs font-semibold transition-all ${
                  priority === "normal"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Normal Notice
              </button>
              <button
                type="button"
                onClick={() => setPriority("urgent")}
                className={`h-8.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  priority === "urgent"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Urgent Alert
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="bc-title"
              className="block text-[11px] font-semibold mb-1"
            >
              Notification Headline
            </label>
            <input
              id="bc-title"
              name="broadcastTitle"
              type="text"
              autoComplete="off"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tomorrow Holiday Notice / PTM Reminder / Fee Due Date"
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="bc-message"
              className="block text-[11px] font-semibold mb-1"
            >
              Message Details
            </label>
            <textarea
              id="bc-message"
              name="broadcastMessage"
              rows={4}
              required
              maxLength={600}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the complete notification message for parents, students, or teachers..."
              className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right mt-0.5">
              {message.length}/600
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending}
              className="h-9 text-xs px-4"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isSending ? "Sending..." : "Send Notification Now"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
