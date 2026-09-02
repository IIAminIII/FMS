import { Badge } from "@/components/ui/badge";
import type { MatchStatus, PaymentStatus } from "@/lib/types";

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const variant = status === "Paid" ? "success" : status === "Due" ? "danger" : status === "Partial" ? "warning" : "info";
  return <Badge variant={variant}><span className="size-1.5 rounded-full bg-current opacity-70" />{status}</Badge>;
}

export function MatchBadge({ status }: { status: MatchStatus }) {
  const variant = status === "Completed" ? "success" : status === "Cancelled" ? "danger" : status === "Booked" ? "info" : "warning";
  return <Badge variant={variant}>{status}</Badge>;
}
