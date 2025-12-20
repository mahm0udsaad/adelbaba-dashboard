"use client"

import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { useApiWithFallback } from "@/hooks/useApiWithFallback"
import { disputesApi, DisputeRecord } from "@/src/services/disputes-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, User, Clock, AlertTriangle } from "lucide-react"
import { DisputeStatusBadge } from "../components/DisputeStatusBadge"
import { EvidenceList } from "./components/EvidenceList"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function DisputeDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useI18n()

  const fetcher = useCallback(async () => {
    try {
      const res = await disputesApi.show(id as string)
      // Handle nested data or direct response
      if (res && (res as any).data) {
        return (res as any).data
      }
      return res as DisputeRecord
    } catch (err) {
      console.error("Failed to fetch dispute details:", err)
      throw err
    }
  }, [id])

  const fallback = useCallback(async () => null, [])

  const { data: dispute, loading } = useApiWithFallback<DisputeRecord | null>({
    fetcher,
    fallback,
    deps: [id],
  })

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <p>{t.error}</p>
        <Button variant="link" onClick={() => router.push("/dashboard/disputes")}>
          {t.back}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/disputes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t.disputeDetails}</h1>
            <span className="text-muted-foreground font-normal">#{dispute.id}</span>
          </div>
          <p className="text-sm text-muted-foreground">{dispute.reason}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Dispute Information
              </CardTitle>
              <DisputeStatusBadge status={dispute.status} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t.description}</h3>
                <div className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap border italic">
                  "{dispute.description}"
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t.requestedAction}</h3>
                  <p className="font-medium text-lg text-primary">{dispute.requested_action}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">{t.platformDecision}</h3>
                  <p className="font-medium">{dispute.platform_decision || "Pending Decision"}</p>
                </div>
              </div>

              <Separator />

              <EvidenceList evidence={dispute.evidence || []} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Linked Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-medium">{dispute.order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary">${dispute.order.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span>{format(new Date(dispute.order.created_at), "PPP")}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/dashboard/orders/${dispute.order.id}`)}>
                {t.viewDetails}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                  {dispute.user.picture && (
                    <img src={dispute.user.picture} alt={dispute.user.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{dispute.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{dispute.user.email}</p>
                </div>
              </div>
              <div className="pt-2">
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={() => router.push(`/dashboard/inbox?id=${dispute.chat_inbox_id}`)}
                >
                  Contact Customer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Opened: {format(new Date(dispute.created_at), "PPP p")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last Updated: {format(new Date(dispute.updated_at), "PPP p")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

