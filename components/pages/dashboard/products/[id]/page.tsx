"use client"

import { useCallback, useMemo, useState, type ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Eye, CheckCircle, Star, Tag, Trash2, XCircle } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { useApiWithFallback } from "@/hooks/useApiWithFallback"
import { getProduct, deleteProduct } from "@/src/services/products-api"
import type { ProductContentBlock, ProductDetail } from "@/src/services/types/product-types"
import { DeleteConfirmationDialog } from "../components/DeleteConfirmationDialog"
import { toast } from "@/components/ui/use-toast"
import { toEnglishLocaleString, toEnglishLocaleDateString } from "@/lib/utils"

// Placeholder sub-components for displaying complex data. These should be in their own files.

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground text-left sm:text-right break-words">{value}</span>
  </div>
)

const MediaGallery = ({ media }: { media: ProductDetail["media"] }) => {
  const { t } = useI18n()
  if (!media || media.length === 0) return <p>{t.noMediaAvailable}</p>
  return (
    <div className="grid grid-cols-3 gap-4">
      {media.map(m => (
        <img key={m.id} src={m.url} alt={m.name} className="rounded-lg object-cover h-40 w-full" />
      ))}
    </div>
  )
}

const PricingDisplay = ({ product }: { product: ProductDetail }) => {
  const { t } = useI18n()
  const formattedPriceType = product.price_type.charAt(0).toUpperCase() + product.price_type.slice(1)

  let pricingBody: ReactNode = null

  if (product.price_type === "tiered" && product.tieredPrices?.length) {
    pricingBody = (
      <div className="space-y-2">
        {product.tieredPrices.map((tier, i) => {
          const minQuantity = tier.minQuantity ?? tier.min_quantity ?? 0
          const parsedPrice = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price
          const price = Number.isFinite(parsedPrice) ? parsedPrice : 0
          return (
            <div key={`${minQuantity}-${i}`} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
              <span>{`≥ ${minQuantity} ${product.unit}${minQuantity > 1 ? "s" : ""}`}</span>
              <span className="font-bold text-primary">${price.toFixed(2)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (product.price_type === "sku") {
    pricingBody = <p className="text-sm text-muted-foreground">{t.seeSkuPricing}</p>
  }

  if (!pricingBody && product.price_type !== "range") {
    pricingBody = <p className="text-sm text-muted-foreground">{t.pricingNotAvailable}</p>
  }

  return (
    <div className="space-y-3">
      <DetailRow label={t.priceType} value={formattedPriceType} />
      <DetailRow label={t.shownPriceLabel} value={product.shown_price || t.pricingNotAvailable} />
      {product.rangePrices && (
        <>
          <DetailRow label={t.minPrice} value={product.rangePrices.minPrice} />
          <DetailRow label={t.maxPrice} value={product.rangePrices.maxPrice} />
        </>
      )}
      {pricingBody}
    </div>
  )
}

const SkuList = ({ skus }: { skus: ProductDetail["skus"] }) => {
  const { t } = useI18n()
  if (!skus || skus.length === 0) return <p>{t.noSkusAvailable}</p>
  return (
    <div className="space-y-4">
      {skus.map(sku => (
        <div key={sku.id} className="p-3 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold">{sku.code}</span>
            <span className="text-lg text-primary font-bold">${sku.price}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {t.stock}:{" "}
            {typeof sku.inventory === "number"
              ? sku.inventory
              : sku.inventory?.warehouses?.reduce(
                  (sum, warehouse) => sum + (Number(warehouse.on_hand) || 0),
                  0
                ) ?? 0}
          </div>
          <div className="flex gap-2 mt-2">
            {sku.attributes.map((attr, i) => (
              <Badge key={i} variant="secondary">{attr.name}: {attr.value}</Badge>
            ))}
          </div>
          <div className="mt-3">
            <Link href={`/dashboard/inventory?sku_id=${sku.id}`}>
              <Button size="sm" variant="outline" className="bg-transparent">{t.operate || "Operate"}</Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

const ProductContentDisplay = ({ content }: { content?: ProductContentBlock | null }) => {
  const { t } = useI18n()
  if (!content) {
    return <p className="text-sm text-muted-foreground">{t.noAdditionalContent}</p>
  }

  const generalEntries = Object.entries(content.general || {}).filter(([, value]) => value)
  const specificationEntries = (content.specifications || []).filter(spec => spec.name || spec.value)
  const shippingEntries = (content.shipping || []).filter(method => method.method || method.time || method.cost)

  const hasContent = generalEntries.length > 0 || specificationEntries.length > 0 || shippingEntries.length > 0
  if (!hasContent) {
    return <p className="text-sm text-muted-foreground">{t.noAdditionalContent}</p>
  }

  return (
    <div className="space-y-6 text-sm">
      {generalEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.generalInfo}</p>
          <div className="rounded-lg border p-3 space-y-2">
            {generalEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-semibold text-foreground text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {specificationEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.specifications}</p>
          <ul className="space-y-2 rounded-lg border p-3">
            {specificationEntries.map((spec, index) => (
              <li key={`${spec.name}-${index}`} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{spec.name}</span>
                <span className="font-medium text-foreground text-right">{spec.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shippingEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.shippingMethods}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {shippingEntries.map((shipping, index) => (
              <div key={`${shipping.method}-${index}`} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between text-foreground font-semibold">
                  <span>{shipping.method || t.shippingMethod}</span>
                  <span>{shipping.cost}</span>
                </div>
                <p className="text-sm text-muted-foreground">{shipping.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const id = params.id as string
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const fetcher = useCallback(() => getProduct(id), [id])
  const fallback = useCallback(async () => {
    // In a real app, you might have a fallback or redirect.
    toast({ title: t.error, description: t.productLoadFailed, variant: "destructive" })
    router.push("/dashboard/products")
    return null
  }, [id, router, t])

  const { data: product, loading } = useApiWithFallback<ProductDetail | null>({
    fetcher,
    fallback,
    deps: [id],
  })

  const formatDateTime = useCallback(
    (value?: string | null) => {
      if (!value) return t.unknown
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return value
      return toEnglishLocaleDateString(parsed, { dateStyle: "short", timeStyle: "short" })
    },
    [t]
  )

  const displayedMedia = useMemo<ProductDetail["media"]>(() => {
    if (!product) return [] as ProductDetail["media"]
    const baseMedia = product.media ?? []
    if (!product.image) return baseMedia
    const hasPrimary = baseMedia.some(item => item.url === product.image)
    if (hasPrimary) return baseMedia
    return [
      { id: -1, name: product.name, url: product.image, type: "image" },
      ...baseMedia,
    ]
  }, [product])

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProduct(product.id)
      toast({ title: t.productDeleted, description: t.productDeletedSuccess })
      router.push("/dashboard/products")
    } catch (error) {
      toast({ title: t.error, description: t.productDeleteFailed, variant: "destructive" })
    }
  }

  if (loading || !product) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  const ratingDisplay = product.rating !== null && product.rating !== undefined ? product.rating.toFixed(1) : "—"
  const primaryInventoryLink = product.skus?.[0]?.id ? `/dashboard/inventory?sku_id=${product.skus[0].id}` : "/dashboard/inventory"

  return (
    <>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/products">
              <Button variant="ghost" size="sm" className="w-fit"><ArrowLeft className="h-4 w-4 mr-2" />{t.back}</Button>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                {product.label && (
                  <Badge variant="secondary" className="flex items-center gap-1 uppercase tracking-wide">
                    <Tag className="h-3.5 w-3.5" />
                    {product.label}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{product.category.name}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span>{ratingDisplay}</span>
                </span>
                <span>({toEnglishLocaleString(product.reviews_count)} {t.reviews})</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.shownPriceLabel}: <span className="font-semibold text-primary">{product.shown_price || t.pricingNotAvailable}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <Button><Edit className="h-4 w-4 mr-2" />{t.edit}</Button>
            </Link>
            <Link href={primaryInventoryLink}>
              <Button variant="outline" className="bg-transparent"><Eye className="h-4 w-4 mr-2" />{t.viewInventory || "View inventory levels"}</Button>
            </Link>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t.delete}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>{t.media}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <MediaGallery media={displayedMedia} />
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t.productVideo}</p>
                  {product.video ? (
                    <video
                      controls
                      preload="metadata"
                      poster={product.image}
                      className="w-full rounded-lg border border-border bg-black/80"
                    >
                      <source src={product.video} />
                      {t.noProductVideo}
                    </video>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.noProductVideo}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.description}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.productContent}</CardTitle></CardHeader>
              <CardContent>
                <ProductContentDisplay content={product.content} />
              </CardContent>
            </Card>

            {product.skus?.length ? (
              <Card>
                <CardHeader><CardTitle>{t.skus}</CardTitle></CardHeader>
                <CardContent><SkuList skus={product.skus} /></CardContent>
              </Card>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{t.status}</CardTitle></CardHeader>
              <CardContent>
                <Badge variant={product.is_active ? "default" : "destructive"} className="flex items-center gap-1">
                  {product.is_active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {product.is_active ? t.active : t.inactive}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.pricing}</CardTitle></CardHeader>
              <CardContent><PricingDisplay product={product} /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.generalInfo}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label={t.productId} value={`#${product.id}`} />
                <DetailRow label={t.productLabel} value={product.label || t.unknown} />
                <DetailRow label={t.moq} value={`${toEnglishLocaleString(product.moq)} ${product.unit}`} />
                <DetailRow label={t.inventory} value={toEnglishLocaleString(product.inventory)} />
                <DetailRow label={t.readyToShip} value={product.is_rts ? t.yes : t.no} />
                <DetailRow label={t.skuCount} value={toEnglishLocaleString(product.skus_count)} />
                <DetailRow label={t.reviews} value={toEnglishLocaleString(product.reviews_count)} />
                <DetailRow label={t.ratingLabel} value={ratingDisplay} />
                <DetailRow label={t.createdAtLabel} value={formatDateTime(product.created_at)} />
                <DetailRow label={t.updatedAtLabel} value={formatDateTime(product.updated_at)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.category}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {product.category.image && (
                    <img
                      src={product.category.image}
                      alt={product.category.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{product.category.name}</p>
                    <p className="text-sm text-muted-foreground">ID: #{product.category.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen} 
        onConfirm={handleDelete} 
      />
    </>
  )
}
