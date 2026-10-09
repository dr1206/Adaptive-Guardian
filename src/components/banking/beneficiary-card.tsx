import { Link } from "@tanstack/react-router";
import { Star, Send, Trash2, CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { Beneficiary } from "@/services/banking/banking.contract";
import { fmt } from "@/lib/format";
import { useDeleteBeneficiary, useVerifyBeneficiary } from "@/services/hooks";
import { toast } from "sonner";
import { useState } from "react";

export function BeneficiaryCard({ b }: { b: Beneficiary }) {
  const deleteMutation = useDeleteBeneficiary();
  const verifyMutation = useVerifyBeneficiary();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate(b.id, {
      onSuccess: () => {
        toast.success(`Beneficiary ${b.name} removed`);
        setConfirmDelete(false);
      },
      onError: (err) => toast.error(err.message || "Failed to remove beneficiary"),
    });
  };

  const handleVerify = () => {
    verifyMutation.mutate(b.id, {
      onSuccess: () => toast.success(`${b.name} verified successfully`),
      onError: (err) => toast.error(err.message || "Failed to verify beneficiary"),
    });
  };

  return (
    <article className="group relative rounded-[20px] border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-[13px] font-semibold bg-primary/10 text-primary border border-primary/20"
        >
          {b.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[14px] font-semibold text-foreground">
              {b.name}
            </h3>
            {b.favorite && <Star className="h-3 w-3 fill-warning text-warning" />}
            {b.isVerified ? (
              <span title="Bank Verified" className="inline-flex shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </span>
            ) : (
              <span
                onClick={handleVerify}
                className="cursor-pointer inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                title="Click to Verify"
              >
                Verify
              </span>
            )}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {b.bank} · ••{b.last4}
          </div>
        </div>
      </div>

      {b.coolingUntil && new Date(b.coolingUntil) > new Date() && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1 text-[10.5px] font-medium text-warning">
          <Clock className="h-3 w-3 shrink-0" />
          <span>₹50,000 Cooling Cap active</span>
        </div>
      )}

      <div className="mt-3 text-[11px] text-muted-foreground">
        {b.lastSent ? (
          <>
            Last sent <span className="font-numeric text-foreground">{fmt(b.lastSent.amount, "₹", 0)}</span>{" "}
            · {b.lastSent.date}
          </>
        ) : (
          <span className="italic opacity-70">No transfers yet</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Link
          to="/app/transfer"
          search={{ to: b.id }}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Send className="h-3 w-3" /> Transfer
        </Link>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
              className="inline-flex h-7 items-center justify-center rounded-lg bg-destructive px-2 text-[10px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="inline-flex h-7 items-center justify-center rounded-lg border border-border px-1.5 text-[10px] text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete Beneficiary"
            className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </article>
  );
}
