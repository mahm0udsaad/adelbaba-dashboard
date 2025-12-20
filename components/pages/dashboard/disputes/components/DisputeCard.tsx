import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { DisputeRecord } from "@/src/services/disputes-api"
import { DisputeStatusBadge } from "./DisputeStatusBadge"
import { format } from "date-fns"
import { Calendar, Package, MessageSquare } from "lucide-react"
import Link from "next/link"

interface DisputeCardProps {
  dispute: DisputeRecord
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  const { t, isArabic } = useI18n()

  return (
    <Link href={`/dashboard/disputes/${dispute.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">#{dispute.id}</span>
                  <DisputeStatusBadge status={dispute.status} />
                </div>
                <p className="font-medium text-foreground line-clamp-1">{dispute.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(dispute.created_at), "MMM dd, yyyy")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{t.orders}: </span>
                <span className="text-foreground font-medium">{dispute.order.order_number}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{t.customer}: </span>
                <span className="text-foreground font-medium">{dispute.user.name}</span>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">{t.requestedAction}</p>
              <p className="text-sm font-medium">{dispute.requested_action}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

