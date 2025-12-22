"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { format, subMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import { useI18n } from "@/lib/i18n/context"
import { DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react"
import { toEnglishLocaleString } from "@/lib/utils"

type WalletTrendPoint = { date: string; totalAmount: number; count?: number }
type WalletSummary = {
  availableBalance: number
  currency?: string
  netProfit: number
  pendingAmount?: number
  revenueTrend: WalletTrendPoint[]
  totalExpenses: number
  totalIncome: number
}

type GQLOutput = {
  data?: { walletSummary?: WalletSummary }
  errors?: Array<{ message: string }>
}

const WALLET_QUERY = `
  query WalletSummary($startDate: String!, $endDate: String!) {
    walletSummary(startDate: $startDate, endDate: $endDate) {
      availableBalance
      currency
      netProfit
      pendingAmount
      totalExpenses
      totalIncome
      revenueTrend { date totalAmount count }
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

export default function WalletPage() {
  const { t, isArabic } = useI18n()
  const [period, setPeriod] = useState("6months")
  const { startDate, endDate } = useMemo(() => getRange(period), [period])
  const [data, setData] = useState<WalletSummary | null>(null)
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
          { query: WALLET_QUERY, variables: { startDate, endDate } },
          { headers: { "Content-Type": "application/json" } },
        )
        if (!mounted) return
        if (res.data?.errors?.length) {
          throw new Error(res.data.errors.map((e) => e.message).join("; "))
        }
        setData(res.data?.data?.walletSummary || null)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || "Failed to load wallet data")
        setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [startDate, endDate])

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.wallet || "Wallet"}</h1>
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
          <Button variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Loading State */}
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
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${toEnglishLocaleString(data?.totalIncome || 0)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {(data?.totalIncome || 0) >= (data?.totalExpenses || 0) ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {t.revenue}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalExpenses || "Total Expenses"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${toEnglishLocaleString(data?.totalExpenses || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.availableBalance || "Available Balance"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${toEnglishLocaleString(data?.availableBalance || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.netProfit || "Net Profit"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${toEnglishLocaleString(data?.netProfit || 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t.revenueTrend}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer config={{}} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <LineChart data={data?.revenueTrend || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="totalAmount" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
                  </LineChart>
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


