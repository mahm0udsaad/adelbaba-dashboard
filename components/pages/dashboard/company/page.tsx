"use client"

import { useState, useCallback, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { companyApi, CompanyContact, FactoryImage } from "@/src/services/company-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import { LogoUpload } from "./components/LogoUpload"
import { ContactsManager } from "./components/ContactsManager"
import { FactoryGallery } from "./components/FactoryGallery"
import { useCompany } from "@/src/hooks/use-company"
import { Separator } from "@/components/ui/separator"

export default function CompanyProfilePage() {
  const { t } = useI18n()
  const { company, isLoading: companyLoading, refreshCompany: refetchCompany } = useCompany()
  
  const [description, setDescription] = useState("")
  const [logo, setLogo] = useState<File | undefined>()
  const [contacts, setContacts] = useState<CompanyContact[]>([])
  
  const [factoryImages, setFactoryImages] = useState<FactoryImage[]>([])
  const [factoryLoading, setFactoryLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form with company data
  useEffect(() => {
    if (company) {
      setDescription(company.description || "")
      // Map company contacts if they exist in the company object
      if ((company as any).contacts && Array.isArray((company as any).contacts)) {
        setContacts((company as any).contacts)
      } else if (contacts.length === 0) {
        setContacts([{ phone: "", email: "", is_primary: true }])
      }
    }
  }, [company])

  const fetchFactoryImages = useCallback(async () => {
    try {
      setFactoryLoading(true)
      const res = await companyApi.getFactoryImages()
      setFactoryImages(res.data)
    } catch (err) {
      console.error("Failed to fetch factory images", err)
    } finally {
      setFactoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFactoryImages()
  }, [fetchFactoryImages])

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true)
      await companyApi.updateProfile({
        logo,
        description,
        contacts
      })
      toast({ title: t.success, description: t.companyUpdated })
      await refetchCompany()
      // Clear pending file state after successful save
      setLogo(undefined)
    } catch (err) {
      toast({ 
        title: t.error, 
        description: t.failedToUpdateCompany,
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddFactoryImages = async (files: File[]) => {
    try {
      setFactoryLoading(true)
      await companyApi.updateFactoryImages({ add: files })
      toast({ title: t.success, description: t.factoryImagesUpdated })
      fetchFactoryImages()
    } catch (err) {
      toast({ 
        title: t.error, 
        description: t.failedToUpdateFactory,
        variant: "destructive" 
      })
    } finally {
      setFactoryLoading(false)
    }
  }

  const handleRemoveFactoryImage = async (id: number) => {
    try {
      setFactoryLoading(true)
      await companyApi.updateFactoryImages({ remove: [id] })
      toast({ title: t.success, description: t.factoryImagesUpdated })
      fetchFactoryImages()
    } catch (err) {
      toast({ 
        title: t.error, 
        description: t.failedToUpdateFactory,
        variant: "destructive" 
      })
    } finally {
      setFactoryLoading(false)
    }
  }

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.companyProfile}</h1>
          <p className="text-muted-foreground">{company?.name}</p>
        </div>
        <Button onClick={handleUpdateProfile} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {t.saveChanges}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Logo & Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t.basicInformation}</CardTitle>
              <CardDescription>Update your company branding and description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LogoUpload 
                currentLogoUrl={company?.logo} 
                onChange={setLogo} 
              />
              
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="description">{t.companyDescription}</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your company..."
                  className="min-h-[200px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <ContactsManager 
            contacts={contacts} 
            onChange={setContacts} 
          />
        </div>

        <div className="space-y-8">
          {/* Factory Gallery */}
          <Card>
            <CardContent className="p-6">
              <FactoryGallery 
                images={factoryImages}
                onAdd={handleAddFactoryImages}
                onRemove={handleRemoveFactoryImage}
                isUpdating={factoryLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

