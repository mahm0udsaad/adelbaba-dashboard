import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Shield, Truck, CheckCircle, AlertTriangle, Package, Building, Clock } from "lucide-react"
import Link from "next/link"
import { statusColors, escrowStatusColors } from "./constants"
import type { Order } from "./types"
import { toEnglishLocaleDateString, toEnglishLocaleString } from "@/lib/utils"

interface OrderCardProps {
  order: Order
  labels: {
    item: string
    items: string
    viewDetails: string
    orderDate: string
    pending: string
    held: string
    released: string
    disputed: string
    refunded: string
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "awaiting_payment":
      return <Clock className="h-4 w-4" />
    case "in_escrow":
      return <Shield className="h-4 w-4" />
    case "shipped":
      return <Truck className="h-4 w-4" />
    case "delivered":
      return <CheckCircle className="h-4 w-4" />
    case "disputed":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

export function OrderCard({ order, labels }: OrderCardProps) {
  const getEscrowStatusLabel = (status: string | null) => {
    if (!status) return ""
    switch (status) {
      case "pending":
        return labels.pending
      case "held":
        return labels.held
      case "released":
        return labels.released
      case "disputed":
        return labels.disputed
      case "refunded":
        return labels.refunded
      default:
        return status
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{order.id}</h3>
              <Badge className={statusColors[order.status]}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </Badge>
              {order.tradeAssurance.enabled && (
                <Badge variant="outline" className={escrowStatusColors[order.tradeAssurance.escrowStatus || "pending"]}>
                  <Shield className="h-3 w-3 mr-1" />
                  {getEscrowStatusLabel(order.tradeAssurance.escrowStatus)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {order.buyerCompany}
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {order.items?.length || 0} {(order.items?.length || 0) === 1 ? labels.item : labels.items}
              </div>
              {order.shipping.tracking && (
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  {order.shipping.carrier}: {order.shipping.tracking}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {(order.items || []).slice(0, 2).map((item, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-muted-foreground ml-2">
                    {item.qty} × ${item.unitPrice} = ${item.totalPrice}
                  </span>
                </div>
              ))}
              {(order.items?.length || 0) > 2 && (
                <div className="text-sm text-muted-foreground">+{(order.items?.length || 0) - 2} more items</div>
              )}
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {labels.orderDate} {toEnglishLocaleDateString(order.createdAt)}
              </div>
              <div className="text-lg font-bold text-primary">${toEnglishLocaleString(order.total)}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Link href={`/dashboard/orders/${order.id}`}>
              <Button size="sm">
                <Eye className="h-4 w-4 mr-2" />
                {labels.viewDetails}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


