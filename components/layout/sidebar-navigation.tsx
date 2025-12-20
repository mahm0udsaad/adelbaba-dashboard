"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  Boxes,
  Crown,
  BarChart3,
  Users,
  Megaphone,
  Mail,
  Award,
  MessageSquare,
  Settings,
  DollarSign,
  Wallet,
  Truck,
  AlertOctagon,
  Building2,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, key: "dashboard" as const, href: "/dashboard" },
  { icon: Building2, key: "companyProfile" as const, href: "/dashboard/company" },
  { icon: FileText, key: "rfqs" as const, href: "/dashboard/rfq" },
  { icon: DollarSign, key: "quotes" as const, href: "/dashboard/quotes" },
  { icon: ShoppingCart, key: "orders" as const, href: "/dashboard/orders" },
  { icon: AlertOctagon, key: "disputes" as const, href: "/dashboard/disputes" },
  { icon: Package, key: "products" as const, href: "/dashboard/products" },
  { icon: Boxes, key: "inventory" as const, href: "/dashboard/inventory" },
  { icon: Crown, key: "membership" as const, href: "/dashboard/membership" },
  { icon: BarChart3, key: "analytics" as const, href: "/dashboard/analytics" },
  { icon: Wallet, key: "wallet" as const, href: "/dashboard/wallet" },
  { icon: Truck, key: "shipments" as const, href: "/dashboard/shipments" },
  { icon: Users, key: "crm" as const, href: "/dashboard/crm" },
  { icon: Megaphone, key: "ads" as const, href: "/dashboard/ads" },
  { icon: Mail, key: "marketing" as const, href: "/dashboard/marketing" },
  { icon: Award, key: "certificates" as const, href: "/dashboard/certificates" },
  { icon: MessageSquare, key: "inbox" as const, href: "/dashboard/inbox" },
  { icon: Settings, key: "tools" as const, href: "/dashboard/tools" },
]

interface SidebarNavigationProps {
  onItemClick: () => void
}

export function SidebarNavigation({ onItemClick }: SidebarNavigationProps) {
  const { t } = useI18n()
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto space-y-1 p-6">
      {sidebarItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={onItemClick}
          >
            <Icon className="h-5 w-5" />
            {t[item.key]}
          </Link>
        )
      })}
    </nav>
  )
}
