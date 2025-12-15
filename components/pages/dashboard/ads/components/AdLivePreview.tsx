"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ProductListItem } from "@/src/services/types/product-types"
import { cn } from "@/lib/utils"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

type AdLivePreviewProps = {
  adType: "product" | "banner"
  title: string
  budgetAmount?: number
  startDate?: string
  endDate?: string
  targetKeywords: string[]
  banner?: {
    bannerType: "banner" | "slideshow"
    bannerLocation: "header" | "footer"
    targetUrl?: string
    mediaFiles: File[]
  }
  product?: {
    selectedProduct: ProductListItem | null
  }
  labels?: {
    preview: string
    sponsored: string
    missingBannerMedia: string
    missingProduct: string
    schedule: string
    budget: string
    keywords: string
    location: string
  }
  className?: string
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return ""
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n)
}

export function AdLivePreview(props: AdLivePreviewProps) {
  const { labels } = props
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  useEffect(() => {
    if (props.adType !== "banner") {
      setMediaUrls([])
      return
    }
    const files = props.banner?.mediaFiles ?? []
    const urls = files.map((f) => URL.createObjectURL(f))
    setMediaUrls(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [props.adType, props.banner?.mediaFiles])

  const scheduleText = useMemo(() => {
    if (!props.startDate || !props.endDate) return ""
    return `${props.startDate} → ${props.endDate}`
  }, [props.startDate, props.endDate])

  const budgetText = useMemo(() => {
    if (typeof props.budgetAmount !== "number" || !Number.isFinite(props.budgetAmount)) return ""
    return formatMoney(props.budgetAmount)
  }, [props.budgetAmount])

  const keywords = props.targetKeywords.slice(0, 6)

  return (
    <Card className={cn("p-4 space-y-4", props.className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{labels?.preview ?? "Live Preview"}</div>
        <Badge variant="secondary" className="text-[10px]">{labels?.sponsored ?? "Sponsored"}</Badge>
      </div>

      {props.adType === "banner" ? (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border bg-muted">
            {mediaUrls.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                {labels?.missingBannerMedia ?? "Upload a banner image to preview it here."}
              </div>
            ) : props.banner?.bannerType === "slideshow" && mediaUrls.length > 1 ? (
              <div className="relative">
                <Carousel opts={{ loop: true }}>
                  <CarouselContent>
                    {mediaUrls.map((url, idx) => (
                      <CarouselItem key={idx}>
                        <img src={url} alt={`Banner ${idx + 1}`} className="h-40 w-full object-cover" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </div>
            ) : (
              <img src={mediaUrls[0]} alt="Banner preview" className="h-40 w-full object-cover" />
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium line-clamp-2">{props.title || "—"}</div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-transparent">
                {(labels?.location ?? "Location") + ": " + (props.banner?.bannerLocation ?? "—")}
              </Badge>
              {props.banner?.targetUrl ? (
                <Badge variant="outline" className="bg-transparent max-w-[240px] truncate">
                  {props.banner.targetUrl}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!props.product?.selectedProduct ? (
            <div className="rounded-lg border bg-muted h-40 flex items-center justify-center text-sm text-muted-foreground">
              {labels?.missingProduct ?? "Select a product to preview the ad."}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="relative h-40 bg-muted">
                <img
                  src={props.product.selectedProduct.image || "/placeholder.svg"}
                  alt={props.product.selectedProduct.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge className="text-[10px] px-2 py-0.5">{labels?.sponsored ?? "Sponsored"}</Badge>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <div className="text-sm font-semibold line-clamp-2">{props.title || props.product.selectedProduct.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{props.product.selectedProduct.category?.name ?? ""}</div>
                <div className="text-sm font-semibold text-primary">{props.product.selectedProduct.shown_price}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">{labels?.schedule ?? "Schedule"}</div>
          <div className="font-medium">{scheduleText || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{labels?.budget ?? "Budget"}</div>
          <div className="font-medium">{budgetText || "—"}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">{labels?.keywords ?? "Keywords"}</div>
        {keywords.length === 0 ? (
          <div className="text-sm text-muted-foreground">—</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, idx) => (
              <Badge key={`${k}-${idx}`} variant="secondary">
                {k}
              </Badge>
            ))}
            {props.targetKeywords.length > keywords.length ? (
              <Badge variant="outline" className="bg-transparent">
                +{props.targetKeywords.length - keywords.length}
              </Badge>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  )
}


