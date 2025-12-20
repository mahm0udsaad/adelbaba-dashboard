"use client"

import { useState, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useApiWithFallback } from "@/hooks/useApiWithFallback"
import { disputesApi, DisputeRecord, DisputeStatus } from "@/src/services/disputes-api"
import { DisputesList } from "./components/DisputesList"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function DisputesPage() {
  const { t } = useI18n()
  const [status, setStatus] = useState<DisputeStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetcher = useCallback(async () => {
    try {
      const res = await disputesApi.list({ status })
      // Handle various response shapes
      if (res && Array.isArray((res as any).data)) {
        return (res as any).data
      }
      if (Array.isArray(res)) {
        return res
      }
      return []
    } catch (err) {
      console.error("Failed to fetch disputes:", err)
      throw err
    }
  }, [status])

  const fallback = useCallback(async () => [], [])

  const { data: disputes, loading, error } = useApiWithFallback<DisputeRecord[]>({
    fetcher,
    fallback,
    deps: [status],
  })

  if (error && !loading && (!disputes || disputes.length === 0)) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{t.disputes}</h1>
          <p className="text-muted-foreground">{t.disputesSubtitle}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center bg-destructive/10 rounded-xl border border-destructive/20">
          <p className="text-destructive font-medium">{t.error}</p>
          <p className="text-sm text-muted-foreground mt-1">Failed to load disputes. Please try again later.</p>
        </div>
      </div>
    )
  }

  const filteredDisputes = (disputes || []).filter((d) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      d.id.toString().includes(searchLower) ||
      d.reason.toLowerCase().includes(searchLower) ||
      d.order.order_number.toLowerCase().includes(searchLower) ||
      d.user.name.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t.disputes}</h1>
        <p className="text-muted-foreground">{t.disputesSubtitle}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={status} onValueChange={(v) => setStatus(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">{t.allStatus}</TabsTrigger>
            <TabsTrigger value="open">{t.open}</TabsTrigger>
            <TabsTrigger value="under_review">{t.underReview}</TabsTrigger>
            <TabsTrigger value="resolved">{t.resolved}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.search}
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <DisputesList disputes={filteredDisputes} loading={loading} />
    </div>
  )
}

