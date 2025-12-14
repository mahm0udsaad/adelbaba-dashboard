import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, CheckCircle, AlertTriangle, Truck } from "lucide-react"
import type { ProductListItem } from "@/services/types/product-types"
import { useI18n } from "@/lib/i18n/context"

interface StatsCardsProps {
  products: ProductListItem[]
}

export function StatsCards({ products }: StatsCardsProps) {
  const { t } = useI18n()
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <Card className="bg-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">{t.totalProducts}</CardTitle>
          <Package className="h-4 w-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{products?.length || 0}</div>
        </CardContent>
      </Card>

      <Card className="bg-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">{t.activeProducts}</CardTitle>
          <CheckCircle className="h-4 w-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{products?.filter((p) => p.is_active).length || 0}</div>
        </CardContent>
      </Card>

      <Card className="bg-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">{t.lowStock}</CardTitle>
          <AlertTriangle className="h-4 w-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{products?.filter((p) => p.inventory < 100).length || 0}</div>
        </CardContent>
      </Card>

      <Card className="bg-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">{t.readyToShip}</CardTitle>
          <Truck className="h-4 w-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{products?.filter((p) => p.is_rts).length || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}


