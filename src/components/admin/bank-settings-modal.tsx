"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Trash2, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SchoolBankAccount } from "@/components/parent/types";

interface BankSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function BankSettingsModal({ open, onClose }: BankSettingsModalProps) {
  const [accounts, setAccounts] = useState<SchoolBankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    bankName: "",
    badge: "Bank Transfer",
    accountTitle: "",
    accountNo: "",
    iban: "",
    branch: "",
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/school/bank-accounts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.bankAccounts)) {
          setAccounts(d.bankAccounts);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.bankName.trim() || !draft.accountTitle.trim() || !draft.accountNo.trim()) {
      toast.error("Bank name, Account Title, and Account Number are required.");
      return;
    }
    setAccounts((prev) => [
      ...prev,
      {
        id: `bank-${Date.now()}`,
        bankName: draft.bankName.trim(),
        badge: draft.badge.trim() || "Bank Transfer",
        accountTitle: draft.accountTitle.trim(),
        accountNo: draft.accountNo.trim(),
        iban: draft.iban.trim(),
        branch: draft.branch.trim(),
      },
    ]);
    setDraft({
      bankName: "",
      badge: "Bank Transfer",
      accountTitle: "",
      accountNo: "",
      iban: "",
      branch: "",
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/school/bank-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankAccounts: accounts }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Official school bank accounts saved & synced to Parent Portal!");
        onClose();
      } else {
        toast.error(data.error || "Failed to save bank accounts.");
      }
    } catch {
      toast.error("Network error while saving bank accounts.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card border shadow-xl p-6 relative max-h-[90vh] overflow-y-auto space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-3 border-b">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">School Official Bank Accounts &amp; Wallets</h2>
            <p className="text-xs text-muted-foreground">
              Add your real school bank account, IBAN, Raast, or JazzCash/EasyPaisa details shown to Parents for tuition fee transfers.
            </p>
          </div>
        </div>

        {/* Existing Saved Accounts */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Configured Accounts ({accounts.length})
          </h3>
          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
              Loading...
            </div>
          ) : accounts.length > 0 ? (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-foreground">
                      {acc.bankName}{" "}
                      <span className="text-[10px] font-medium text-primary">({acc.badge})</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Title: {acc.accountTitle} • A/C: <code className="font-mono">{acc.accountNo}</code>
                      {acc.iban ? ` • IBAN: ${acc.iban}` : ""}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setAccounts((prev) => prev.filter((a) => a.id !== acc.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-2">
              No bank accounts added yet. Add your first official school account below.
            </p>
          )}
        </div>

        {/* Add New Bank Form */}
        <form onSubmit={handleAdd} className="rounded-xl border bg-muted/15 p-4 space-y-3 text-xs">
          <div className="font-semibold text-foreground">Add Bank Account / Mobile Wallet</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Bank / Wallet Name * (e.g. Meezan Bank Ltd)"
              value={draft.bankName}
              onChange={(e) => setDraft({ ...draft, bankName: e.target.value })}
              className="h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Type Badge (e.g. Islamic Bank, Raast, Wallet)"
              value={draft.badge}
              onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
              className="h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Account Title * (e.g. Al-Noor Academy)"
              value={draft.accountTitle}
              onChange={(e) => setDraft({ ...draft, accountTitle: e.target.value })}
              className="h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Account / Till Number *"
              value={draft.accountNo}
              onChange={(e) => setDraft({ ...draft, accountNo: e.target.value })}
              className="h-8.5 rounded-lg border bg-background px-3 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="IBAN / Raast Alias (Optional)"
              value={draft.iban}
              onChange={(e) => setDraft({ ...draft, iban: e.target.value })}
              className="h-8.5 rounded-lg border bg-background px-3 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Branch Name (Optional)"
              value={draft.branch}
              onChange={(e) => setDraft({ ...draft, branch: e.target.value })}
              className="h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit" variant="outline" size="xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add to List
          </Button>
        </form>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Bank Accounts
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
