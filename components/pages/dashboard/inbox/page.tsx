"use client"

import { useCallback, useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Mail,
  MailOpen,
  Reply,
  Forward,
  Archive,
  Star,
  Clock,
  AlertCircle,
  Paperclip,
  Send,
  ArrowLeft,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { useMockData } from "@/lib/mock-data-context"
import { useApiWithFallback } from "@/hooks/useApiWithFallback"
import { inboxApi } from "@/src/services/inbox-api"

interface Message {
  id: string
  subject: string
  from: {
    name: string
    company: string
    email: string
    avatar: string
  }
  to: {
    name: string
    email: string
  }
  status: "unread" | "read" | "replied" | "urgent"
  priority: "high" | "medium" | "low"
  category: "inquiry" | "order" | "support" | "general"
  createdAt: string
  lastReply: string
  messages: Array<{
    id: string
    content: string
    sender: "buyer" | "supplier"
    timestamp: string
    attachments: Array<{ name: string; size: string; type: string }>
  }>
  tags: string[]
}

function InboxContent() {
  const { t, isArabic } = useI18n()
  const { messages: allMessages, setMessages: setAllMessages } = useMockData()
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [replyText, setReplyText] = useState("")
  
  const searchParams = useSearchParams()
  const threadId = searchParams?.get("id")

  // Map API thread summary to UI message card model
  const mapSummaryToUiMessage = useCallback((s: any): Message => {
    const status = ["unread", "read", "replied", "urgent"].includes(String(s?.status))
      ? (s.status as Message["status"]) : "read"
    const priority = ["high", "medium", "low"].includes(String(s?.priority))
      ? (s.priority as Message["priority"]) : "medium"
    const category = ["inquiry", "order", "support", "general"].includes(String(s?.category))
      ? (s.category as Message["category"]) : "general"
    const created = s?.created_at || new Date().toISOString()
    const last = s?.last_reply_at || created
    return {
      id: String(s?.id ?? ""),
      subject: s?.subject || t?.inquiry || "Conversation",
      from: {
        name: s?.from_name || "Buyer",
        company: s?.from_company || "",
        email: s?.from_email || "",
        avatar: s?.avatar_url || "/placeholder.svg",
      },
      to: {
        name: "Supplier Team",
        email: "supplier@adelbaba.com",
      },
      status,
      priority,
      category,
      createdAt: created,
      lastReply: last,
      messages: [],
      tags: Array.isArray(s?.tags) ? (s.tags as string[]) : [],
    }
  }, [t])

  const fetchThreads = useCallback(async (): Promise<Message[]> => {
    try {
      const rows = await inboxApi.list({ per_page: 50 })
      return (rows || []).map(mapSummaryToUiMessage)
    } catch (err) {
      console.error("Failed to fetch threads:", err)
      return []
    }
  }, [mapSummaryToUiMessage])

  const fallbackThreads = useCallback(async (): Promise<Message[]> => {
    return []
  }, [])

  const { data: apiThreads, loading } = useApiWithFallback<Message[]>({
    fetcher: fetchThreads,
    fallback: fallbackThreads,
    deps: [],
  })

  // Auto-select thread from URL
  useEffect(() => {
    if (threadId && apiThreads && apiThreads.length > 0) {
      const match = apiThreads.find((t) => t.id === threadId)
      if (match) setSelectedMessage(match)
    }
  }, [threadId, apiThreads])

  const filtered = useMemo(() => {
    const base = (apiThreads && apiThreads.length > 0) ? apiThreads : (allMessages as Message[])
    let filteredMessages = [...base]
    if (searchTerm) {
      filteredMessages = filteredMessages.filter(
        (message) =>
          message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.from.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }
    if (statusFilter !== "all") {
      filteredMessages = filteredMessages.filter((message) => message.status === statusFilter)
    }
    if (categoryFilter !== "all") {
      filteredMessages = filteredMessages.filter((message) => message.category === categoryFilter)
    }
    return filteredMessages
  }, [apiThreads, allMessages, searchTerm, statusFilter, categoryFilter])

  // keep local state for selection/grid mapping
  useEffect(() => {
    setMessages(filtered)
  }, [filtered])

  // When a thread is opened, fetch its messages and mark as read
  useEffect(() => {
    if (!selectedMessage) return
    const idStr = String(selectedMessage.id)
    if (!idStr || idStr.startsWith("msg-")) return

    let cancelled = false
    setChatLoading(true)
    ;(async () => {
      try {
        const apiMsgs = await inboxApi.getMessages(selectedMessage.id)
        if (cancelled) return
        const mapped = (apiMsgs || []).map((m: any) => ({
          id: String(m.id),
          content: String(m.content || ""),
          sender: (m.sender === "supplier" ? "supplier" : "buyer") as const,
          timestamp: String(m.timestamp || m.created_at || new Date().toISOString()),
          attachments: Array.isArray(m.attachments) ? m.attachments : [],
        }))
        setSelectedMessage((prev) =>
          prev && prev.id === selectedMessage.id
            ? { ...prev, messages: mapped, status: "read", lastReply: mapped[mapped.length - 1]?.timestamp || prev.lastReply }
            : prev,
        )
        // Update list view status to read
        setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: "read" } : m)))
        // Best-effort mark read
        try { await inboxApi.markRead(selectedMessage.id) } catch {}
      } catch (err) {
        console.error("Failed to load messages:", err)
      } finally {
        if (!cancelled) setChatLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedMessage?.id])

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return

    try {
      const newReply = {
        id: `reply-${Date.now()}`,
        content: replyText,
        sender: "supplier" as const,
        timestamp: new Date().toISOString(),
        attachments: [],
      }

      const updatedMessage = {
        ...selectedMessage,
        status: "replied" as const,
        lastReply: new Date().toISOString(),
        messages: [...selectedMessage.messages, newReply],
      }

      // Optimistically update local stores
      setAllMessages((prev) => (prev as Message[]).map((msg) => (msg.id === selectedMessage.id ? updatedMessage : msg)))
      setMessages((prev) => prev.map((msg) => (msg.id === selectedMessage.id ? { ...msg, status: "replied" } : msg)))
      setSelectedMessage(updatedMessage)

      // Send to API only for real threads
      if (!String(selectedMessage.id).startsWith("msg-")) {
        await inboxApi.sendMessage(selectedMessage.id, { type: "text", content: replyText })
      }

      toast({
        title: t.replySent,
        description: t.replySentDesc,
      })

      setReplyText("")
    } catch (error) {
      toast({
        title: t.error,
        description: t.failedToSendReply,
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread": return "bg-blue-100 text-blue-800"
      case "replied": return "bg-green-100 text-green-800"
      case "urgent": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="h-4 w-4 text-red-500" />
      case "medium": return <Clock className="h-4 w-4 text-yellow-500" />
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    } catch { return dateString }
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString(isArabic ? "ar-SA" : "en-US", {
        hour: "2-digit", minute: "2-digit",
      })
    } catch { return "" }
  }

  if (selectedMessage) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="p-4 border-b bg-card flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)} className="p-2 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedMessage.from.avatar || "/placeholder.svg"} />
              <AvatarFallback>{selectedMessage.from.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg">{selectedMessage.from.name}</h2>
              <p className="text-sm text-muted-foreground truncate">{selectedMessage.from.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(selectedMessage.status)} text-xs`} variant="secondary">
              {selectedMessage.status}
            </Badge>
            <Button variant="ghost" size="sm" className="p-2"><Star className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="p-2"><Archive className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="p-2"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {chatLoading && selectedMessage.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{t.loading}</p>
              </div>
            ) : selectedMessage.messages.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No messages in this conversation yet.</p>
              </div>
            ) : (
              selectedMessage.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.sender === "supplier" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={msg.sender === "buyer" ? selectedMessage.from.avatar : "/placeholder.svg?height=48&width=48&query=supplier"} />
                    <AvatarFallback className="text-lg">{msg.sender === "buyer" ? selectedMessage.from.name.charAt(0) : "S"}</AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[70%] ${msg.sender === "supplier" ? "text-right" : ""}`}>
                    <div className={`flex items-center gap-3 mb-3 ${msg.sender === "supplier" ? "justify-end" : ""}`}>
                      <span className="font-semibold text-sm">{msg.sender === "buyer" ? selectedMessage.from.name : "Supplier Team"}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className={`rounded-3xl px-6 py-4 shadow-sm ${msg.sender === "supplier" ? "bg-primary text-primary-foreground ml-auto" : "bg-card border"}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/20 space-y-2">
                          <p className="text-xs font-medium opacity-75">{t.attachments}:</p>
                          {msg.attachments.map((attachment) => (
                            <div key={attachment.name} className="flex items-center gap-3 p-3 rounded-xl bg-background/20 hover:bg-background/30 cursor-pointer transition-all group">
                              <div className="h-8 w-8 rounded-lg bg-background/30 flex items-center justify-center"><Paperclip className="h-4 w-4" /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.name}</p>
                                <p className="text-xs opacity-60">{attachment.size}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t bg-card shadow-lg p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                placeholder={t.writeReply}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="resize-none pr-24 text-base border-2 focus:border-primary"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" title={t.attachFile}><Paperclip className="h-4 w-4" /></Button>
                <Button onClick={handleSendReply} disabled={!replyText.trim() || chatLoading} size="sm" className="h-8 px-3">
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Reply className="h-3 w-3" />
                {isArabic ? "رد على" : "Reply to"} {selectedMessage.from.name}
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-6">
                <Forward className="h-3 w-3 mr-1" />
                {isArabic ? "إعادة توجيه" : "Forward"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.inboxHeader}</h1>
          <p className="text-muted-foreground">{t.manageInbox}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t.searchMessages} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatuses}</SelectItem>
            <SelectItem value="unread">{t.unread}</SelectItem>
            <SelectItem value="replied">{t.replied}</SelectItem>
            <SelectItem value="urgent">{t.urgent}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allCategories}</SelectItem>
            <SelectItem value="inquiry">{t.inquiry}</SelectItem>
            <SelectItem value="order">{t.orderLower}</SelectItem>
            <SelectItem value="support">{t.support}</SelectItem>
            <SelectItem value="general">{t.general}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : messages.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">{isArabic ? "لا توجد رسائل" : "No messages found"}</h3>
                <p className="text-muted-foreground">{isArabic ? "لا توجد رسائل تطابق المعايير المحددة" : "No messages match the selected criteria"}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-primary" onClick={() => setSelectedMessage(message)}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {message.status === "unread" ? <Mail className="h-4 w-4 text-blue-500" /> : <MailOpen className="h-4 w-4 text-muted-foreground" />}
                      {getPriorityIcon(message.priority)}
                      {message.status === "unread" && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <Badge className={`${getStatusColor(message.status)} text-xs`} variant="secondary">
                      {isArabic ? (message.status === "unread" ? "جديد" : message.status === "replied" ? "رد" : message.status === "urgent" ? "عاجل" : message.status) : message.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={message.from.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-sm font-medium">{message.from.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{message.from.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{message.from.company}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-2">{message.subject}</h4>
                    {message.messages && message.messages[0]?.content ? (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{message.messages[0]?.content.substring(0, 120)}...</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">{formatDate(message.lastReply).split(',')[0]}</span>
                    <div className="flex items-center gap-1">
                      {message.messages.length > 1 && <Badge variant="outline" className="text-xs px-2 py-0">{message.messages.length} msgs</Badge>}
                      {message.messages.some(msg => msg.attachments.length > 0) && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </div>
                  {message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="text-xs px-2 py-0">{tag}</Badge>)}
                      {message.tags.length > 3 && <Badge variant="outline" className="text-xs px-2 py-0">+{message.tags.length - 3}</Badge>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <InboxContent />
    </Suspense>
  )
}
