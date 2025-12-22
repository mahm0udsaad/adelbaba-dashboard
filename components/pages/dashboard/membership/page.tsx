"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, CheckCircle, ArrowRight } from "lucide-react"
import { listCompanyPlans, getCurrentCompanyPlan, type CompanyPlan, type PlanFeature } from "@/src/services/plans-api"
import { toast } from "@/hooks/use-toast"
import { toEnglishLocaleString, toEnglishLocaleDateString } from "@/lib/utils"

type SubscriptionStatus = "active" | "expired" | "pending" | string

interface MembershipData {
  currentPlan: {
    name: string
    level?: string
    badge?: string
    color?: string
    status?: SubscriptionStatus
    startedAt?: string
    expiresAt?: string
    features: PlanFeature[]
    progress?: number
  }
  plans: CompanyPlan[]
  benefits?: {
    totalSales: number
    totalOrders: number
    responseRate: number
    customerSatisfaction: number
  }
  achievements?: Array<{
    id: string
    title: string
    titleAr?: string
    description?: string
    descriptionAr?: string
    icon?: string
    earned?: boolean
    progress?: number
  }>
}

export default function MembershipPage() {
  const [membershipData, setMembershipData] = useState<MembershipData>({
    currentPlan: {
      name: "",
      level: "",
      badge: "",
      color: "",
      features: [],
      progress: 0,
    },
    plans: [],
    benefits: {
      totalSales: 0,
      totalOrders: 0,
      responseRate: 0,
      customerSatisfaction: 0,
    },
    achievements: [],
  })
  const [loading, setLoading] = useState(true)
  const [language] = useState<"en" | "ar">("en")

  useEffect(() => {
    fetchMembershipData()
  }, [])

  const fetchMembershipData = async () => {
    try {
      setLoading(true)
      const [plans, current] = await Promise.all([
        listCompanyPlans(),
        getCurrentCompanyPlan(),
      ])

      setMembershipData({
        currentPlan: {
          name: current?.plan?.name || "",
          level: current?.plan?.level,
          badge: current?.plan?.badge,
          color: current?.plan?.color,
          status: (current?.status as any) || undefined,
          startedAt: (current as any)?.started_at || (current as any)?.startedAt || undefined,
          expiresAt: (current as any)?.expires_at || (current as any)?.expiresAt || undefined,
          features: current?.plan?.features || [],
          progress: 0,
        },
        plans: plans || [],
        benefits: { totalSales: 0, totalOrders: 0, responseRate: 0, customerSatisfaction: 0 },
        achievements: [],
      } as any)
    } catch (error) {
      console.error("Error fetching membership data:", error)
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل في تحميل بيانات العضوية" : "Failed to load membership data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isArabic = language === "ar"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!membershipData || !Array.isArray(membershipData.plans) || membershipData.plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          {isArabic ? "فشل في تحميل بيانات العضوية" : "Failed to load membership data"}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{isArabic ? "العضوية" : "Membership"}</h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة خطة العضوية والاستفادة من المزايا المتقدمة"
              : "Manage your membership plan and unlock advanced benefits"}
          </p>
        </div>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>{membershipData.currentPlan?.name || (isArabic ? "الخطة الحالية" : "Current Plan")}</span>
                  {membershipData.currentPlan?.badge && (
                    <Badge variant="secondary" className={membershipData.currentPlan?.color || "text-yellow-600"}>
                      {membershipData.currentPlan?.badge}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {membershipData.currentPlan?.status && (
                    <Badge
                      className={
                        membershipData.currentPlan.status === "active"
                          ? "bg-green-100 text-green-700"
                          : membershipData.currentPlan.status === "expired"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {membershipData.currentPlan.status}
                    </Badge>
                  )}
                  {membershipData.currentPlan?.startedAt && (
                    <span>
                      {isArabic ? "البدء:" : "Start:"} {toEnglishLocaleDateString(membershipData.currentPlan.startedAt)}
                    </span>
                  )}
                  {membershipData.currentPlan?.expiresAt && (
                    <span>
                      {isArabic ? "الانتهاء:" : "Expires:"} {toEnglishLocaleDateString(membershipData.currentPlan.expiresAt)}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button>
              {membershipData.currentPlan?.status === "active"
                ? isArabic ? "ترقية الخطة" : "Upgrade Plan"
                : isArabic ? "تجديد الخطة" : "Renew Plan"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {isArabic ? "ميزات الخطة الحالية" : "Current plan features"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(membershipData.currentPlan.features || []).map((feature) => (
                <div key={feature.key} className="flex items-center gap-2">
                  {feature.type === "bool" ? (
                    <CheckCircle className={`h-4 w-4 ${feature.value_bool ? "text-green-500" : "text-muted-foreground"}`} />
                  ) : (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">{feature.type === "int" ? "#" : feature.type === "decimal" ? "$" : "i"}</span>
                  )}
                  <span className="text-sm">
                    {feature.name}
                    {feature.type === "int" && typeof feature.value_int === "number" && `: ${feature.value_int}`}
                    {feature.type === "decimal" && typeof feature.value_decimal === "number" && `: ${feature.value_decimal}`}
                    {feature.type === "string" && feature.value_string && `: ${feature.value_string}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">{isArabic ? "الخطط" : "Plans"}</TabsTrigger>
          <TabsTrigger value="achievements">{isArabic ? "الإنجازات" : "Achievements"}</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(membershipData.plans || []).map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? "ring-2 ring-primary" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      {isArabic ? "الأكثر شعبية" : "Most Popular"}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  {plan.badge && <div className="text-4xl mb-2">{plan.badge}</div>}
                  <CardTitle className={plan.color}>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${toEnglishLocaleString(plan.price)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.period || plan.payment_rate || "period"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(plan.features || []).map((feature) => (
                      <div key={feature.key} className="flex items-center gap-2">
                        {feature.type === "bool" ? (
                          <CheckCircle className={`h-4 w-4 ${feature.value_bool ? "text-green-500" : "text-muted-foreground"}`} />
                        ) : (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">{feature.type === "int" ? "#" : feature.type === "decimal" ? "$" : "i"}</span>
                        )}
                        <span className="text-sm">
                          {feature.name}
                          {feature.type === "int" && typeof feature.value_int === "number" && `: ${feature.value_int}`}
                          {feature.type === "decimal" && typeof feature.value_decimal === "number" && `: ${feature.value_decimal}`}
                          {feature.type === "string" && feature.value_string && `: ${feature.value_string}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    variant={plan.level === membershipData.currentPlan?.level ? "secondary" : "default"}
                    disabled={plan.level === membershipData.currentPlan?.level}
                  >
                    {plan.level === membershipData.currentPlan?.level
                      ? isArabic
                        ? "الخطة الحالية"
                        : "Current Plan"
                      : isArabic
                        ? "اختر هذه الخطة"
                        : "Choose Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(membershipData.achievements || []).map((achievement) => (
              <Card key={achievement.id} className={achievement.earned ? "bg-green-50 border-green-200" : ""}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {isArabic ? achievement.titleAr : achievement.title}
                        {achievement.earned && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </CardTitle>
                      <CardDescription>
                        {isArabic ? achievement.descriptionAr : achievement.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {!achievement.earned && (
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{isArabic ? "التقدم" : "Progress"}</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <Progress value={achievement.progress} className="h-2" />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
