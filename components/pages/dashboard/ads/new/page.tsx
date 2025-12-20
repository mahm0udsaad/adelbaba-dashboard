"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { adsApi, type AdRecord } from "@/src/services/ads-api"
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
  const [createdAd, setCreatedAd] = useState<AdRecord | null>(null)

  const budgetAmount = useMemo(() => Number(budget), [budget])

  const extractErrorMessage = (err: unknown): string | undefined => {
    if (!err || typeof err !== "object") return undefined
    const maybe = err as { message?: unknown; response?: { data?: unknown } }
    const data = maybe.response?.data

    // Typical backend shapes:
    // - { message: "..." }
    // - { error: "..." }
    // - { errors: { field: ["msg"] } }
    if (data && typeof data === "object") {
      const d = data as { message?: unknown; error?: unknown; errors?: unknown }
      if (typeof d.message === "string" && d.message.trim()) return d.message
      if (typeof d.error === "string" && d.error.trim()) return d.error
      if (d.errors && typeof d.errors === "object") {
        const errorsObj = d.errors as Record<string, unknown>
        const firstKey = Object.keys(errorsObj)[0]
        const firstVal = firstKey ? errorsObj[firstKey] : undefined
        if (Array.isArray(firstVal) && typeof firstVal[0] === "string") return firstVal[0]
        if (typeof firstVal === "string") return firstVal
      }
    }

    if (typeof maybe.message === "string" && maybe.message.trim()) return maybe.message
    return undefined
  }

  const resetForm = () => {
    setCreatedAd(null)
    setAdType("product")
    setTitle("")
    setBudget("")
    setStartDate("")
    setEndDate("")
    setTargetCountries("")
    setTargetKeywords([])
    setSelectedProduct(null)
    setBannerType("banner")
    setBannerLocation("header")
    setTargetUrl("")
    setMediaFiles([])
  }

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
    if (adType === "banner" && !targetUrl.trim()) {
      toast({
        title: t.error,
        description: t.adsTargetUrlRequired || "Target URL is required for banner ads",
        variant: "destructive",
      })
      return false
    }
    if (adType === "banner" && mediaFiles.length === 0) {
      toast({ title: t.error, description: t.uploadAtLeastOneImage, variant: "destructive" })
      return false
    }
    return true
  }

  const handleCreate = async () => {
    if (submitting) return
    if (!validate()) return

    try {
      setSubmitting(true)
      const res = await adsApi.create({
        ad_type: adType,
        ad: {
          title,
          banner_type: adType === "banner" ? bannerType : undefined,
          banner_location: adType === "banner" ? bannerLocation : undefined,
          target_url: adType === "banner" ? targetUrl.trim() : undefined,
          starts_at: startDate,
          ends_at: endDate,
          budget_type: "daily",
          budget_amount: budgetAmount,
          target_keywords: targetKeywords.map((k) => k.trim()).filter(Boolean),
          product_id: adType === "product" ? Number(selectedProduct?.id) : undefined,
        },
        media: adType === "banner" ? mediaFiles : undefined,
      })

      setCreatedAd(res.ad)
    } catch (err) {
      toast({
        title: t.error,
        description: extractErrorMessage(err) || t.failedToCreateAd,
        variant: "destructive",
      })
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
              <Label className="flex items-center gap-1">
                {t.adsMediaLabel} <span className="text-destructive">*</span>
              </Label>
              <div>
                <label
                  htmlFor="media-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted p-6"
                  style={{ minHeight: 120 }}
                  tabIndex={submitting ? -1 : 0}
                >
                  <input
                    id="media-input"
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={submitting}
                    className="hidden"
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
                  <span className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 8l-4-4m4 4l4-4" />
                    </svg>
                    <span className="font-medium text-primary">{t.uploadImages || "Click or drag images to upload"}</span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG, GIF • Max 5MB each
                    </span>
                  </span>
                </label>
                {mediaFiles && mediaFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {mediaFiles.map((file, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded overflow-hidden shadow border border-muted">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          className="absolute -right-1 -top-1 bg-background border border-muted text-xs px-1 rounded-full text-destructive hover:bg-destructive hover:text-white transition"
                          disabled={submitting}
                          onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== idx))}
                          aria-label={t.remove || "Remove"}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
        <Button onClick={handleCreate} className="flex-1" disabled={submitting} aria-busy={submitting}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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

  if (createdAd) {
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

        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {t.adCreated || "Ad Created"}
            </CardTitle>
            <CardDescription>{t.adCreatedDesc || "Ad campaign has been created successfully"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">{t.campaignTitle || "Campaign"}: </span>
              <span className="font-medium">{createdAd.title}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">ID: </span>
              <span className="font-medium">{createdAd.id}</span>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button className="flex-1" onClick={() => router.push("/dashboard/ads")}>
              {t.goToAds || "Go to Ads"}
            </Button>
            <Button type="button" variant="outline" className="bg-transparent" onClick={resetForm}>
              {t.createAnother || "Create another"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

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


