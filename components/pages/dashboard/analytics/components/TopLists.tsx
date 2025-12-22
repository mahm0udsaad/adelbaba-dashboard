import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalyticsData } from "./types"
import { useI18n } from "@/lib/i18n/context"
import { toEnglishLocaleString } from "@/lib/utils"

interface TopListsProps {
  data: AnalyticsData
  variant?: "products" | "buyers"
}

export function TopLists({ data, variant }: TopListsProps) {
  const { t } = useI18n()
  const showProducts = !variant || variant === "products"
  const showBuyers = !variant || variant === "buyers"
  return (
    <div className={`grid gap-6 ${showProducts && showBuyers ? "lg:grid-cols-2" : ""}`}>
      {showProducts && (
        <Card>
          <CardHeader>
            <CardTitle>{t.topPerformingProducts}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data.products?.topProducts || []).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.sales} {t.sales}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">${toEnglishLocaleString(product.revenue || 0)}</div>
                    <div className="text-sm text-muted-foreground">{t.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showBuyers && (
        <Card>
          <CardHeader>
            <CardTitle>{t.topBuyers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data.buyers?.topBuyers || []).map((buyer, index) => (
                <div key={buyer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{buyer.name}</h4>
                      <p className="text-sm text-muted-foreground">{buyer.orders} {t.ordersLower} • {buyer.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">${toEnglishLocaleString(buyer.revenue || 0)}</div>
                    <div className="text-sm text-muted-foreground">{t.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


