"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Search } from "lucide-react"

import type { ProductListItem } from "@/src/services/types/product-types"
import { listProducts, getProduct } from "@/src/services/products-api"
import { listWarehouses, operateInventory, type InventoryOperationType, type Warehouse } from "@/src/services/inventory-api"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export default function InventoryOperatePage() {
  const { t, isArabic } = useI18n()
  const router = useRouter()
  const sp = useSearchParams()

  const type = ((sp.get("type") as InventoryOperationType | null) ?? "receive") as InventoryOperationType

  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 250)

  const [products, setProducts] = React.useState<ProductListItem[]>([])
  const [productsLoading, setProductsLoading] = React.useState(false)
  const [productsError, setProductsError] = React.useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = React.useState<ProductListItem | null>(null)
  const [resolvedSkuId, setResolvedSkuId] = React.useState<number | null>(null)
  const [skuResolving, setSkuResolving] = React.useState(false)

  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [warehousesLoading, setWarehousesLoading] = React.useState(false)

  const [warehouseId, setWarehouseId] = React.useState<number | null>(null)
  const [quantity, setQuantity] = React.useState<number>(1)
  const [notes, setNotes] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    setProductsLoading(true)
    setProductsError(null)
    listProducts({ q: debouncedSearch })
      .then((res) => {
        if (!mounted) return
        const items = Array.isArray(res?.data) ? res.data : []
        // keep inventory UX focused: only active products
        setProducts(items.filter((p) => p.is_active))
      })
      .catch((e) => {
        if (!mounted) return
        console.error("[Inventory Operate] Failed to load products", e)
        setProducts([])
        setProductsError("failed")
      })
      .finally(() => {
        if (!mounted) return
        setProductsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [debouncedSearch])

  React.useEffect(() => {
    let mounted = true
    setWarehousesLoading(true)
    listWarehouses()
      .then((res) => {
        if (!mounted) return
        setWarehouses(res.data || [])
      })
      .catch((e) => {
        if (!mounted) return
        console.error("[Inventory Operate] Failed to load warehouses", e)
        setWarehouses([])
      })
      .finally(() => {
        if (!mounted) return
        setWarehousesLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const resolveSkuForProduct = React.useCallback(async (productId: number) => {
    setSkuResolving(true)
    setResolvedSkuId(null)
    try {
      const detail = await getProduct(productId)
      const firstSkuId =
        detail?.skus?.find((s) => typeof s.id === "number")?.id ??
        null

      if (!firstSkuId) {
        toast({
          title: (t as any).inventoryNoSkusTitle || "No SKU found",
          description: (t as any).inventoryNoSkusDescription || "This product doesn’t have any SKUs yet.",
          variant: "destructive",
        })
        return null
      }

      setResolvedSkuId(firstSkuId)
      return firstSkuId
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      console.error("[Inventory Operate] Failed to resolve SKU", { status, data, error: e })
      toast({
        title: (t as any).inventorySkuResolveErrorTitle || "Couldn’t select SKU",
        description: data?.message || (t as any).inventorySkuResolveErrorDescription || "Please try again.",
        variant: "destructive",
      })
      return null
    } finally {
      setSkuResolving(false)
    }
  }, [t])

  const onSelectProduct = async (p: ProductListItem) => {
    setSelectedProduct(p)
    await resolveSkuForProduct(p.id)
  }

  const canSubmit =
    !!selectedProduct &&
    !!resolvedSkuId &&
    !!warehouseId &&
    quantity > 0 &&
    !submitting &&
    !skuResolving

  const submit = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      await operateInventory({
        sku_id: resolvedSkuId!,
        warehouse_id: warehouseId!,
        type,
        quantity,
        notes: notes || undefined,
      })
      toast({
        title: (t as any).inventoryOperationSuccessTitle || "Operation completed",
        description: (t as any).inventoryOperationSuccessDescription || "Inventory movement done successfully.",
      })
      router.push("/dashboard/inventory?tab=levels")
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      const message =
        data?.message ||
        (data?.errors && typeof data.errors === "object"
          ? Object.values(data.errors).flat().filter(Boolean)[0]
          : undefined)
      console.error("[Inventory Operate] Operation failed", { status, data, error: e })
      toast({
        title: (t as any).inventoryOperationErrorTitle || "Operation failed",
        description: message || (t as any).inventoryOperationErrorDescription || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label={t.back || "Back"}>
          <ArrowLeft className={cn("h-5 w-5", isArabic && "rotate-180")} />
        </Button>
        <div className="min-w-0">
          <div className="text-lg font-semibold">
            {(t as any).inventoryOperatePageTitle || (type === "receive" ? "Receive Stock" : "Inventory Operation")}
          </div>
          <div className="text-sm text-muted-foreground">
            {(t as any).inventoryOperatePageSubtitle || "Choose a product, then add quantity and warehouse."}
          </div>
        </div>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            placeholder={(t as any).inventoryProductSearchPlaceholder || "Search products..."}
            className="pl-9 h-11"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {productsLoading ? (
        <Card className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {(t as any).loading || "Loading..."}
        </Card>
      ) : productsError ? (
        <Card className="p-6">
          <div className="text-sm font-medium">{(t as any).inventoryProductsUnavailableTitle || "Products unavailable"}</div>
          <div className="text-sm text-muted-foreground">{(t as any).inventoryProductsUnavailableHint || "We couldn’t load products right now. Try again."}</div>
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-6 space-y-2">
          <div className="text-sm font-medium">{(t as any).inventoryNoProductsTitle || "No products"}</div>
          <div className="text-sm text-muted-foreground">{(t as any).inventoryNoProductsHint || "Add products first, then you can receive stock."}</div>
          <div className="pt-2">
            <Link href="/dashboard/products/new">
              <Button>{(t as any).addProduct || "Add product"}</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((p) => {
            const isSelected = selectedProduct?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProduct(p)}
                className={cn(
                  "text-left rounded-xl border bg-card hover:bg-accent/30 transition-colors overflow-hidden",
                  isSelected ? "ring-2 ring-primary border-primary/50" : "border-border"
                )}
              >
                <div className="relative h-24 w-full overflow-hidden bg-muted">
                  <img
                    src={p.image || "/placeholder.svg"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                  />
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="text-sm font-semibold text-primary">{p.shown_price}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedProduct ? (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold line-clamp-1">{selectedProduct.name}</div>
              <div className="text-sm text-primary font-semibold">{selectedProduct.shown_price}</div>
            </div>
            <Badge variant="secondary">{(t as any).adsSelected || "Selected"}</Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">{(t as any).inventoryWarehouseLabel || "Warehouse *"}</div>
              <Select
                value={warehouseId ? String(warehouseId) : ""}
                onValueChange={(v) => setWarehouseId(Number(v))}
                disabled={warehousesLoading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={(t as any).inventorySelectWarehousePlaceholder || "Select a warehouse"} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{(t as any).inventoryQuantityLabel || "Quantity *"}</div>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-11 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{(t as any).inventoryNotesLabel || "Notes (Optional)"}</div>
            <Input
              value={notes}
              placeholder={(t as any).inventoryNotesPlaceholder || "Notes (optional)"}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" disabled={!canSubmit} onClick={submit}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {(t as any).inventoryProcessing || "Processing..."}
                </>
              ) : (
                (t as any).inventoryConfirmOperation || "Confirm Operation"
              )}
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={() => setSelectedProduct(null)}>
              {(t as any).clear || "Clear"}
            </Button>
          </div>

          {skuResolving ? (
            <div className="text-xs text-muted-foreground pt-1">
              <Loader2 className="h-3 w-3 inline mr-2 animate-spin" />
              {(t as any).inventoryResolvingSku || "Preparing product..."}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}


