import { DisputeRecord } from "@/src/services/disputes-api"
import { DisputeCard } from "./DisputeCard"
import { useI18n } from "@/lib/i18n/context"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"

interface DisputesListProps {
  disputes: DisputeRecord[]
  loading: boolean
}

export function DisputesList({ disputes, loading }: DisputesListProps) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{t.noDisputesFound}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t.tryAdjustingSearch}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <DisputeCard key={dispute.id} dispute={dispute} />
      ))}
    </div>
  )
}

