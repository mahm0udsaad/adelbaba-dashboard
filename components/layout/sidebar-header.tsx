"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Globe, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { NotificationsSheet } from "./notifications-sheet"
import { useNotifications } from "@/src/contexts/notification-context"

interface SidebarHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleLanguage: () => void
}

export function SidebarHeader({ sidebarOpen, setSidebarOpen, toggleLanguage }: SidebarHeaderProps) {
  const { t, isArabic } = useI18n()
  const { unreadCount } = useNotifications()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <>
      <NotificationsSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />

      <div className="flex items-center justify-between sm:pt-0 p-6 pt-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 flex-1">
          {/* Logo Container */}
          <div className="flex flex-col items-center">
            <img
              src="/LOGO FINAL.svg"
              alt="Adelbaba Logo"
              className="size-24 object-contain"
            />

            {/* Brand Name */}
            <div className="flex-1 hidden sm:block">
              <p className="text-[10px] text-muted-foreground">Supplier Dashboard</p>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-sidebar-accent relative"
              title={t.notifications}
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center rounded-full"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="h-8 w-8 p-0 hover:bg-sidebar-accent"
              title={isArabic ? "English" : "العربية"}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="md:hidden ml-2">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </>
  )
}
