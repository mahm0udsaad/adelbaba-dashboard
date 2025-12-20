import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { DisputeStatus } from "@/src/services/disputes-api"

interface DisputeStatusBadgeProps {
  status: DisputeStatus
}

export function DisputeStatusBadge({ status }: DisputeStatusBadgeProps) {
  const { t } = useI18n()

  const variants: Record<DisputeStatus, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
    under_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
    resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    closed: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200",
    withdrawn: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200",
  }

  const labels: Record<DisputeStatus, string> = {
    open: t.open,
    under_review: t.underReview,
    resolved: t.resolved,
    closed: t.closed || "Closed",
    withdrawn: t.withdrawn,
  }

  return (
    <Badge variant="outline" className={variants[status] || ""}>
      {labels[status] || status}
    </Badge>
  )
}

