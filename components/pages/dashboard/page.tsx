"use client"

/**
 * Dashboard Overview Page - Optimized for Performance
 * 
 * This is a temporary overview implementation that aggregates data from multiple API endpoints
 * (Products, Orders, RFQs) until the backend creates a dedicated overview/dashboard endpoint.
 * 
 * Optimizations:
 * - Memoized callbacks to prevent unnecessary re-fetches
 * - Stabilized data dependencies using lengths/primitives where possible
 * - Extracted utility functions outside component
 * - Memoized expensive calculations
 */

import { useCallback, useMemo } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency as formatCurrencyUtil, toEnglishLocaleDateString } from "@/lib/utils"
import {
  FileText,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  PlusSquare,
} from "lucide-react"
import Link from "next/link"
import { useApiWithFallback } from "@/hooks/useApiWithFallback"
import { listProducts } from "@/src/services/products-api"
import { listOrders, OrderListItem } from "@/src/services/orders-api"
import { listMarketRFQs, RFQListItem } from "@/src/services/rfq-api"
import { ProductListItem } from "@/src/services/types/product-types"

interface DashboardStats {
  newRfqs: number
  activeOrders: number
  totalProducts: number
  monthlyRevenue: number
}

// Extract utility functions outside component to prevent recreating on each render
const getTimeRemaining = (expiresAt: string | null | undefined, t: any) => {
  if (!expiresAt) return t.expired || "Expired"
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return t.expired || "Expired"
  if (days === 0) return t.expiresToday || "Expires today"
  if (days === 1) return t.expiresTomorrow || "Expires tomorrow"
  return (t.expiresInDays || "Expires in {days} days").replace("{days}", String(days))
}

const formatCurrency = (amount: string | number, currency: string = 'USD') => {
  return formatCurrencyUtil(amount, currency)
}

const calculateMonthlyRevenue = (orders: OrderListItem[]): number => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  return orders
    .filter((order) => {
      const orderDate = new Date(order.created_at)
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
    })
    .reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0)
}

const countActiveOrders = (orders: OrderListItem[]): number => {
  const activeStatuses = ['pending', 'processing', 'shipped', 'in_escrow']
  return orders.filter((o) => 
    activeStatuses.includes(o.status?.toLowerCase() || '')
  ).length
}

const productsFallback = () => Promise.resolve({ data: [] as ProductListItem[] })
const ordersFallback = () =>
  Promise.resolve({
    data: [] as OrderListItem[],
    meta: { total: 0 },
    links: {},
  })
const rfqsFallback = () =>
  Promise.resolve({
    data: [] as RFQListItem[],
    meta: { total: 0 },
    links: undefined,
  })

