"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Building,
  Warehouse,
  FileText,
  Package,
      Plus,
  Camera,
  LayoutDashboard,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useAuth } from "@/src/contexts/auth-context"
import { useCompany as useCompanyHook } from "@/src/hooks/use-company"
import { factoryMediaApi, type FactoryImage } from "@/src/services/factory-media"
import { certificatesApi, type CertificateItem, type PaginatedResponse } from "@/src/services/certificates"
import { listWarehouses, type Warehouse } from "@/src/services/inventory-api"
import BusinessProfileStep from "@/src/features/onboarding/BusinessProfileStep"
import FactoryImagesStep from "@/src/features/onboarding/FactoryImagesStep"
import CertificatesStep from "@/src/features/onboarding/CertificatesStep"
import WarehouseSetupStep from "@/src/features/onboarding/WarehouseSetupStep"
import FirstProductStep from "@/src/features/onboarding/FirstProductStep"
import { toast } from "@/components/ui/use-toast"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  required: boolean
}


interface Certificate {
  id: string
  name: string
  type: string
  issuedAt: string
  expiresAt: string
  files: File[]
}

interface CompletionStatus {
  business_profile: boolean
  factory_images: boolean
  certificates: boolean
  warehouse_setup: boolean
  first_product: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { authData, fetchCompanyData, updateAuthData } = useAuth()
  const { company, isLoading: companyLoading, error: companyError, fetchCompany, updateCompany } = useCompanyHook()
  const authCompletionStatus = authData.completionStatus
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    business_profile: false,
    factory_images: false,
    certificates: false,
    warehouse_setup: false,
    first_product: false,
  })

  const [businessProfile, setBusinessProfile] = useState({
    logo: null as File | null,
    existingLogoUrl: "" as string, // Store the existing logo URL from company data
    companyName: "",
    foundedYear: "",
    description: "",
    primaryContact: {
      fullName: "",
      phone: "",
      email: "",
      isPrimary: true,
    },
    secondaryContact: {
      phone: "",
      email: "",
      show: false,
    },
  })

  const [factoryImages, setFactoryImages] = useState<File[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)

  // Integrated API-backed state
  const [factoryImagesRemote, setFactoryImagesRemote] = useState<FactoryImage[]>([])
  const [loadingFactory, setLoadingFactory] = useState(false)
  type UploadItem = {
    id: string
    name: string
    file: File
    progress: number
    status: 'queued' | 'uploading' | 'done' | 'error' | 'canceled'
    controller: AbortController
    previewUrl: string
    errorMessage?: string
  }
  const [uploading, setUploading] = useState<UploadItem[]>([])
  const [certificatesRemote, setCertificatesRemote] = useState<CertificateItem[]>([])
  const [certificatesMeta, setCertificatesMeta] = useState<PaginatedResponse<CertificateItem>["meta"] | null>(null)
  const [certificatesLinks, setCertificatesLinks] = useState<PaginatedResponse<CertificateItem>["links"] | null>(null)
  const [certificatesPage, setCertificatesPage] = useState<number>(1)
  const [loadingCertificates, setLoadingCertificates] = useState(false)

  // Certificate dialog state
  const [certDialogOpen, setCertDialogOpen] = useState(false)
  const [savingCert, setSavingCert] = useState(false)
  const [certError, setCertError] = useState<string | null>(null)
  const [certForm, setCertForm] = useState<{ typeId: string; issuedAt: string; expiresAt: string; files: File[] }>({
    typeId: "",
    issuedAt: "",
    expiresAt: "",
    files: [],
  })

  // Fetch company data on component mount and prefill forms
  useEffect(() => {
    const loadCompanyData = async () => {
      setProfileLoading(true)
      setProfileError(null)
      
      try {
        // First try to get company data from context/localStorage
        if (company) {
          populateFormWithCompanyData(company)
        } else {
          // If no company data in context, fetch from API
          await fetchCompany()
          if (company) {
            populateFormWithCompanyData(company)
          }
        }
      } catch (error) {
        console.error("Failed to load company data:", error)
        setProfileError("Failed to load company data. You can still fill out the form manually.")
      } finally {
        setProfileLoading(false)
      }
    }

    const populateFormWithCompanyData = (companyData: any) => {
      setBusinessProfile(prev => ({
        ...prev,
        companyName: companyData.name || "",
        foundedYear: companyData.founded_year?.toString() || "",
        description: companyData.description || "",
        existingLogoUrl: companyData.logo || "", // Store the existing logo URL
        primaryContact: {
          ...prev.primaryContact,
          fullName: companyData.owner?.name || companyData.contacts?.[0]?.email?.split('@')[0] || "",
          phone: companyData.contacts?.[0]?.phone || companyData.owner?.phone || "",
          email: companyData.contacts?.[0]?.email || companyData.owner?.email || "",
        },
        secondaryContact: {
          ...prev.secondaryContact,
          phone: companyData.contacts?.[1]?.phone || "",
          email: companyData.contacts?.[1]?.email || "",
          show: !!companyData.contacts?.[1],
        }
      }))
    }

    loadCompanyData()
  }, [company, fetchCompany])

  // Load existing factory images and certificates from API
  useEffect(() => {
    const loadFactory = async () => {
      setLoadingFactory(true)
      try {
        const list = await factoryMediaApi.list()
        setFactoryImagesRemote(list)
      } catch (e) {
        console.error("Failed to load factory images", e)
      } finally {
        setLoadingFactory(false)
      }
    }
    const loadCertificates = async (page = 1) => {
      setLoadingCertificates(true)
      try {
        const resp = await certificatesApi.list(page)
        setCertificatesRemote(resp.data)
        setCertificatesMeta(resp.meta)
        setCertificatesLinks(resp.links)
        setCertificatesPage(resp.meta?.current_page || page)
        // Gate: if data present, mark certificates as complete
        if ((resp.data?.length || 0) > 0) {
          setCompletionStatus((prev) => ({ ...prev, certificates: true }))
          const current = authData.completionStatus || {
            profile_completed: false,
            shipping_configured: false,
            certificates_uploaded: false,
            first_product_added: false,
          }
          if (!current.certificates_uploaded) {
            updateAuthData({ completionStatus: { ...current, certificates_uploaded: true } })
          }
        }
      } catch (e) {
        console.error("Failed to load certificates", e)
      } finally {
        setLoadingCertificates(false)
      }
    }
    loadFactory()
    loadCertificates(1)
  }, [])

  // Sync completion status from session
  useEffect(() => {
    if (authCompletionStatus) {
      setCompletionStatus({
        business_profile: authCompletionStatus.profile_completed,
        factory_images: false,
        certificates: authCompletionStatus.certificates_uploaded,
        warehouse_setup: authCompletionStatus.warehouse_setup || false,
        first_product: authCompletionStatus.first_product_added,
      })
    }
  }, [authCompletionStatus])

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoadingWarehouses(true)
        const response = await listWarehouses()
        setWarehouses(response.data || [])
        
        // Mark warehouse_setup as complete if warehouses exist
        if (response.data && response.data.length > 0) {
          setCompletionStatus((prev) => ({ ...prev, warehouse_setup: true }))
        }
      } catch (e) {
        console.error("Failed to load warehouses", e)
      } finally {
        setLoadingWarehouses(false)
      }
    }
    loadWarehouses()
  }, [])

  const steps: OnboardingStep[] = [
    {
      id: "business_profile",
      title: "Business Profile",
      description: "Add your logo and primary contact so buyers can reach you.",
      icon: <Building className="h-6 w-6" />,
      required: true,
    },
    {
      id: "factory_images",
      title: "Factory Images",
      description: "Give buyers confidence with authentic production photos.",
      icon: <Camera className="h-6 w-6" />,
      required: false,
    },
    {
      id: "certificates",
      title: "Certificates",
      description: "Upload compliance and quality documents.",
      icon: <FileText className="h-6 w-6" />,
      required: false,
    },
    {
      id: "warehouse_setup",
      title: "Warehouse Setup",
      description: "Add your warehouse locations for inventory management.",
      icon: <Warehouse className="h-6 w-6" />,
      required: false,
    },
    {
      id: "first_product",
      title: "First Product",
      description: "Add your first product to start selling.",
      icon: <Package className="h-6 w-6" />,
      required: true,
    },
  ]

  const completedSteps = Object.values(completionStatus).filter(Boolean).length
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === "image/png" || file.type === "image/jpeg") && file.size <= 2 * 1024 * 1024) {
      setBusinessProfile((prev) => ({ 
        ...prev, 
        logo: file,
        existingLogoUrl: "" // Clear existing logo URL when new file is uploaded
      }))
    }
  }

  const handleLogoRemove = () => {
    setBusinessProfile((prev) => ({ 
      ...prev, 
      logo: null,
      existingLogoUrl: "" // Clear both new file and existing URL
    }))
  }

  const handleFactoryImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files
      .filter((file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024)
      .slice(0, 10)
    if (validFiles.length === 0) return
  
    ;(async () => {
      try {
        setLoadingFactory(true)
        
        // Prepare upload queue with controllers + previews
        const items: UploadItem[] = validFiles.map((f) => ({
          id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
          name: f.name,
          file: f,
          progress: 0,
          status: 'queued',
          controller: new AbortController(),
          previewUrl: URL.createObjectURL(f),
        }))
        setUploading(items)
  
        const CONCURRENCY = 2
        let nextIndex = 0
        const uploadedImages: FactoryImage[] = [] // Track successful uploads
        const failedUploads: string[] = [] // Track failed uploads
  
        const runNext = async (): Promise<void> => {
          const idx = nextIndex++
          if (idx >= items.length) return
          const item = items[idx]
          
          // Set uploading state
          setUploading((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: 'uploading', progress: 0 } : u)))
          
          try {
            // Upload single file
            await factoryMediaApi.update(
              { add: [item.file] },
              {
                signal: item.controller.signal,
                onUploadProgress: (e: any) => {
                  const total = e?.total || 0
                  const loaded = e?.loaded || 0
                  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0
                  setUploading((prev) => prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u)))
                },
              }
            )

            // Immediately refetch latest images to avoid flicker and ensure server truth
            try {
              const latest = await factoryMediaApi.list()
              setFactoryImagesRemote(latest)
              // Best-effort: consider this item counted as uploaded for the final toast
              if (latest && latest.length >= (factoryImagesRemote?.length || 0)) {
                uploadedImages.push({ id: item.id, file_name: item.name, url: '' } as any)
              }
            } catch (refreshErr) {
              // Non-fatal: UI still shows optimistic preview until batch ends
              console.warn('Failed to refresh factory images after upload', refreshErr)
            }

            // Mark as done
            setUploading((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: 'done', progress: 100 } : u)))

          } catch (e: any) {
            const isAbort = e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || e?.message?.includes('canceled')
            const status: UploadItem['status'] = isAbort ? 'canceled' : 'error'
            let errorMessage = ''
            
            if (!isAbort) {
              failedUploads.push(item.name)
              const data = e?.response?.data
              if (data) {
                if (typeof data === 'string') errorMessage = data
                else if (typeof data?.message === 'string') errorMessage = data.message
                else if (data?.errors) {
                  const firstKey = Object.keys(data.errors)[0]
                  const firstMsg = Array.isArray(data.errors[firstKey]) ? data.errors[firstKey][0] : String(data.errors[firstKey])
                  errorMessage = firstMsg
                }
              } else if (e?.message) {
                errorMessage = e.message
              }
            }
            
            setUploading((prev) => prev.map((u) => (u.id === item.id ? { ...u, status, errorMessage } : u)))
          } finally {
            // Only revoke preview URL for failed/canceled uploads immediately
            const currentStatus = (prev => prev.find(u => u.id === item.id)?.status)(uploading)
            if (currentStatus === 'error' || currentStatus === 'canceled') {
              URL.revokeObjectURL(item.previewUrl)
            }
            // Schedule another
            await runNext()
          }
        }
  
        // Kick off workers
        const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => runNext())
        await Promise.all(workers)
  
        // Show success message if any uploads completed successfully
        if (uploadedImages.length > 0) {
          toast({ 
            title: "Upload complete", 
            description: `Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}.`
          })
        }
        
        // Show error summary if any uploads failed
        if (failedUploads.length > 0) {
          toast({
            title: "Some uploads failed",
            description: `${failedUploads.length} image${failedUploads.length > 1 ? 's' : ''} could not be uploaded: ${failedUploads.join(', ')}`,
            variant: "destructive"
          })
        }
        
      } catch (e: any) {
        console.error("Upload process failed", e)
        let desc = "Could not upload images."
        const data = e?.response?.data
        if (data) {
          if (typeof data === "string") desc = data
          else if (typeof data?.message === "string") desc = data.message
          else if (data?.errors) {
            const firstKey = Object.keys(data.errors)[0]
            const firstMsg = Array.isArray(data.errors[firstKey]) ? data.errors[firstKey][0] : String(data.errors[firstKey])
            desc = firstMsg || desc
          }
        } else if (e?.message) {
          desc = e.message
        }
        toast({ title: "Upload failed", description: desc, variant: "destructive" })
      } finally {
        setLoadingFactory(false)
        // Clean up preview URLs for all completed uploads before clearing
        uploading.forEach(item => {
          try {
            URL.revokeObjectURL(item.previewUrl)
          } catch (e) {
            // Ignore cleanup errors
          }
        })
        setUploading([])
        // Clear the file input
        if (event.target) event.target.value = ""
      }
    })()
  }

  const removeFactoryImage = (index: number) => {
    setFactoryImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addCertificate = (certificate: Omit<Certificate, "id">) => {
    const newCert = { ...certificate, id: Date.now().toString() }
    setCertificates((prev) => [...prev, newCert])
  }

  const removeCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((cert) => cert.id !== id))
  }

  const handleStepCompletion = async (stepId: string) => {
    setIsLoading(true)
    try {
      if (stepId === "business_profile") {
        await handleBusinessProfileSave()
      } else if (stepId === "factory_images") {
        if (factoryImagesRemote.length === 0) {
          toast({ title: "No images", description: "Please upload at least one factory image or skip.", variant: "destructive" })
          setIsLoading(false)
          return
        }
      } else if (stepId === "certificates") {
        if (certificatesRemote.length === 0) {
          // Optional step; inform user but allow continue
          toast({ title: "Certificates optional", description: "You can add certificates later from the dashboard." })
        }
      } else if (stepId === "warehouse_setup") {
        // Warehouse setup is optional, but we'll check if at least one exists
        if (warehouses.length === 0) {
          toast({ 
            title: "No warehouses", 
            description: "You can add warehouses later from your dashboard.",
          })
        } else {
          const current = authData.completionStatus || {
            profile_completed: false,
            warehouse_setup: false,
            certificates_uploaded: false,
            first_product_added: false,
          }
          if (!current.warehouse_setup) {
            updateAuthData({ completionStatus: { ...current, warehouse_setup: true } })
          }
        }
      }
      // Mark step complete and advance to the next step
      setCompletionStatus((prev) => {
        const updated = { ...prev, [stepId]: true }

        // Find next incomplete step after currentStep
        const nextIndex = steps.findIndex((s, idx) => idx > currentStep && !updated[s.id as keyof CompletionStatus])
        if (nextIndex !== -1) {
          setCurrentStep(nextIndex)
        } else if (currentStep < steps.length - 1) {
          // Otherwise just advance to the next index if available
          setCurrentStep(currentStep + 1)
        }

        return updated
      })
    } catch (error) {
      console.error("Failed to complete step:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessProfileSave = async () => {
    try {
      const contacts = []
      
      // Add primary contact
      if (businessProfile.primaryContact.phone || businessProfile.primaryContact.email) {
        contacts.push({
          phone: businessProfile.primaryContact.phone || "",
          email: businessProfile.primaryContact.email || "",
          is_primary: 1,
        })
      }
      
      // Add secondary contact if enabled
      if (businessProfile.secondaryContact.show && (businessProfile.secondaryContact.phone || businessProfile.secondaryContact.email)) {
        contacts.push({
          phone: businessProfile.secondaryContact.phone || "",
          email: businessProfile.secondaryContact.email || "",
          is_primary: 0,
        })
      }

      const updateData: any = {
        name: businessProfile.companyName,
        description: businessProfile.description,
        founded_year: businessProfile.foundedYear ? parseInt(businessProfile.foundedYear) : undefined,
        logo: businessProfile.logo || undefined,
        contacts: contacts.length > 0 ? contacts : undefined,
      }

      // If both logo and existingLogoUrl are empty, we need to handle logo removal
      if (!businessProfile.logo && !businessProfile.existingLogoUrl) {
        // Add flag to remove the existing logo
        updateData.remove_logo = true
        delete updateData.logo
      }

      await updateCompany(updateData)
    } catch (error) {
      console.error("Failed to save business profile:", error)
      throw error // Re-throw to allow the calling function to handle the error
    }
  }

  const canCompleteStep = (stepId: string) => {
    switch (stepId) {
      case "business_profile":
        return (
          businessProfile.companyName.length >= 2 &&
          businessProfile.primaryContact.fullName &&
          businessProfile.primaryContact.phone &&
          businessProfile.primaryContact.email
        )
      case "warehouse_setup":
        return true // Always allow continuing, warehouses are optional
      default:
        return true
    }
  }

  const handleSkipToDashboard = () => {
    // Mark all completion status fields as true to skip onboarding
    updateAuthData({
      completionStatus: {
        profile_completed: true,
        warehouse_setup: true,
        certificates_uploaded: true,
        first_product_added: true,
      },
    })
    
    // Navigate to dashboard
    router.push("/dashboard")
  }

  const renderStepContent = () => {
    const step = steps[currentStep]

    switch (step.id) {
      case "business_profile":
        return (
          <BusinessProfileStep
            businessProfile={businessProfile}
            setBusinessProfile={setBusinessProfile}
            onLogoUpload={handleLogoUpload}
            onLogoRemove={handleLogoRemove}
          />
        )

      case "factory_images":
        return (
          <FactoryImagesStep
            factoryImages={factoryImagesRemote as any}
            uploading={uploading as any}
            loading={loadingFactory}
            onFileInputChange={handleFactoryImagesUpload}
            onRemoveOrCancel={async (img: any) => {
              if (img.__temp) {
                const u = uploading.find((x) => x.id === img.id)
                if (!u) return
                try {
                  u.controller.abort()
                  setUploading((prev) => prev.map((it) => (it.id === u.id ? { ...it, status: 'canceled' } : it)))
                  URL.revokeObjectURL(u.previewUrl)
                } catch {}
                return
              }
              try {
                setLoadingFactory(true)
                await factoryMediaApi.remove([img.id])
                const list = await factoryMediaApi.list()
                setFactoryImagesRemote(list)
                toast({ title: 'Removed', description: 'Image removed from factory gallery.' })
              } catch (e: any) {
                console.error('Remove failed', e)
                let desc = 'Could not remove image.'
                const data = e?.response?.data
                if (data) {
                  if (typeof data === 'string') desc = data
                  else if (typeof data?.message === 'string') desc = data.message
                  else if (data?.errors) {
                    const firstKey = Object.keys(data.errors)[0]
                    const firstMsg = Array.isArray(data.errors[firstKey]) ? data.errors[firstKey][0] : String(data.errors[firstKey])
                    desc = firstMsg || desc
                  }
                } else if (e?.message) {
                  desc = e.message
                }
                toast({ title: 'Remove failed', description: desc, variant: 'destructive' })
              } finally {
                setLoadingFactory(false)
              }
            }}
          />
        )

      case "certificates":
        return (
          <CertificatesStep
            items={certificatesRemote}
            meta={certificatesMeta}
            links={certificatesLinks}
            onRefresh={async (page?: number) => {
              const p = page || 1
              const resp = await certificatesApi.list(p)
              setCertificatesRemote(resp.data)
              setCertificatesMeta(resp.meta)
              setCertificatesLinks(resp.links)
              setCertificatesPage(resp.meta?.current_page || p)
            }}
            onMarkUploaded={() => {
              setCompletionStatus((prev) => ({ ...prev, certificates: true }))
              const current = authData.completionStatus || {
                profile_completed: false,
                shipping_configured: false,
                certificates_uploaded: false,
                first_product_added: false,
              }
              updateAuthData({ completionStatus: { ...current, certificates_uploaded: true } })
            }}
          />
        )

      case "warehouse_setup":
        return (
          <WarehouseSetupStep
            warehouses={warehouses}
            onWarehouseAdded={async () => {
              // Reload warehouses after adding
              try {
                setLoadingWarehouses(true)
                const response = await listWarehouses()
                setWarehouses(response.data || [])
                
                // Mark step as complete
                setCompletionStatus((prev) => ({ ...prev, warehouse_setup: true }))
              } catch (e) {
                console.error("Failed to reload warehouses", e)
              } finally {
                setLoadingWarehouses(false)
              }
            }}
            onSkip={() => {
              // Skip warehouse setup
              toast({ 
                title: "Skipped", 
                description: "You can add warehouses later from your dashboard." 
              })
            }}
            loading={loadingWarehouses}
          />
        )

      case "first_product":
        return (
          <FirstProductStep />
        )

      default:
        return null
    }
  }

  return (
    <div className="overflow-y-scroll h-screen bg-[#ede5fd] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Dashboard Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={handleSkipToDashboard}
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Welcome to Your Supplier Portal</h1>
          <p className="text-gray-600 text-lg mb-8">Let's get you set up in just a few steps</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 bg-white border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-900">Onboarding Progress</CardTitle>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span className="font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2 [&>div]:bg-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, index) => {
                  const isCompleted = completionStatus[step.id as keyof CompletionStatus]
                  const isCurrent = index === currentStep
                  const isAccessible = index <= currentStep || isCompleted

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                        isCurrent ? "bg-orange-50 border border-orange-200" : ""
                      } ${isAccessible ? "hover:bg-gray-50" : "opacity-50"}`}
                      onClick={() => isAccessible && setCurrentStep(index)}
                    >
                      <div
                        className={`transition-all duration-300 ${
                          isCompleted ? "animate-pulse" : isCurrent ? "animate-bounce" : ""
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <div
                            className={`p-1 rounded-full ${
                              isCurrent ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {step.icon}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{step.title}</p>
                        {isCompleted && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 mt-1">
                            Complete
                          </Badge>
                        )}
                        {isCurrent && !isCompleted && (
                          <Badge className="text-xs bg-orange-600 hover:bg-orange-700 mt-1">Current</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white border-gray-200 animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <div className="text-orange-600">{steps[currentStep]?.icon}</div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-gray-900">{steps[currentStep]?.title}</CardTitle>
                    <CardDescription className="text-base mt-1 text-gray-600">
                      {steps[currentStep]?.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-800">{profileError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setProfileLoading(true)
                          setProfileError(null)
                          try {
                            await fetchCompany()
                          } catch (error) {
                            setProfileError("Failed to load profile data. You can still fill out the form manually.")
                          } finally {
                            setProfileLoading(false)
                          }
                        }}
                        disabled={profileLoading}
                      >
                        {profileLoading ? "Retrying..." : "Retry"}
                      </Button>
                    </div>
                  </div>
                )}
                
                {profileLoading && !profileError && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">Loading your profile data...</p>
                  </div>
                )}
                
                {renderStepContent()}

                <div className="flex gap-4 justify-between pt-6 border-t">
                  <div>
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {!steps[currentStep].required &&
                      !completionStatus[steps[currentStep].id as keyof CompletionStatus] && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const nextStep = currentStep + 1
                            if (nextStep < steps.length) {
                              setCurrentStep(nextStep)
                            }
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Skip for now
                        </Button>
                      )}

                    <Button
                      onClick={() => handleStepCompletion(steps[currentStep].id)}
                      disabled={!canCompleteStep(steps[currentStep].id) || isLoading || profileLoading}
                      className="px-8 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isLoading ? "Saving..." : "Save & Continue"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
