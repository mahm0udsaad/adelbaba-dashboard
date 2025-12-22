"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { OrdersHeader } from "./components/OrdersHeader"
import { FiltersBar } from "./components/FiltersBar"
import { OrdersList } from "./components/OrdersList"
import type { Order, OrdersFiltersState } from "./components/types"
import { DollarSign, Package, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ordersApi, type OrderListItem } from "@/src/services/orders-api"
import { toast } from "@/hooks/use-toast"
import { toEnglishLocaleString } from "@/lib/utils"

// Map API response to frontend Order type
function mapApiOrderToOrder(apiOrder: OrderListItem): Order {
  return {
    id: apiOrder.order_number || `#${apiOrder.id}`,
    buyerCompany: apiOrder.user?.name || "Unknown Buyer",
    items: [], // Items list not included in list endpoint
    currency: "USD", // Default currency
    total: parseFloat(apiOrder.total_amount) || 0,
    tradeAssurance: {
      enabled: false,
      escrowStatus: null,
      escrowAmount: 0,
    },
    shipping: {
      carrier: null,
      tracking: null,
      method: null,
    },
    status: apiOrder.shipment_status || apiOrder.status || "pending",
    priority: "normal",
    paymentStatus: apiOrder.payment_status || "pending",
    createdAt: apiOrder.created_at,
    updatedAt: apiOrder.updated_at,
  }
}

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrdersFiltersState>({ search: "", status: "all" })
  const { t, isArabic } = useI18n()
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        per_page: 100, // Get more orders for better filtering
        sort: "desc",
      }

      // Map frontend status filter to API parameters
      if (filters.status !== "all") {
        // Map status to shipment_status for API
        params.shipment_status = filters.status
      }

      const response = await ordersApi.list(params)
      const mappedOrders = response.data.map(mapApiOrderToOrder)
      setAllOrders(mappedOrders)
    } catch (err) {
      console.error("Failed to fetch orders:", err)
      setError("Failed to load orders")
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filters.status])

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        filters.search === "" ||
        order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.buyerCompany.toLowerCase().includes(filters.search.toLowerCase())

      const matchesStatus = filters.status === "all" || order.status === filters.status

      return matchesSearch && matchesStatus
    })
  }, [allOrders, filters])

  return (  
    <div className="p-4 space-y-6">
      <OrdersHeader title={t.orders} subtitle={t.manageOrders} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.totalOrders}</CardTitle>
            {/* icon moved to simplified header */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{filteredOrders?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.activeOrders}</CardTitle>
            <Package className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(filteredOrders || []).filter((o) => ["in_escrow", "shipped"].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.tradeAssurance}</CardTitle>
            <Shield className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(filteredOrders || []).filter((o) => o.tradeAssurance.enabled).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.totalValue}</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${toEnglishLocaleString((filteredOrders || []).reduce((sum, order) => sum + order.total, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <FiltersBar
        filters={filters}
        setFilters={setFilters}
        searchPlaceholder={t.searchOrders}
        labels={{
          search: t.search,
          filter: t.filter,
          allStatus: t.allStatus,
          awaitingPayment: t.awaitingPayment,
          inEscrow: t.inEscrow,
          shipped: t.shipped,
          delivered: t.delivered,
          disputed: t.disputed,
          refresh: t.refresh,
        }}
        onRefresh={fetchOrders}
      />

      <OrdersList
        loading={loading}
        orders={filteredOrders}
        labels={{
          noOrdersFound: t.noOrdersFound,
          tryAdjustingSearch: t.tryAdjustingSearch,
          item: t.item,
          items: t.items,
          viewDetails: t.viewDetails,
          orderDate: t.orderDate,
          pending: t.pending,
          held: t.held,
          released: t.released,
          disputed: t.disputed,
          refunded: t.refunded,
        }}
      />
    </div>
  )
}
