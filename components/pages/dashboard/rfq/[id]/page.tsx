"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Clock,
  FileText,
  Send,
  ArrowLeft,
  Phone,
  Mail,
  Truck,
  CreditCard,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { getRFQDetails, type RFQ } from "@/src/services/rfq-api"
import { createQuote, listQuotes, withdrawQuote, type QuoteListItem } from "@/src/services/quotes-api"
import { toEnglishLocaleString, toEnglishLocaleDateString } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Helper function to normalize API data for display
const normalizeRFQDetail = (rfq: RFQ): RFQ & {
  buyerCompany: string;
  buyerContact: { name: string; email: string; phone: string };
  specs: Array<{ key: string; value: string }>;
  targetQty: number;
  targetPrice: number;
  paymentTerms: string;
  deliveryTerms: string;
  leadTimeRequired: number;
  expiresAt: string;
  createdAt: string;
  attachments: string[];
  quotesCount: number;
  viewsCount: number;
} => {
  return {
    ...rfq,
    buyerCompany: rfq.buyer_company || 'Unknown Company',
    buyerContact: {
      name: rfq.buyer_contact?.name || 'Unknown Contact',
      email: rfq.buyer_contact?.email || '',
      phone: rfq.buyer_contact?.phone || '',
    },
    specs: rfq.specifications || [],
    targetQty: rfq.target_qty || 0,
    targetPrice: rfq.target_price || 0,
    paymentTerms: rfq.payment_terms || 'Not specified',
    deliveryTerms: rfq.delivery_terms || 'Not specified',
    leadTimeRequired: rfq.lead_time_required || 0,
    expiresAt: rfq.expires_at || new Date().toISOString(),
    createdAt: rfq.created_at || new Date().toISOString(),
    attachments: rfq.attachments || [],
    quotesCount: rfq.quotes_count || 0,
    viewsCount: rfq.views_count || 0,
  }
}

// Remove mock data - using real API now

