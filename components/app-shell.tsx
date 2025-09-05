"use client"

import { useState, Suspense, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { BarChart3, Building2, Headphones, Menu, Users, Filter, Megaphone, Package, Shield, Star, CreditCard } from "lucide-react"

type NavItem = {
  name: string
  id: string
  href: string
  icon: any
}

const navItems: NavItem[] = [
  { name: "لوحة التحكم", id: "dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "الشركات", id: "companies", href: "/companies", icon: Building2 },
  { name: "طلبات توثيق الموردين", id: "verification-requests", href: "/admin/verification/requests", icon: Shield },
  { name: "المستخدمون", id: "users", href: "/users", icon: Users },
  { name: "تذاكر الدعم", id: "tickets", href: "/support-tickets", icon: Headphones },
  { name: "الأدوار والصلاحيات", id: "roles", href: "/roles", icon: Shield },
  { name: "الإعلانات", id: "ads", href: "/ads", icon: Megaphone },
  { name: "المنتجات", id: "products", href: "/products", icon: Package },
  { name: "الوحدات", id: "units", href: "/products/units", icon: Package },
  { name: "الخصائص", id: "variations", href: "/products/variations", icon: Package },
  { name: "الخطط", id: "plans", href: "/subscriptions/plans", icon: CreditCard },
  { name: "الميزات", id: "features", href: "/subscriptions/features", icon: Star },
]

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "لوحة التحكم", subtitle: "نظرة عامة على أداء النظام" },
  "/companies": { title: "الشركات", subtitle: "إدارة الشركات المسجلة ومعلوماتها" },
  "/admin/verification/requests": { title: "طلبات توثيق الموردين", subtitle: "إدارة طلبات توثيق الشركات والموردين" },
  "/users": { title: "المستخدمون", subtitle: "إدارة حسابات المستخدمين والأذونات" },
  "/support-tickets": { title: "تذاكر الدعم", subtitle: "التعامل مع طلبات ودعم العملاء" },
  "/roles": { title: "الأدوار والصلاحيات", subtitle: "إدارة الأدوار وتعيين الصلاحيات" },
  "/subscriptions/plans": { title: "خطط الاشتراك", subtitle: "إدارة الخطط والدفع" },
  "/subscriptions/features": { title: "ميزات الاشتراك", subtitle: "إدارة ميزات الخطط" },
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const current = useMemo(() => {
    const key = navItems.find((n) => pathname?.startsWith(n.href))?.href || "/dashboard"
    return titles[key]
  }, [pathname])

  const SidebarContent = (
    <div className="w-64 bg-white border-r border-gray-200 flex h-full flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-amber-900">Adelbaba</h1>
            <p className="text-sm text-amber-600">لوحة تحكم الإدارة</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link key={item.id} href={item.href} onClick={() => setMobileOpen(false)}>
              <div
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                    : "text-gray-700 hover:bg-amber-50 hover:text-amber-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">{SidebarContent}</aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>القائمة</SheetTitle>
          </SheetHeader>
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="text-right">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{current?.title}</h1>
                <p className="text-gray-600 text-sm md:text-base mt-0.5">{current?.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                <Filter className="h-4 w-4 ml-2" />
                تصدير
              </Button>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                إضافة جديد
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default AppShell


