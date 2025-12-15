"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { NewAdFormState } from "./types"
import { useI18n } from "@/lib/i18n/context"
import { adsApi } from "@/src/services/ads-api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import type { ProductListItem } from "@/src/services/types/product-types"
import { ProductCardPicker } from "./ProductCardPicker"
import { KeywordChipsInput } from "./KeywordChipsInput"
import { AdLivePreview } from "./AdLivePreview"

interface CreateAdDialogProps {
  onSuccess: () => Promise<void> | void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateAdDialog({ onSuccess, open, onOpenChange }: CreateAdDialogProps) {
  const { t } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open === "boolean"
  const dialogOpen = isControlled ? (open as boolean) : internalOpen
  const setDialogOpen = (value: boolean) => (isControlled ? onOpenChange?.(value) : setInternalOpen(value))
  const [newAd, setNewAd] = useState<NewAdFormState>({
    title: "",
    budget: "",
    startDate: "",
    endDate: "",
    targetCountries: "",
    targetKeywords: [],
  })
  const [adType, setAdType] = useState<"product" | "banner">("product")
  const [bannerType, setBannerType] = useState<"banner" | "slideshow">("banner")
  const [bannerLocation, setBannerLocation] = useState<"header" | "footer">("header")
  const [targetUrl, setTargetUrl] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    try {
      // Basic validation
      if (!newAd.title || !newAd.budget || !newAd.startDate || !newAd.endDate) {
        toast({ title: t.error, description: t.missingRequiredFields, variant: "destructive" })
        return
      }
      if (adType === "product" && !selectedProduct?.id) {
        toast({ title: t.error, description: t.selectProduct, variant: "destructive" })
        return
      }
      if (adType === "banner" && mediaFiles.length === 0) {
        toast({ title: t.error, description: t.uploadAtLeastOneImage, variant: "destructive" })
        return
      }
      if ((newAd.targetKeywords || []).length < 3) {
        toast({ title: t.error, description: t.adsMinKeywordsHint, variant: "destructive" })
        return
      }
      setSubmitting(true)

      const payload = {
        ad_type: adType,
        ad: {
          title: newAd.title,
          banner_type: adType === "banner" ? bannerType : undefined,
          banner_location: adType === "banner" ? bannerLocation : undefined,
          target_url: adType === "banner" ? targetUrl : undefined,
          starts_at: newAd.startDate,
          ends_at: newAd.endDate,
          budget_type: "daily" as const,
          budget_amount: parseFloat(newAd.budget),
          target_keywords: (newAd.targetKeywords || []).map((k) => k.trim()).filter(Boolean),
          product_id: adType === "product" ? Number(selectedProduct?.id) : undefined,
        },
        media: adType === "banner" ? mediaFiles : undefined,
      }

      await adsApi.create(payload)
      toast({ title: t.adCreated, description: t.adCreatedDesc })
      setDialogOpen(false)
      setNewAd({ title: "", budget: "", startDate: "", endDate: "", targetCountries: "", targetKeywords: [] })
      setMediaFiles([])
      setTargetUrl("")
      setSelectedProduct(null)
      await onSuccess()
    } catch {
      toast({ title: t.error, description: t.failedToCreateAd, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t.createAd}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t.createNewAdCampaign}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>{t.adsAdTypeLabel} *</Label>
                <Tabs
                  value={adType}
                  onValueChange={(v) => {
                    setAdType(v as any)
                    // reset type-specific state for clarity
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
                <Label htmlFor="title">{t.campaignTitle} *</Label>
                <Input id="title" value={newAd.title} onChange={(e) => setNewAd({ ...newAd, title: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">{t.budget} *</Label>
                <Input id="budget" type="number" value={newAd.budget} onChange={(e) => setNewAd({ ...newAd, budget: e.target.value })} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t.startDate} *</Label>
                  <Input id="startDate" type="date" value={newAd.startDate} onChange={(e) => setNewAd({ ...newAd, startDate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t.endDate} *</Label>
                  <Input id="endDate" type="date" value={newAd.endDate} onChange={(e) => setNewAd({ ...newAd, endDate: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetCountries">{t.targetCountries}</Label>
                <Input id="targetCountries" placeholder={t.egCountries} value={newAd.targetCountries} onChange={(e) => setNewAd({ ...newAd, targetCountries: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>{t.targetKeywords} *</Label>
                <KeywordChipsInput
                  value={newAd.targetKeywords}
                  disabled={submitting}
                  placeholder={t.egKeywords}
                  minItemsHint={t.adsMinKeywordsHint}
                  onChange={(next) => setNewAd({ ...newAd, targetKeywords: next })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} className="flex-1" disabled={submitting}>
                  {submitting ? t.creating : t.createCampaign}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-transparent" disabled={submitting}>
                  {t.cancel}
                </Button>
              </div>
            </div>

            <div className="lg:sticky lg:top-2 h-fit">
              <AdLivePreview
                adType={adType}
                title={newAd.title}
                budgetAmount={Number(newAd.budget)}
                startDate={newAd.startDate}
                endDate={newAd.endDate}
                targetKeywords={newAd.targetKeywords}
                banner={{
                  bannerType,
                  bannerLocation,
                  targetUrl,
                  mediaFiles,
                }}
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