export default function RFQDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [rfq, setRfq] = useState<ReturnType<typeof normalizeRFQDetail> | null>(null)
  const [userQuote, setUserQuote] = useState<QuoteListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [language] = useState<"en" | "ar">("en")

  const [quoteForm, setQuoteForm] = useState({
    message: "",
    currency: "USD",
    lead_time_days: "",
    attachments: [] as File[],
  })

  const isArabic = language === "ar"
  const showQuoteAction = searchParams.get("action") === "quote"

  useEffect(() => {
    fetchRFQ()
    fetchUserQuote()
    if (showQuoteAction) {
      setShowQuoteDialog(true)
    }
  }, [params.id])

  // Open/close the create-quote dialog when the action query changes while on the page
  useEffect(() => {
    setShowQuoteDialog(!!showQuoteAction)
  }, [showQuoteAction])

  const fetchRFQ = async () => {
    try {
      setLoading(true)
      const response = await getRFQDetails(params.id as string)
      const rfqData = 'data' in response ? response.data : response
      
      if (rfqData) {
        setRfq(normalizeRFQDetail(rfqData))
      } else {
        setRfq(null)
      }
    } catch (error) {
      console.error("Failed to fetch RFQ:", error)
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في تحميل تفاصيل الطلب" : "Failed to load RFQ details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserQuote = async () => {
    try {
      // Fetch all quotes and find the one for this RFQ
      const quotesResponse = await listQuotes({ page: 1 })
      const quote = quotesResponse.data.find((q) => q.rfq.id === Number(params.id))
      setUserQuote(quote || null)
    } catch (error) {
      console.error("Failed to fetch user quote:", error)
      // Don't show error toast as this is not critical
    }
  }

  const handleWithdraw = async () => {
    if (!userQuote) return

    try {
      await withdrawQuote(userQuote.id)
      toast({
        title: isArabic ? "تم السحب" : "Quote Withdrawn",
        description: isArabic ? "تم سحب العرض بنجاح" : "Your quote has been withdrawn successfully",
      })
      // Update local state
      setUserQuote({ ...userQuote, status: "Withdrawn", withdrawn_at: new Date().toISOString() })
    } catch (error: any) {
      console.error("Error withdrawing quote:", error)
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: error?.response?.data?.message || error?.message || (isArabic ? "فشل سحب العرض" : "Failed to withdraw quote"),
        variant: "destructive",
      })
    }
  }

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!quoteForm.message || !quoteForm.currency) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "الرسالة والعملة مطلوبة" : "Message and currency are required",
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)

    try {
      await createQuote({
        rfq_id: String(params.id),
        message: quoteForm.message,
        currency: quoteForm.currency,
        lead_time_days: quoteForm.lead_time_days ? parseInt(quoteForm.lead_time_days) : undefined,
        attachments: quoteForm.attachments,
      })

      toast({
        title: isArabic ? "تم إرسال العرض" : "Quote Submitted",
        description: isArabic ? "تم إرسال عرض السعر بنجاح" : "Your quote has been submitted successfully",
      })

      setShowQuoteDialog(false)
      // Reset form
      setQuoteForm({
        message: "",
        currency: "USD",
        lead_time_days: "",
        attachments: [],
      })
      // Refresh user quote
      fetchUserQuote()
      router.push("/dashboard/rfq")
    } catch (error: any) {
      console.error('Quote submission error:', error)
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: error?.response?.data?.message || error?.message || (isArabic ? "فشل في إرسال العرض" : "Failed to submit quote"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!rfq) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {isArabic ? "لم يتم العثور على الطلب" : "RFQ not found"}
        </h2>
      </div>
    )
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return isArabic ? "منتهي الصلاحية" : "Expired"
    if (days === 0) return isArabic ? "ينتهي اليوم" : "Expires today"
    if (days === 1) return isArabic ? "ينتهي غداً" : "Expires tomorrow"
    return isArabic ? `${days} أيام متبقية` : `${days} days left`
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/rfq">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isArabic ? "العودة" : "Back"}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{rfq.title}</h1>
            <p className="text-muted-foreground">RFQ ID: {rfq.id}</p>
          </div>
        </div>

        {rfq.status?.toLowerCase?.() === "open" && (
          <div className="flex items-center gap-2">
            {userQuote && userQuote.status === "Submitted" ? (
              // User has an active quote - show withdraw button
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {isArabic ? "سحب العرض" : "Withdraw Quote"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{isArabic ? "تأكيد السحب" : "Confirm Withdrawal"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isArabic
                        ? "هل أنت متأكد من سحب هذا العرض؟ لن تتمكن من التراجع عن هذا الإجراء."
                        : "Are you sure you want to withdraw this quote? This action cannot be undone."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWithdraw}>
                      {isArabic ? "سحب العرض" : "Withdraw Quote"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : userQuote ? (
              // User has a quote but it's not in Submitted status
              <Button variant="outline" disabled>
                <FileText className="h-4 w-4 mr-2" />
                {isArabic ? `العرض: ${userQuote.status}` : `Quote: ${userQuote.status}`}
              </Button>
            ) : (
              // No quote yet - show create button
              <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    {isArabic ? "تقديم عرض سعر" : "Create Quote"}
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isArabic ? "تقديم عرض سعر" : "Submit Quote"}</DialogTitle>
                <DialogDescription>
                  {isArabic ? "املأ التفاصيل أدناه لتقديم عرض السعر" : "Fill in the details below to submit your quote"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="message">{isArabic ? "الرسالة" : "Message"} *</Label>
                    <Textarea
                      id="message"
                      placeholder={isArabic ? "اكتب رسالتك للمشتري" : "Write your message to the buyer"}
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">{isArabic ? "العملة" : "Currency"} *</Label>
                    <Input
                      id="currency"
                      placeholder="USD"
                      value={quoteForm.currency}
                      onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead_time_days">{isArabic ? "مدة التسليم (أيام)" : "Lead Time (days)"}</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    placeholder={isArabic ? "مثال: 15" : "e.g., 15"}
                    value={quoteForm.lead_time_days}
                    onChange={(e) => setQuoteForm({ ...quoteForm, lead_time_days: e.target.value })}
                  />
                </div>

                {/* Notes field removed to match API spec */}

                <div className="space-y-2">
                  <Label htmlFor="attachments">{isArabic ? "المرفقات" : "Attachments"}</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setQuoteForm({ ...quoteForm, attachments: files as File[] })
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "الأنواع المدعومة: jpg, png, pdf, doc, docx, xls, xlsx" : "Supported types: jpg, png, pdf, doc, docx, xls, xlsx"}
                  </p>
                </div>

                {/* Display selected files */}
                {quoteForm.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{isArabic ? "الملفات المختارة:" : "Selected Files:"}</Label>
                    <div className="space-y-1">
                      {quoteForm.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newAttachments = [...quoteForm.attachments]
                              newAttachments.splice(index, 1)
                              setQuoteForm({ ...quoteForm, attachments: newAttachments })
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowQuoteDialog(false)
                      // Reset form when closing
                      setQuoteForm({
                        message: "",
                        currency: "USD",
                        lead_time_days: "",
                        attachments: [],
                      })
                    }}
                    disabled={submitting}
                    className="bg-transparent"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={submitting || !quoteForm.message || !quoteForm.currency}>
                    {submitting
                      ? isArabic
                        ? "جاري الإرسال..."
                        : "Submitting..."
                      : isArabic
                        ? "إرسال العرض"
                        : "Submit Quote"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* RFQ Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "تفاصيل الطلب" : "RFQ Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <Badge
                  className={`${rfq.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {rfq.status ? rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1) : 'Unknown'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {getTimeRemaining(rfq.expiresAt)}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {rfq.quotesCount} {isArabic ? "عروض أسعار" : "quotes"}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">{isArabic ? "الوصف" : "Description"}</h4>
                <p className="text-muted-foreground">{rfq.description}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">{isArabic ? "المواصفات المطلوبة" : "Required Specifications"}</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {rfq.specs.map((spec, index) => (
                    <div key={index} className="flex justify-between p-2 bg-muted rounded">
                      <span className="font-medium">{spec.key}:</span>
                      <span className="text-muted-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commercial Terms */}
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "الشروط التجارية" : "Commercial Terms"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{isArabic ? "الكمية المطلوبة" : "Target Quantity"}</p>
                      <p className="text-sm text-muted-foreground">{toEnglishLocaleString(rfq.targetQty)} units</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{isArabic ? "السعر المستهدف" : "Target Price"}</p>
                      <p className="text-sm text-muted-foreground">${rfq.targetPrice}/unit</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{isArabic ? "مدة التسليم المطلوبة" : "Required Lead Time"}</p>
                      <p className="text-sm text-muted-foreground">{rfq.leadTimeRequired} days</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{isArabic ? "شروط الدفع" : "Payment Terms"}</p>
                      <p className="text-sm text-muted-foreground">{rfq.paymentTerms}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{isArabic ? "شروط التسليم" : "Delivery Terms"}</p>
                      <p className="text-sm text-muted-foreground">{rfq.deliveryTerms}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{isArabic ? "الوجهة" : "Destination"}</p>
                      <p className="text-sm text-muted-foreground">{rfq.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {isArabic ? "معلومات المشتري" : "Buyer Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{rfq.buyerCompany}</p>
                <p className="text-sm text-muted-foreground">{rfq.country}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {rfq.buyerContact.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {rfq.buyerContact.phone}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFQ Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {isArabic ? "الجدول الزمني" : "Timeline"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{isArabic ? "تاريخ النشر" : "Published"}</p>
                <p className="text-sm text-muted-foreground">{toEnglishLocaleDateString(rfq.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{isArabic ? "ينتهي في" : "Expires"}</p>
                <p className="text-sm text-muted-foreground">{toEnglishLocaleDateString(rfq.expiresAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {rfq.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isArabic ? "المرفقات" : "Attachments"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rfq.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Document {index + 1}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
