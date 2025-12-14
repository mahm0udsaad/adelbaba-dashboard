"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import {
  Building,
  Calendar,
  Package,
  Truck,
  Shield,
  ArrowLeft,
  Phone,
  Mail,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Send,
  FileText,
} from "lucide-react"
import Link from "next/link"
import apiClient from "@/lib/axios"
import { toast } from "@/hooks/use-toast"

interface Order {
  id: string
  buyerCompany: string
  buyerContact: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    productId: string
    productName: string
    sku: string
    qty: number
    unitPrice: number
    totalPrice: number
  }>
  currency: string
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  tradeAssurance: {
    enabled: boolean
    escrowStatus: string | null
    escrowAmount: number
    protectionPeriod: number
    releaseDate: string | null
    disputeReason?: string
    refundReason?: string
  }
  shipping: {
    carrier: string | null
    tracking: string | null
    method: string | null
    etaDays: number | null
    shippedDate: string | null
    deliveredDate: string | null
  }
  status: string
  priority: string
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  updatedAt: string
  notes: string
  attachments: string[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [language] = useState<"en" | "ar">("en")

  const [shipForm, setShipForm] = useState({
    carrier: "",
    tracking: "",
    method: "Air Freight",
  })

  const isArabic = language === "ar"

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/v1/company/orders/${params.id}`)
      const orderData = response.data.data || response.data
      
      // Map API response to frontend Order type
      setOrder({
        ...orderData,
        buyerCompany: orderData.user?.name || "Unknown Buyer",
        buyerContact: {
          name: orderData.user?.name || "Unknown",
          email: orderData.user?.email || "",
          phone: orderData.user?.phone || "",
        },
        items: orderData.items?.map((item: any) => ({
          productId: item.product?.id || item.id,
          productName: item.product?.name || "Unknown Product",
          sku: item.product?.sku || "",
          qty: item.quantity || 0,
          unitPrice: parseFloat(item.price_per_unit) || 0,
          totalPrice: (item.quantity || 0) * (parseFloat(item.price_per_unit) || 0),
        })) || [],
        currency: "USD",
        subtotal: parseFloat(orderData.total_amount) || 0,
        shippingCost: parseFloat(orderData.shipping) || 0,
        tax: parseFloat(orderData.tax) || 0,
        total: parseFloat(orderData.total_amount) || 0,
        tradeAssurance: {
          enabled: false,
          escrowStatus: null,
          escrowAmount: 0,
          protectionPeriod: 0,
          releaseDate: null,
        },
        shipping: {
          carrier: null,
          tracking: null,
          method: null,
          etaDays: null,
          shippedDate: null,
          deliveredDate: null,
        },
        status: orderData.shipment_status || orderData.status || "pending",
        priority: "normal",
        paymentStatus: orderData.payment_status || "pending",
        paymentMethod: "N/A",
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
        notes: orderData.notes || "",
        attachments: [],
        id: orderData.order_number || `#${orderData.id}`,
      })
    } catch (error) {
      console.error("Failed to fetch order:", error)
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في تحميل تفاصيل الطلب" : "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShipOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      // Update shipment status to 'shipped'
      await apiClient.patch(`/v1/company/orders/${params.id}/status`, {
        status: "shipped",
      })
      toast({
        title: isArabic ? "تم الشحن" : "Order Shipped",
        description: isArabic ? "تم تحديث حالة الطلب إلى مشحون" : "Order status updated to shipped",
      })
      setShowShipDialog(false)
      fetchOrder()
    } catch (error) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في شحن الطلب" : "Failed to ship order",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    setActionLoading(true)

    try {
      const blob = await apiClient.get(`/v1/company/orders/${params.id}/invoice`, {
        responseType: "blob",
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `invoice-${order?.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast({
        title: isArabic ? "تم التنزيل" : "Downloaded",
        description: isArabic ? "تم تنزيل الفاتورة بنجاح" : "Invoice downloaded successfully",
      })
    } catch (error) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في تنزيل الفاتورة" : "Failed to download invoice",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDelivery = async () => {
    setActionLoading(true)

    try {
      // Update shipment status to 'delivered'
      await apiClient.patch(`/v1/company/orders/${params.id}/status`, {
        status: "delivered",
      })
      toast({
        title: isArabic ? "تم تأكيد التسليم" : "Delivery Confirmed",
        description: isArabic ? "تم تأكيد تسليم الطلب" : "Order delivery has been confirmed",
      })
      fetchOrder()
    } catch (error) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في تأكيد التسليم" : "Failed to confirm delivery",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true)

    try {
      await apiClient.patch(`/v1/company/orders/${params.id}/status`, {
        status: newStatus,
      })
      toast({
        title: isArabic ? "تم التحديث" : "Updated",
        description: isArabic ? "تم تحديث حالة الطلب بنجاح" : "Order status updated successfully",
      })
      fetchOrder()
    } catch (error) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "فشل في تحديث الحالة" : "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {isArabic ? "لم يتم العثور على الطلب" : "Order not found"}
        </h2>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_payment":
        return "bg-yellow-100 text-yellow-800"
      case "in_escrow":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      case "disputed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getEscrowStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "held":
        return "bg-blue-100 text-blue-700"
      case "released":
        return "bg-green-100 text-green-700"
      case "disputed":
        return "bg-red-100 text-red-700"
      case "refunded":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isArabic ? "العودة" : "Back"}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{order.id}</h1>
            <p className="text-muted-foreground">{order.buyerCompany}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
          {order.tradeAssurance.enabled && (
            <Badge variant="outline" className={getEscrowStatusColor(order.tradeAssurance.escrowStatus)}>
              <Shield className="h-3 w-3 mr-1" />
              {order.tradeAssurance.escrowStatus?.charAt(0).toUpperCase() + order.tradeAssurance.escrowStatus?.slice(1)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {isArabic ? "عناصر الطلب" : "Order Items"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.qty} × ${item.unitPrice} = ${item.totalPrice}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{isArabic ? "المجموع الفرعي:" : "Subtotal:"}</span>
                    <span>${order.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isArabic ? "الشحن:" : "Shipping:"}</span>
                    <span>${order.shippingCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isArabic ? "الضرائب:" : "Tax:"}</span>
                    <span>${order.tax}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{isArabic ? "الإجمالي:" : "Total:"}</span>
                    <span>${order.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Assurance */}
          {order.tradeAssurance.enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {isArabic ? "الضمان التجاري" : "Trade Assurance"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">{isArabic ? "حالة الضمان:" : "Escrow Status:"}</p>
                    <Badge className={getEscrowStatusColor(order.tradeAssurance.escrowStatus)}>
                      {order.tradeAssurance.escrowStatus?.charAt(0).toUpperCase() +
                        order.tradeAssurance.escrowStatus?.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{isArabic ? "مبلغ الضمان:" : "Escrow Amount:"}</p>
                    <p className="text-lg font-bold text-primary">${order.tradeAssurance.escrowAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{isArabic ? "فترة الحماية:" : "Protection Period:"}</p>
                    <p>
                      {order.tradeAssurance.protectionPeriod} {isArabic ? "يوم" : "days"}
                    </p>
                  </div>
                  {order.tradeAssurance.releaseDate && (
                    <div>
                      <p className="text-sm font-medium">{isArabic ? "تاريخ التحرير:" : "Release Date:"}</p>
                      <p>{new Date(order.tradeAssurance.releaseDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {order.tradeAssurance.disputeReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">{isArabic ? "سبب النزاع:" : "Dispute Reason:"}</p>
                    <p className="text-sm text-red-700">{order.tradeAssurance.disputeReason}</p>
                  </div>
                )}

                {order.tradeAssurance.refundReason && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">
                      {isArabic ? "سبب الاسترداد:" : "Refund Reason:"}
                    </p>
                    <p className="text-sm text-gray-700">{order.tradeAssurance.refundReason}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {order.status === "shipped" && !order.shipping.deliveredDate && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isArabic ? "تأكيد التسليم" : "Confirm Delivery"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isArabic ? "تأكيد تسليم الطلب" : "Confirm Order Delivery"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isArabic
                              ? "هل تم تسليم الطلب بنجاح للمشتري؟"
                              : "Has the order been successfully delivered to the buyer?"}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleConfirmDelivery} disabled={actionLoading}>
                            {isArabic ? "تأكيد التسليم" : "Confirm Delivery"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {isArabic ? "معلومات الشحن" : "Shipping Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">{isArabic ? "طريقة الشحن:" : "Shipping Method:"}</p>
                  <p>{order.shipping.method || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{isArabic ? "شركة الشحن:" : "Carrier:"}</p>
                  <p>{order.shipping.carrier || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{isArabic ? "رقم التتبع:" : "Tracking Number:"}</p>
                  <p>{order.shipping.tracking || "Not available"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{isArabic ? "الوقت المتوقع للوصول:" : "Estimated Delivery:"}</p>
                  <p>{order.shipping.etaDays ? `${order.shipping.etaDays} days` : "Not specified"}</p>
                </div>
                {order.shipping.shippedDate && (
                  <div>
                    <p className="text-sm font-medium">{isArabic ? "تاريخ الشحن:" : "Shipped Date:"}</p>
                    <p>{new Date(order.shipping.shippedDate).toLocaleDateString()}</p>
                  </div>
                )}
                {order.shipping.deliveredDate && (
                  <div>
                    <p className="text-sm font-medium">{isArabic ? "تاريخ التسليم:" : "Delivered Date:"}</p>
                    <p>{new Date(order.shipping.deliveredDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {(order.status === "processing" || order.status === "pending") && !order.shipping.shippedDate && (
                <div className="mt-4">
                  <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Send className="h-4 w-4 mr-2" />
                        {isArabic ? "شحن الطلب" : "Ship Order"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{isArabic ? "شحن الطلب" : "Ship Order"}</DialogTitle>
                        <DialogDescription>
                          {isArabic ? "أدخل تفاصيل الشحن" : "Enter shipping details"}
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleShipOrder} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="carrier">{isArabic ? "شركة الشحن" : "Carrier"} *</Label>
                          <Input
                            id="carrier"
                            placeholder={isArabic ? "مثال: DHL, FedEx, UPS" : "e.g., DHL, FedEx, UPS"}
                            value={shipForm.carrier}
                            onChange={(e) => setShipForm({ ...shipForm, carrier: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tracking">{isArabic ? "رقم التتبع" : "Tracking Number"} *</Label>
                          <Input
                            id="tracking"
                            placeholder={isArabic ? "أدخل رقم التتبع" : "Enter tracking number"}
                            value={shipForm.tracking}
                            onChange={(e) => setShipForm({ ...shipForm, tracking: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="method">{isArabic ? "طريقة الشحن" : "Shipping Method"}</Label>
                          <Input
                            id="method"
                            placeholder={isArabic ? "مثال: شحن جوي، شحن بحري" : "e.g., Air Freight, Sea Freight"}
                            value={shipForm.method}
                            onChange={(e) => setShipForm({ ...shipForm, method: e.target.value })}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowShipDialog(false)}
                            className="bg-transparent"
                          >
                            {isArabic ? "إلغاء" : "Cancel"}
                          </Button>
                          <Button type="submit" disabled={actionLoading}>
                            {actionLoading
                              ? isArabic
                                ? "جاري الشحن..."
                                : "Shipping..."
                              : isArabic
                                ? "شحن الطلب"
                                : "Ship Order"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
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
                <p className="font-medium">{order.buyerCompany}</p>
                <p className="text-sm text-muted-foreground">{order.buyerContact.name}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {order.buyerContact.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {order.buyerContact.phone}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {isArabic ? "معلومات الدفع" : "Payment Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{isArabic ? "حالة الدفع:" : "Payment Status:"}</p>
                <Badge
                  className={
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }
                >
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">{isArabic ? "طريقة الدفع:" : "Payment Method:"}</p>
                <p className="text-sm text-muted-foreground">{order.paymentMethod}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {isArabic ? "الجدول الزمني" : "Timeline"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{isArabic ? "تاريخ الطلب:" : "Order Date:"}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{isArabic ? "آخر تحديث:" : "Last Updated:"}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "الإجراءات" : "Actions"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={handleDownloadInvoice}
                disabled={actionLoading}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isArabic ? "تنزيل الفاتورة" : "Download Invoice"}
              </Button>

              {order.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => handleUpdateStatus("processing")}
                  disabled={actionLoading}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {isArabic ? "بدء المعالجة" : "Start Processing"}
                </Button>
              )}

              {order.status !== "cancelled" && order.status !== "delivered" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full bg-transparent text-destructive">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {isArabic ? "إلغاء الطلب" : "Cancel Order"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{isArabic ? "إلغاء الطلب" : "Cancel Order"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {isArabic
                          ? "هل أنت متأكد من أنك تريد إلغاء هذا الطلب؟"
                          : "Are you sure you want to cancel this order?"}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUpdateStatus("cancelled")}
                        disabled={actionLoading}
                        className="bg-destructive text-destructive-foreground"
                      >
                        {isArabic ? "إلغاء الطلب" : "Cancel Order"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {order.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isArabic ? "المرفقات" : "Attachments"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.attachments.map((attachment, index) => (
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
