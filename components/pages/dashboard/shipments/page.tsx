"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { format, subMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"
import { BarChart3 as BarIcon, Download } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts"
import { toEnglishLocaleString } from "@/lib/utils"

type ShipmentSummary = {
  delivered: number
  pending: number
  returned: number
  shipped?: number
}

type GQLOutput = {
  data?: { shipmentAnalyticsSummary?: ShipmentSummary }
  errors?: Array<{ message: string }>
}

const SHIPMENTS_QUERY = `
  query Shipments($startDate: String!, $endDate: String!) {
    shipmentAnalyticsSummary(startDate: $startDate, endDate: $endDate) {
      delivered
      pending
      returned
      shipped
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

export default function ShipmentsPage() {
  const { t } = useI18n()
  const [period, setPeriod] = useState("6months")
  const { startDate, endDate } = useMemo(() => getRange(period), [period])
  const [data, setData] = useState<ShipmentSummary | null>(null)
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
          { query: SHIPMENTS_QUERY, variables: { startDate, endDate } },
          { headers: { "Content-Type": "application/json" } },
        )
        if (!mounted) return
        if (res.data?.errors?.length) {
          throw new Error(res.data.errors.map((e) => e.message).join("; "))
        }
        setData(res.data?.data?.shipmentAnalyticsSummary || null)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || "Failed to load shipments data")
        setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [startDate, endDate])

  const total = (data?.delivered || 0) + (data?.pending || 0) + (data?.returned || 0)
  const chartData = [
    { name: t.pending, value: data?.pending || 0, color: "#f59e0b" },
    { name: t.delivered, value: data?.delivered || 0, color: "#10b981" },
    { name: t.returned || "Returned", value: data?.returned || 0, color: "#ef4444" },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.shipments || "Shipments"}</h1>
          <p className="text-muted-foreground">{t.trackPerformance}</p>
        </div>

        <div className="flex gap-2">
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
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><BarIcon className="h-4 w-4" />{toEnglishLocaleString(total)}</div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </div>
      ) : null}

      {!loading && (
        <>
          {/* Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t.pending}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{toEnglishLocaleString(data?.pending || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t.delivered}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{toEnglishLocaleString(data?.delivered || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t.returned || "Returned"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{toEnglishLocaleString(data?.returned || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t.totalOrders || "Total"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{toEnglishLocaleString(total)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t.revenueVsOrders}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer config={{}} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}

      {error ? <div className="text-sm text-red-500">{error}</div> : null}
    </div>
  )
}


