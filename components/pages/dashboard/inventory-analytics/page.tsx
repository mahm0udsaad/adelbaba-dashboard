"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { format, subMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"

type InventorySummary = {
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

type GQLOutput = {
  data?: { inventorySummary?: InventorySummary }
  errors?: Array<{ message: string }>
}

const INVENTORY_QUERY = `
  query InventorySummary {
    inventorySummary {
      inStock
      lowStock
      outOfStock
      totalValue
    }
  }
`

function getRange(period: string) {
  const end = new Date()
  let start: Date
  switch (period) {
    case "1month":
      start = subMonths(end, 1)
      break
    case "3months":
      start = subMonths(end, 3)
      break
    case "6months":
      start = subMonths(end, 6)
      break
    case "1year":
    default:
      start = subMonths(end, 12)
      break
  }
  return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") }
}

export default function InventoryAnalyticsPage() {
  const { t } = useI18n()
  const [period, setPeriod] = useState("6months")
  const _range = useMemo(() => getRange(period), [period])
  const [data, setData] = useState<InventorySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(undefined)
        const res = await axios.post<GQLOutput>(
          "/api/analytics",
          { query: INVENTORY_QUERY, variables: {} },
          { headers: { "Content-Type": "application/json" } },
        )
        if (!mounted) return
        if (res.data?.errors?.length) {
          throw new Error(res.data.errors.map((e) => e.message).join("; "))
        }
        setData(res.data?.data?.inventorySummary || null)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || "Failed to load inventory summary")
        setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [_range])

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.inventory || "Inventory"}</h1>
          <p className="text-muted-foreground">{t.trackPerformance}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">{t.month1}</SelectItem>
            <SelectItem value="3months">{t.months3}</SelectItem>
            <SelectItem value="6months">{t.months6}</SelectItem>
            <SelectItem value="1year">{t.year1}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-blue-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">{"In Stock"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{(data?.inStock || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">{"Low Stock"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{(data?.lowStock || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">{"Out of Stock"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{(data?.outOfStock || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">{t.totalValue}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${(data?.totalValue || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {error ? <div className="text-sm text-red-500">{error}</div> : null}
    </div>
  )
}


