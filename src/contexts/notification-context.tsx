"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import Echo from "laravel-echo"
import Pusher from "pusher-js"
import { useAuth } from "./auth-context"
import type { Notification } from "@/src/services/notifications-api"
import { notificationsApi } from "@/src/services/notifications-api"

// Extend Window type for Pusher
declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo | undefined
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  isLoading: boolean
  error: string | null
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "8fded0e8dde120743638"
const PUSHER_APP_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "eu"
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.adil-baba.com"

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { authData } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [echoInstance, setEchoInstance] = useState<Echo | null>(null)

  const unreadCount = notifications.filter((n) => !n.read_at).length

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await notificationsApi.list()
      setNotifications(response?.data ?? [])
    } catch (err) {
      console.error("Failed to load notifications", err)
      setError("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
    )
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Setup Laravel Echo and Pusher connection
  useEffect(() => {
    // Only initialize if we have a token and supplier ID
    if (!authData.token || !authData.company?.supplier?.id) {
      return
    }

    const supplierId = authData.company.supplier.id

    try {
      // Initialize Pusher
      if (typeof window !== "undefined") {
        window.Pusher = Pusher
      }

      // Create Echo instance
      const echo = new Echo({
        broadcaster: "pusher",
        key: PUSHER_APP_KEY,
        cluster: PUSHER_APP_CLUSTER,
        forceTLS: true,
        authEndpoint: `${BASE_URL}/api/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${authData.token}`,
            Accept: "application/json",
          },
        },
      })

      setEchoInstance(echo)

      if (typeof window !== "undefined") {
        window.Echo = echo
      }

      // Listen to private notifications channel
      const channel = echo.private(`suppliers.${supplierId}`)

      channel
        .listen(".notification.sent", (event: any) => {
          console.log("🔔 New notification received:", event)

          // Add new notification to the list
          if (event?.notification && event.notification.id) {
            const notification: Notification = {
              id: event.notification.id,
              type: event.notification.type || "notification",
              data: event.notification.data || {},
              read_at: event.notification.read_at || null,
              created_at: event.notification.created_at || new Date().toISOString(),
            }
            setNotifications((prev) => [notification, ...prev])
            
            // Optionally trigger a browser notification
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(notification.data?.title || "New Notification", {
                  body: notification.data?.message || "You have a new notification",
                  icon: "/LOGO FINAL.svg",
                })
              }
            }
          }
        })
        .subscribed(() => {
          console.log(`✅ Connected to suppliers.${supplierId}`)
          setIsConnected(true)
          setError(null)
        })
        .error((error: any) => {
          console.error("❌ Echo channel error:", error)
          setError("Failed to connect to notification service")
          setIsConnected(false)
        })

      // Request browser notification permission
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission()
        }
      }

      // Cleanup function
      return () => {
        try {
          echo.leave(`suppliers.${supplierId}`)
          echo.disconnect()
          setIsConnected(false)
          if (typeof window !== "undefined") {
            window.Echo = undefined
          }
        } catch (err) {
          console.error("Error cleaning up Echo connection:", err)
        }
      }
    } catch (err) {
      console.error("Failed to initialize Echo:", err)
      setError("Failed to initialize real-time notifications")
      setIsConnected(false)
    }
  }, [authData.token, authData.company?.supplier?.id])

  // Load initial notifications
  useEffect(() => {
    if (authData.token) {
      refreshNotifications()
    }
  }, [authData.token, refreshNotifications])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    clearAll,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