export default function DashboardPage() {
  const { t } = useI18n()

  // Memoized fetchers - these will never change
  const productsFetcher = useCallback(() => listProducts({ page: 1 }), [])
  const ordersFetcher = useCallback(() => listOrders({ page: 1 }), [])
  const rfqsFetcher = useCallback(() => listMarketRFQs({ status: 'open', page: 1, per_page: 10 }), [])

  // Fetch Products
  const { data: productsData, loading: productsLoading } = useApiWithFallback({
    fetcher: productsFetcher,
    fallback: productsFallback,
  })

  // Fetch Orders
  const { data: ordersData, loading: ordersLoading } = useApiWithFallback({
    fetcher: ordersFetcher,
    fallback: ordersFallback,
  })

  // Fetch RFQs
  const { data: rfqsData, loading: rfqsLoading } = useApiWithFallback({
    fetcher: rfqsFetcher,
    fallback: rfqsFallback,
  })

  const loading = productsLoading || ordersLoading || rfqsLoading

  // Stabilize data arrays - only recreate when actual data changes
  const products = useMemo(() => productsData?.data || [], [productsData?.data])
  const orders = useMemo(() => ordersData?.data || [], [ordersData?.data])
  const rfqs = useMemo(() => rfqsData?.data || [], [rfqsData?.data])
  const rfqsTotal = rfqsData?.meta?.total || 0

  // Calculate stats - now with stable dependencies
  const stats = useMemo<DashboardStats>(() => {
    return {
      newRfqs: rfqsTotal || rfqs.length,
      activeOrders: countActiveOrders(orders),
      totalProducts: products.length,
      monthlyRevenue: calculateMonthlyRevenue(orders),
    }
  }, [products.length, orders, rfqs.length, rfqsTotal])

  // Get recent items - slice only when data changes
  const recentRFQs = useMemo(() => rfqs.slice(0, 3), [rfqs])
  const recentOrders = useMemo(() => orders.slice(0, 3), [orders])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.dashboardHeader}</h1>
        <p className="text-muted-foreground">{t.dashboardOverview}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="bg-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.newRFQs}</CardTitle>
            <FileText className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.newRfqs}</div>
            <p className="text-xs text-blue-100">
              {t.open || "Open"} {t.rfqs || "RFQs"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.activeOrdersHeader || "Active Orders"}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeOrders}</div>
            <p className="text-xs text-purple-100">
              {t.pending || "Pending"} & {t.shipped || "Shipped"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.products || "Products"}</CardTitle>
            <Package className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProducts}</div>
            <p className="text-xs text-orange-100">
              {t.totalProducts || "Total products"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.monthlyRevenue || "Monthly Revenue"}</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-red-100">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.quickActions}</CardTitle>
          <CardDescription>{t.mostUsedActions}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-3 sm:grid-cols-3">
            <Link href="/dashboard/products/new">
              <Button className="h-20 flex-col gap-2 w-full">
                <PlusSquare className="h-6 w-6" />
                {t.addNewProduct}
              </Button>
            </Link>
            <Link href="/dashboard/inbox">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <MessageSquare className="h-6 w-6" />
                {t.checkMessages}
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent w-full">
                <TrendingUp className="h-6 w-6" />
                {t.viewAnalytics}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent RFQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.recentRFQs}
            </CardTitle>
            <CardDescription>{t.rfqsNeedAttention}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRFQs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {t.noRecentRFQs || "No recent RFQs"}
              </div>
            ) : (
              recentRFQs.map((rfq: RFQListItem) => (
                <div key={rfq.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{rfq.title || "Untitled"}</h4>
                    <p className="text-xs text-muted-foreground truncate">{rfq.buyer_company || t.unknown || "Unknown"}</p>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      {rfq.category && (
                        <Badge variant="outline" className="text-xs">{rfq.category}</Badge>
                      )}
                      {rfq.target_price && (
                        <span className="text-primary font-medium">
                          {formatCurrency(rfq.target_price, rfq.currency || 'USD')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1 ml-2 flex-shrink-0">
                    <Badge variant={rfq.status === "open" ? "default" : "secondary"}>
                      {rfq.status === "open" ? (t.open || "Open") : (rfq.status || t.closed || "Closed")}
                    </Badge>
                    {rfq.expires_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {getTimeRemaining(rfq.expires_at, t)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            <Link href="/dashboard/rfq">
              <Button variant="outline" className="w-full bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                {t.viewAllRFQs || "View All RFQs"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t.recentOrders}
            </CardTitle>
            <CardDescription>{t.latestOrdersStatus}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {t.noRecentOrders || "No recent orders"}
              </div>
            ) : (
              recentOrders.map((order: OrderListItem) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {order.order_number || `#${order.id}`}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.user?.name || order.user?.email || t.unknown || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {toEnglishLocaleDateString(order.created_at)}
                    </p>
                    {order.items_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {order.items_count} {order.items_count === 1 ? (t.item || "item") : (t.items || "items")}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1 ml-2 flex-shrink-0">
                    <p className="font-medium text-primary">{formatCurrency(order.total_amount)}</p>
                    <Badge 
                      variant={
                        order.status?.toLowerCase() === "shipped" || order.status?.toLowerCase() === "completed" 
                          ? "default" 
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {order.status?.toLowerCase() === "shipped" || order.status?.toLowerCase() === "completed" ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t.shipped || "Shipped"}
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          {order.status || t.pending || "Pending"}
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            <Link href="/dashboard/orders">
              <Button variant="outline" className="w-full bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                {t.viewAllOrders || "View All Orders"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}