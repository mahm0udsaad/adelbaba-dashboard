"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { SidebarHeader } from "./sidebar-header"
import { SidebarNavigation } from "./sidebar-navigation"
import { UserProfile } from "./user-profile"
import { useSession } from "next-auth/react"

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleLanguage: () => void
}

export function Sidebar({ sidebarOpen, setSidebarOpen, toggleLanguage }: SidebarProps) {
  const { isArabic } = useI18n()
  const { data: session } = useSession()

  const user = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "",
    avatar: (session?.user as any)?.picture || "/placeholder.svg?height=32&width=32",
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-40 w-72 bg-[#ede5fd] border-r border-sidebar-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        isArabic && "right-0 left-auto",
      )}
    >
      <div className="flex h-screen flex-col">
        <SidebarHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleLanguage={toggleLanguage} />

        <SidebarNavigation onItemClick={() => setSidebarOpen(false)} />

        <UserProfile user={user} />
      </div>
    </aside>
  )
}
