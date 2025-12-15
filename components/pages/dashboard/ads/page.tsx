"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdsHeader } from "./components/AdsHeader"
import { StatusFilter } from "./components/StatusFilter"
import { AdsList } from "./components/AdsList"
import type { Ad } from "./components/types"
import { useI18n } from "@/lib/i18n/context"
import { useApiWithFallback } from "@/hooks/useApiWithFallback"
import { adsApi, type AdRecord } from "@/src/services/ads-api"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function AdsPage() {
  // Removed mock data usage; rely on real API only
  const [statusFilter, setStatusFilter] = useState("all")
  const { t, isArabic } = useI18n()
  const router = useRouter()

  const mapApiToUiAd = useCallback((r: AdRecord): Ad => {
    const statusMap: Record<string, Ad["status"]> = {
      active: "active",
      paused: "paused",
      completed: "completed",
      pending: "active",
      in_active: "paused",
      finished: "completed",
    }
    const budget = Number(r.budget_amount || 0)
    const spent = Number(r.spent_amount || 0)
    return {
      id: String(r.id),
      title: r.title,
      productId: String(r.target_id ?? ""),
      productName: r.target_type === "products" ? `#${r.target_id}` : "",
      type: r.target_type === "products" ? "product" : "banner",
      status: statusMap[r.status] ?? "active",
      budget,
      spent,
      impressions: Number(r.impressions_count ?? 0),
      clicks: Number(r.clicks_count ?? 0),
      conversions: 0,
      ctr: Number(r.ctr ?? 0),
      cpc: budget > 0 && Number(r.clicks_count ?? 0) > 0 ? spent / Number(r.clicks_count) : 0,
      startDate: r.starts_at,
      endDate: r.ends_at,
      targetCountries: [],
      targetKeywords: r.target_keywords || [],
    }
  }, [])

  // Memoize fetcher and fallback to prevent effect loop
  const fetchAds = useCallback(async (): Promise<Ad[]> => {
    const res = await adsApi.list({ per_page: 50 })
    const rows = Array.isArray((res as any)?.data) ? (res as any).data : (res as any) || []
    return (rows as AdRecord[]).map(mapApiToUiAd)
  }, [mapApiToUiAd])

  // Do not use mock fallback; if API fails or returns empty, show empty state
  const emptyFallback = useCallback(async (): Promise<Ad[]> => {
    return []
  }, [])

  const { data, loading } = useApiWithFallback<Ad[]>({
    fetcher: fetchAds,
    fallback: emptyFallback,
    // No deps needed; we filter client-side by status
    deps: [],
  })

  const ads = useMemo(() => {
    const src = (data || []) as Ad[]
    return statusFilter === "all" ? src : src.filter((ad) => ad.status === statusFilter)
  }, [data, statusFilter])

  const goToCreate = () => router.push("/dashboard/ads/new")

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <AdsHeader onExportComplete={async () => { /* no-op */ }} />
        <Link href="/dashboard/ads/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.createAd}
          </Button>
        </Link>
      </div>

      <StatusFilter value={statusFilter} onChange={setStatusFilter} />

      <AdsList ads={ads} loading={loading} isArabic={isArabic} onCreateClick={goToCreate} />
    </div>
  )
}
 
