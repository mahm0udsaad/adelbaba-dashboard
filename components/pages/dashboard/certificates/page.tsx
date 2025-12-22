"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Shield, ExternalLink, Download, AlertTriangle, CheckCircle, FileText, Award } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { certificatesApi, CertificateItem } from "@/src/services/certificates"
import { toEnglishLocaleDateString } from "@/lib/utils"

interface Certificate {
  id: string
  name: string
  type: "quality" | "compliance" | "environmental"
  issuer: string
  issueDate: string
  expiryDate: string
  status: "active" | "expiring_soon" | "expired"
  certificateNumber: string
  scope: string
  documentUrl: string
  verificationUrl: string
  applicableProducts: string[]
  description: string
}

export default function CertificatesPage() {
  const { t, isArabic } = useI18n()
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [newCertificate, setNewCertificate] = useState({
    name: "",
    type: "quality",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    certificateNumber: "",
    scope: "",
    verificationUrl: "",
    applicableProducts: "",
    description: "",
  })

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const response = await certificatesApi.list()
      const items = response.data || []
      
      const mappedCertificates: Certificate[] = items.map((item: CertificateItem) => {
        const expiryDate = item.expiry_date || new Date().toISOString()
        const issueDate = item.issue_date || new Date().toISOString()
        
        const now = new Date()
        const expiry = new Date(expiryDate)
        const diffMs = expiry.getTime() - now.getTime()
        const days = diffMs / (1000 * 60 * 60 * 24)
        
        let status: Certificate["status"] = "active"
        if (expiry < now) {
          status = "expired"
        } else if (days <= 60) {
          status = "expiring_soon"
        }

        // Map numeric or string type ID to UI type
        let type: Certificate["type"] = "quality"
        if (item.type === "2" || item.type === "compliance") type = "compliance"
        if (item.type === "3" || item.type === "environmental") type = "environmental"
        
        return {
          id: String(item.id),
          name: item.name || "Certificate",
          type,
          issuer: item.issuer || "",
          issueDate,
          expiryDate,
          status,
          certificateNumber: item.certificate_number || "",
          scope: item.scope || "",
          documentUrl: item.file_url || item.document_url || "",
          verificationUrl: item.verification_url || "",
          applicableProducts: item.applicable_products || [],
          description: item.description || "",
        }
      })
      
      setAllCertificates(mappedCertificates)
    } catch (error) {
      console.error("Failed to fetch certificates:", error)
      toast({ 
        title: "Error", 
        description: isArabic ? "فشل في تحميل الشهادات" : "Failed to load certificates", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates()
  }, [])

  const certificates = useMemo(() => {
    let filtered = [...allCertificates]
    if (typeFilter !== "all") filtered = filtered.filter((cert) => cert.type === typeFilter)
    if (statusFilter !== "all") filtered = filtered.filter((cert) => cert.status === statusFilter)
    return filtered
  }, [allCertificates, typeFilter, statusFilter])

  const handleAddCertificate = async () => {
    try {
      // Basic validation
      if (
        !newCertificate.name ||
        !newCertificate.type ||
        !newCertificate.issuer ||
        !newCertificate.issueDate ||
        !newCertificate.expiryDate ||
        !newCertificate.certificateNumber ||
        !newCertificate.scope ||
        !selectedFile // Require file
      ) {
        toast({ 
            title: t.failedToAddCertificate, 
            description: isArabic ? "يرجى ملء جميع الحقول المطلوبة وتحميل الملف" : "Please fill all required fields and upload a file", 
            variant: "destructive" 
        })
        return
      }

      const applicableProducts = String(newCertificate.applicableProducts)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      // Map UI type to API ID (1, 2, 3)
      let typeId = 1
      if (newCertificate.type === "compliance") typeId = 2
      if (newCertificate.type === "environmental") typeId = 3

      await certificatesApi.create({
        name: newCertificate.name,
        certificate_type_id: typeId,
        issuer: newCertificate.issuer,
        issued_at: newCertificate.issueDate,
        expires_at: newCertificate.expiryDate,
        certificate_number: newCertificate.certificateNumber,
        scope: newCertificate.scope,
        verification_url: newCertificate.verificationUrl,
        applicable_products: applicableProducts,
        description: newCertificate.description,
        documents: [selectedFile],
      })

      await fetchCertificates() // Refresh list
      
      setShowAddDialog(false)
      setNewCertificate({
        name: "",
        type: "quality",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        certificateNumber: "",
        scope: "",
        verificationUrl: "",
        applicableProducts: "",
        description: "",
      })
      setSelectedFile(null)
      
      toast({ title: t.certificateAdded, description: t.certificateAddedDesc })
    } catch (error) {
      console.error("Failed to add certificate:", error)
      toast({ title: t.failedToAddCertificate, description: isArabic ? "تعذر إضافة الشهادة. حاول مرة أخرى." : "Could not add certificate. Please try again.", variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expiring_soon":
        return "bg-yellow-100 text-yellow-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quality":
        return <Award className="h-4 w-4" />
      case "compliance":
        return <Shield className="h-4 w-4" />
      case "environmental":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return toEnglishLocaleDateString(dateString, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.certificatesHeader}</h1>
          <p className="text-muted-foreground">{t.manageCertificates}</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.addCertificate}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.addNewCertificate}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.certificateName} *</Label>
                <Input
                  id="name"
                  value={newCertificate.name}
                  onChange={(e) => setNewCertificate({ ...newCertificate, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t.type} *</Label>
                <Select
                  value={newCertificate.type}
                  onValueChange={(value) => setNewCertificate({ ...newCertificate, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">{t.quality}</SelectItem>
                    <SelectItem value="compliance">{t.compliance}</SelectItem>
                    <SelectItem value="environmental">{t.environmental}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">{t.issuer} *</Label>
                <Input
                  id="issuer"
                  value={newCertificate.issuer}
                  onChange={(e) => setNewCertificate({ ...newCertificate, issuer: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">{t.issueDate} *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={newCertificate.issueDate}
                    onChange={(e) => setNewCertificate({ ...newCertificate, issueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">{t.expiryDate} *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newCertificate.expiryDate}
                    onChange={(e) => setNewCertificate({ ...newCertificate, expiryDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateNumber">{t.certificateNumber} *</Label>
                <Input
                  id="certificateNumber"
                  value={newCertificate.certificateNumber}
                  onChange={(e) => setNewCertificate({ ...newCertificate, certificateNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">{t.scope} *</Label>
                <Textarea
                  id="scope"
                  value={newCertificate.scope}
                  onChange={(e) => setNewCertificate({ ...newCertificate, scope: e.target.value })}
                  rows={2}
                  required
                />
              </div>

               <div className="space-y-2">
                <Label htmlFor="file">{isArabic ? "ملف الشهادة" : "Certificate File"} *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {selectedFile && <p className="text-sm text-muted-foreground">{selectedFile.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationUrl">{t.verificationUrl}</Label>
                <Input
                  id="verificationUrl"
                  type="url"
                  value={newCertificate.verificationUrl}
                  onChange={(e) => setNewCertificate({ ...newCertificate, verificationUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicableProducts">{t.applicableProductsLabel}</Label>
                <Input
                  id="applicableProducts"
                  placeholder={t.commaSeparated}
                  value={newCertificate.applicableProducts}
                  onChange={(e) => setNewCertificate({ ...newCertificate, applicableProducts: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.description}</Label>
                <Textarea
                  id="description"
                  value={newCertificate.description}
                  onChange={(e) => setNewCertificate({ ...newCertificate, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddCertificate} className="flex-1" disabled={loading}>
                  {loading ? (isArabic ? "جاري الإضافة..." : "Adding...") : (isArabic ? "إضافة الشهادة" : "Add Certificate")}
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="bg-transparent">
                  {isArabic ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allTypes}</SelectItem>
            <SelectItem value="quality">{t.quality}</SelectItem>
            <SelectItem value="compliance">{t.compliance}</SelectItem>
            <SelectItem value="environmental">{t.environmental}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatuses}</SelectItem>
            <SelectItem value="active">{t.active}</SelectItem>
            <SelectItem value="expiring_soon">{t.expiringSoon}</SelectItem>
            <SelectItem value="expired">{t.expired}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Certificates List */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.isArray(certificates) &&
            certificates.map((certificate) => (
              <Card key={certificate.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">{getTypeIcon(certificate.type)}</div>
                      <div>
                        <CardTitle className="text-lg">{certificate.name}</CardTitle>
                        <p className="text-muted-foreground">{certificate.issuer}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(certificate.status)}>
                      {certificate.status === "expiring_soon" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {isArabic
                        ? certificate.status === "active"
                          ? "نشط"
                          : certificate.status === "expiring_soon"
                            ? "ينتهي قريباً"
                            : "منتهي"
                        : certificate.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{certificate.description}</p>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "رقم الشهادة" : "Certificate Number"}:</span>
                      <span className="font-medium">{certificate.certificateNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "تاريخ الإصدار" : "Issue Date"}:</span>
                      <span>{formatDate(certificate.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "تاريخ الانتهاء" : "Expiry Date"}:</span>
                      <span>{formatDate(certificate.expiryDate)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{isArabic ? "النطاق" : "Scope"}:</p>
                    <p className="text-sm text-muted-foreground">{certificate.scope}</p>
                  </div>

                  {certificate.applicableProducts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{isArabic ? "المنتجات المطبقة" : "Applicable Products"}:</p>
                      <div className="flex flex-wrap gap-1">
                        {certificate.applicableProducts.map((product) => (
                          <Badge key={product} variant="secondary" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => certificate.documentUrl && window.open(certificate.documentUrl, '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      {t.download}
                    </Button>
                    {certificate.verificationUrl && (
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => window.open(certificate.verificationUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t.verify}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

          {(!Array.isArray(certificates) || certificates.length === 0) && !loading && (
            <div className="col-span-2">
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t.noCertificatesFound}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t.startByAddingCertificates}
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.addCertificate}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
