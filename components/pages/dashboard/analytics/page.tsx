"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Download } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { RevenueCharts } from "./components/RevenueCharts"
import { OrdersStatus } from "./components/OrdersStatus"
import { TopLists } from "./components/TopLists"
import { AnalyticsProvider, useAnalytics } from "@/lib/analytics-context"
import type { AnalyticsData } from "./components/types"
import { format, subMonths } from "date-fns"
import { toEnglishLocaleString } from "@/lib/utils"

const emptyAnalyticsData: AnalyticsData = {
  revenue: {
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    monthlyData: [],
  },
  orders: {
    totalOrders: 0,
    monthlyOrders: 0,
    orderGrowth: 0,
    statusBreakdown: [],
  },
  products: {
    totalProducts: 0,
    activeProducts: 0,
    topProducts: [],
  },
  buyers: {
    totalBuyers: 0,
    activeBuyers: 0,
    newBuyers: 0,
    buyerGrowth: 0,
    topBuyers: [],
  },
}

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
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  }
}

function AnalyticsContent({ period, setPeriod }: { period: string; setPeriod: (v: string) => void }) {
  const { t, isArabic } = useI18n()
  const { data, loading } = useAnalytics()
  const analyticsData: AnalyticsData = useMemo(() => data || emptyAnalyticsData, [data, isArabic, period])
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-muted animate-pulse rounded" />
          <div className="h-80 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  const chartConfig = {
    revenue: { label: t.revenue, color: "#f59e0b" },
    orders: { label: t.orders, color: "#10b981" },
    count: { label: t.count, color: "#3b82f6" },
    status: { label: t.status, color: "#8b5cf6" },
    percentage: { label: t.percentage, color: "#ef4444" },
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.analyticsHeader}</h1>
          <p className="text-muted-foreground">
            {t.trackPerformance}
          </p>
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

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${toEnglishLocaleString(analyticsData.revenue?.totalRevenue || 0)}</div>
            <div className="flex items-center text-xs text-blue-100">
              {(analyticsData.revenue?.revenueGrowth || 0) > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-200" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-200" />
              )}
              {Math.abs(analyticsData.revenue?.revenueGrowth || 0)}% {t.fromLastMonth}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.totalOrdersHeader}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{toEnglishLocaleString(analyticsData.orders?.totalOrders || 0)}</div>
            <div className="flex items-center text-xs text-purple-100">
              {(analyticsData.orders?.orderGrowth || 0) > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-200" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-200" />
              )}
              {Math.abs(analyticsData.orders?.orderGrowth || 0)}% {t.fromLastMonth}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.activeProducts}</CardTitle>
            <Package className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analyticsData.products?.activeProducts || 0}</div>
            <p className="text-xs text-orange-100">
              {t.outOf} {analyticsData.products?.totalProducts || 0} {t.productsLower}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.activeBuyers}</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analyticsData.buyers?.activeBuyers || 0}</div>
            <div className="flex items-center text-xs text-red-100">
              <TrendingUp className="h-3 w-3 mr-1 text-green-200" />
              {analyticsData.buyers?.newBuyers || 0} {t.newThisMonth}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">{t.revenue}</TabsTrigger>
          <TabsTrigger value="orders">{t.orders}</TabsTrigger>
          <TabsTrigger value="products">{t.products}</TabsTrigger>
          <TabsTrigger value="buyers">{t.buyers}</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueCharts data={analyticsData} />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrdersStatus data={analyticsData} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <TopLists data={analyticsData} variant="products" />
        </TabsContent>

        <TabsContent value="buyers" className="space-y-6">
          <TopLists data={analyticsData} variant="buyers" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("6months")
  const range = getRange(period)
  return (
    <AnalyticsProvider startDate={range.startDate} endDate={range.endDate}>
      <AnalyticsContent period={period} setPeriod={setPeriod} />
    </AnalyticsProvider>
  )
}
