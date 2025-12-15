"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { adsApi } from "@/src/services/ads-api"
import type { ProductListItem } from "@/src/services/types/product-types"

import { ProductCardPicker } from "../components/ProductCardPicker"
import { KeywordChipsInput } from "../components/KeywordChipsInput"
import { AdLivePreview } from "../components/AdLivePreview"

type AdType = "product" | "banner"

export default function AdsNewPage() {
  const router = useRouter()
  const { t } = useI18n()

  const [adType, setAdType] = useState<AdType>("product")
  const [title, setTitle] = useState("")
  const [budget, setBudget] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [targetCountries, setTargetCountries] = useState("")
  const [targetKeywords, setTargetKeywords] = useState<string[]>([])

  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null)

  const [bannerType, setBannerType] = useState<"banner" | "slideshow">("banner")
  const [bannerLocation, setBannerLocation] = useState<"header" | "footer">("header")
  const [targetUrl, setTargetUrl] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])

  const [submitting, setSubmitting] = useState(false)

  const budgetAmount = useMemo(() => Number(budget), [budget])

  const validate = () => {
    if (!title || !budget || !startDate || !endDate) {
      toast({ title: t.error, description: t.missingRequiredFields, variant: "destructive" })
      return false
    }
    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      toast({ title: t.error, description: t.missingRequiredFields, variant: "destructive" })
      return false
    }
    if (startDate && endDate && endDate < startDate) {
      toast({ title: t.error, description: t.invalidDateRange, variant: "destructive" })
      return false
    }
    if (targetKeywords.length < 3) {
      toast({ title: t.error, description: t.adsMinKeywordsHint, variant: "destructive" })
      return false
    }
    if (adType === "product" && !selectedProduct?.id) {
      toast({ title: t.error, description: t.selectProduct, variant: "destructive" })
      return false
    }
    if (adType === "banner" && mediaFiles.length === 0) {
      toast({ title: t.error, description: t.uploadAtLeastOneImage, variant: "destructive" })
      return false
    }
    return true
  }

  const handleCreate = async () => {
    if (!validate()) return

    try {
      setSubmitting(true)
      await adsApi.create({
        ad_type: adType,
        ad: {
          title,
          banner_type: adType === "banner" ? bannerType : undefined,
          banner_location: adType === "banner" ? bannerLocation : undefined,
          target_url: adType === "banner" ? targetUrl : undefined,
          starts_at: startDate,
          ends_at: endDate,
          budget_type: "daily",
          budget_amount: budgetAmount,
          target_keywords: targetKeywords.map((k) => k.trim()).filter(Boolean),
          product_id: adType === "product" ? Number(selectedProduct?.id) : undefined,
        },
        media: adType === "banner" ? mediaFiles : undefined,
      })

      toast({ title: t.adCreated, description: t.adCreatedDesc })
      router.push("/dashboard/ads")
      router.refresh()
    } catch {
      toast({ title: t.error, description: t.failedToCreateAd, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const FormContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t.adsAdTypeLabel} *</Label>
        <Tabs
          value={adType}
          onValueChange={(v) => {
            setAdType(v as AdType)
            if (v === "product") {
              setMediaFiles([])
              setTargetUrl("")
            } else {
              setSelectedProduct(null)
            }
          }}
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="product">{t.adsProductAd}</TabsTrigger>
            <TabsTrigger value="banner">{t.adsBannerAd}</TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>{t.product} *</Label>
              <ProductCardPicker
                value={selectedProduct}
                onChange={setSelectedProduct}
                disabled={submitting}
                labels={{
                  searchPlaceholder: t.adsSearchProducts,
                  clear: t.clear,
                  emptyTitle: t.adsNoProductsFound,
                  emptyHint: t.adsNoProductsHint,
                  selected: t.adsSelected,
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="banner" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.adsBannerTypeLabel} *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={bannerType === "banner" ? "default" : "outline"}
                    className={bannerType === "banner" ? "" : "bg-transparent"}
                    disabled={submitting}
                    onClick={() => setBannerType("banner")}
                  >
                    {t.adsBannerTypeBanner}
                  </Button>
                  <Button
                    type="button"
                    variant={bannerType === "slideshow" ? "default" : "outline"}
                    className={bannerType === "slideshow" ? "" : "bg-transparent"}
                    disabled={submitting}
                    onClick={() => setBannerType("slideshow")}
                  >
                    {t.adsBannerTypeSlideshow}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.adsBannerLocationLabel} *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={bannerLocation === "header" ? "default" : "outline"}
                    className={bannerLocation === "header" ? "" : "bg-transparent"}
                    disabled={submitting}
                    onClick={() => setBannerLocation("header")}
                  >
                    {t.adsLocationHeader}
                  </Button>
                  <Button
                    type="button"
                    variant={bannerLocation === "footer" ? "default" : "outline"}
                    className={bannerLocation === "footer" ? "" : "bg-transparent"}
                    disabled={submitting}
                    onClick={() => setBannerLocation("footer")}
                  >
                    {t.adsLocationFooter}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.adsTargetUrlLabel}</Label>
              <Input
                value={targetUrl}
                disabled={submitting}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>{t.adsMediaLabel} *</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                disabled={submitting}
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  const maxBytes = 5 * 1024 * 1024
                  const ok = files.filter((f) => f.size <= maxBytes)
                  if (ok.length !== files.length) {
                    toast({ title: t.error, description: t.adsMaxImageSizeHint, variant: "destructive" })
                  }
                  setMediaFiles(ok)
                }}
              />
              <p className="text-xs text-muted-foreground">{t.adsMediaHint}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>{t.campaignTitle} *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={submitting} />
      </div>

      <div className="space-y-2">
        <Label>{t.budget} *</Label>
        <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} disabled={submitting} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t.startDate} *</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={submitting} />
        </div>
        <div className="space-y-2">
          <Label>{t.endDate} *</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={submitting} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t.targetCountries}</Label>
        <Input
          value={targetCountries}
          onChange={(e) => setTargetCountries(e.target.value)}
          placeholder={t.egCountries}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.targetKeywords} *</Label>
        <KeywordChipsInput
          value={targetKeywords}
          onChange={setTargetKeywords}
          placeholder={t.egKeywords}
          disabled={submitting}
          minItemsHint={t.adsMinKeywordsHint}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleCreate} className="flex-1" disabled={submitting}>
          {submitting ? t.creating : t.createCampaign}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="bg-transparent"
          disabled={submitting}
          onClick={() => router.push("/dashboard/ads")}
        >
          {t.cancel}
        </Button>
      </div>
    </div>
  )

  const PreviewContent = (
    <AdLivePreview
      adType={adType}
      title={title}
      budgetAmount={budgetAmount}
      startDate={startDate}
      endDate={endDate}
      targetKeywords={targetKeywords}
      banner={{ bannerType, bannerLocation, targetUrl, mediaFiles }}
      product={{ selectedProduct }}
      labels={{
        preview: t.adsLivePreview,
        sponsored: t.adsSponsored,
        missingBannerMedia: t.adsUploadToPreview,
        missingProduct: t.adsSelectProductToPreview,
        schedule: t.adsSchedule,
        budget: t.adsBudgetLabel,
        keywords: t.adsKeywordsLabel,
        location: t.adsLocationLabel,
      }}
    />
  )

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" className="bg-transparent" onClick={() => router.push("/dashboard/ads")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back}
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{t.createNewAdCampaign}</h1>
            <p className="text-sm text-muted-foreground">{t.adsSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Mobile-first: tabs between details & preview */}
      <div className="lg:hidden">
        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="details">{t.details}</TabsTrigger>
            <TabsTrigger value="preview">{t.adsLivePreview}</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <Card className="p-4">{FormContent}</Card>
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            {PreviewContent}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6 items-start">
        <Card className="p-5">{FormContent}</Card>
        <div className="sticky top-4">{PreviewContent}</div>
      </div>
    </div>
  )
}


