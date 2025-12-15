"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, X } from "lucide-react"
import type { ProductListItem } from "@/src/services/types/product-types"
import { listProducts } from "@/src/services/products-api"
import { cn } from "@/lib/utils"

type ProductCardPickerProps = {
  value: ProductListItem | null
  onChange: (next: ProductListItem | null) => void
  disabled?: boolean
  className?: string
  labels?: {
    searchPlaceholder: string
    clear: string
    emptyTitle: string
    emptyHint: string
    selected: string
  }
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export function ProductCardPicker({ value, onChange, disabled, className, labels }: ProductCardPickerProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 250)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ProductListItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (q: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listProducts({ q })
      setItems(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setItems([])
      setError("failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts(debouncedSearch)
  }, [debouncedSearch, fetchProducts])

  const selectedId = value?.id ?? null

  const filtered = useMemo(() => {
    // API already handles q, but keep a tiny client-side refinement for better perceived accuracy.
    if (!debouncedSearch) return items
    const q = debouncedSearch.toLowerCase()
    return items.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q))
  }, [items, debouncedSearch])

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            disabled={disabled}
            placeholder={labels?.searchPlaceholder ?? "Search products..."}
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {value ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="bg-transparent"
          >
            <X className="h-4 w-4 mr-2" />
            {labels?.clear ?? "Clear"}
          </Button>
        ) : null}
      </div>

      {value ? (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{labels?.selected ?? "Selected"}</Badge>
          <span className="text-foreground font-medium line-clamp-1">{value.name}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="p-4">
          <div className="text-sm font-medium">{labels?.emptyTitle ?? "Products unavailable"}</div>
          <div className="text-sm text-muted-foreground">{labels?.emptyHint ?? "We couldn’t load products right now. Try again."}</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-4">
          <div className="text-sm font-medium">{labels?.emptyTitle ?? "No products found"}</div>
          <div className="text-sm text-muted-foreground">{labels?.emptyHint ?? "Try a different search."}</div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const isSelected = selectedId === p.id
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(p)}
                className={cn(
                  "text-left rounded-lg border bg-card hover:bg-accent/30 transition-colors overflow-hidden",
                  isSelected ? "ring-2 ring-primary border-primary/50" : "border-border",
                  disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
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
                  <div className="absolute top-2 left-2">
                    <Badge variant={p.is_active ? "default" : "destructive"} className="text-[10px] px-2 py-0.5">
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{p.category?.name ?? ""}</div>
                  <div className="text-sm font-semibold text-primary">{p.shown_price}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


