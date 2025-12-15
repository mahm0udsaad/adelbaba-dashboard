"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useMockData } from "@/lib/mock-data-context"
import { Check, Search, Send, Users } from "lucide-react"

type MockCrmContact = {
  id: string
  name: string
  company?: string
  email: string
  phone?: string
  country?: string
  status?: "active" | "prospect" | "inactive" | string
  tags?: string[]
}

type CampaignDraft = {
  campaignName: string
  subject: string
  preheader: string
  fromName: string
  replyTo: string
  headline: string
  message: string
  ctaText: string
  ctaUrl: string
  brandColor: string
  backgroundColor: string
  includeLogo: boolean
  logoUrl: string
  footerNote: string
  selectedIds: string[]
}

const DRAFT_KEY = "adelbaba_marketing_email_campaign_draft_v1"

function safeParseDraft(raw: string | null): CampaignDraft | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CampaignDraft>
    if (!parsed || typeof parsed !== "object") return null
    return {
      campaignName: String(parsed.campaignName ?? "New Email Campaign"),
      subject: String(parsed.subject ?? ""),
      preheader: String(parsed.preheader ?? ""),
      fromName: String(parsed.fromName ?? "Adilbaba Supplier"),
      replyTo: String(parsed.replyTo ?? ""),
      headline: String(parsed.headline ?? "A special offer for you"),
      message: String(parsed.message ?? "Write your message here..."),
      ctaText: String(parsed.ctaText ?? "Shop now"),
      ctaUrl: String(parsed.ctaUrl ?? "https://"),
      brandColor: String(parsed.brandColor ?? "#2563eb"),
      backgroundColor: String(parsed.backgroundColor ?? "#f8fafc"),
      includeLogo: Boolean(parsed.includeLogo ?? true),
      logoUrl: String(parsed.logoUrl ?? "/logo-black.webp"),
      footerNote: String(parsed.footerNote ?? "You received this email because you're a customer in our CRM."),
      selectedIds: Array.isArray(parsed.selectedIds) ? (parsed.selectedIds as any[]).map(String) : [],
    }
  } catch {
    return null
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function toEmailHtml(draft: CampaignDraft) {
  const headline = escapeHtml(draft.headline).replaceAll("\n", "<br/>")
  const message = escapeHtml(draft.message).replaceAll("\n", "<br/>")
  const preheader = escapeHtml(draft.preheader)
  const ctaText = escapeHtml(draft.ctaText)
  const ctaUrl = escapeHtml(draft.ctaUrl)
  const footerNote = escapeHtml(draft.footerNote).replaceAll("\n", "<br/>")

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(draft.subject || "Email")}</title>
  </head>
  <body style="margin:0;padding:0;background:${draft.backgroundColor};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${draft.backgroundColor};padding:20px 12px; height: 100vh;">
      <tr> 
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(15,23,42,0.08);">
            ${
              draft.includeLogo
                ? `<tr><td style="padding:20px 20px 0 20px;">
                    <img src="${escapeHtml(draft.logoUrl)}" alt="Logo" style="height:28px;max-width:160px;object-fit:contain;display:block;" />
                  </td></tr>`
                : ""
            }
            <tr>
              <td style="padding:20px;">
                <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(37,99,235,0.10);color:${draft.brandColor};font-weight:600;font-size:12px;">
                  Adilbaba Updates
                </div>
                <h1 style="margin:14px 0 10px 0;font-size:22px;line-height:1.25;color:#0f172a;">${headline}</h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#334155;">${message}</p>
                <a href="${ctaUrl}" style="display:inline-block;background:${draft.brandColor};color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:12px;font-weight:700;font-size:14px;">
                  ${ctaText}
                </a>
                <hr style="border:none;border-top:1px solid rgba(15,23,42,0.08);margin:18px 0;" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  ${footerNote}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export default function MarketingEmailCampaignPage() {
  const { contacts: rawContacts } = useMockData()
  const contacts = useMemo<MockCrmContact[]>(
    () => (Array.isArray(rawContacts) ? (rawContacts as any[]).map((c) => c as MockCrmContact) : []),
    [rawContacts],
  )

  const [tab, setTab] = useState<"recipients" | "design">("recipients")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "prospect" | "inactive">("all")

  const [draft, setDraft] = useState<CampaignDraft>(() => {
    if (typeof window === "undefined") {
      return {
        campaignName: "New Email Campaign",
        subject: "",
        preheader: "",
        fromName: "Adilbaba Supplier",
        replyTo: "",
        headline: "A special offer for you",
        message: "Write your message here...",
        ctaText: "Shop now",
        ctaUrl: "https://",
        brandColor: "#2563eb",
        backgroundColor: "#f8fafc",
        includeLogo: true,
        logoUrl: "/logo-black.webp",
        footerNote: "You received this email because you're a customer in our CRM.",
        selectedIds: [],
      }
    }
    const restored = safeParseDraft(localStorage.getItem(DRAFT_KEY))
    return (
      restored ?? {
        campaignName: "New Email Campaign",
        subject: "",
        preheader: "",
        fromName: "Adilbaba Supplier",
        replyTo: "",
        headline: "A special offer for you",
        message: "Write your message here...",
        ctaText: "Shop now",
        ctaUrl: "https://",
        brandColor: "#2563eb",
        backgroundColor: "#f8fafc",
        includeLogo: true,
        logoUrl: "/logo-black.webp",
        footerNote: "You received this email because you're a customer in our CRM.",
        selectedIds: [],
      }
    )
  })

  const previewHtml = useMemo(() => toEmailHtml(draft), [draft])
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null)

  const selectedSet = useMemo(() => new Set(draft.selectedIds), [draft.selectedIds])

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contacts.filter((c) => {
      if (status !== "all" && String(c.status || "").toLowerCase() !== status) return false
      if (!q) return true
      const hay = `${c.name || ""} ${c.company || ""} ${c.email || ""} ${(c.tags || []).join(" ")}`
      return hay.toLowerCase().includes(q)
    })
  }, [contacts, search, status])

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedSet.has(String(c.id))),
    [contacts, selectedSet],
  )

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore
    }
  }, [draft])

  useEffect(() => {
    const frame = previewFrameRef.current
    if (!frame) return
    const doc = frame.contentDocument
    if (!doc) return
    doc.open()
    doc.write(previewHtml)
    doc.close()
  }, [previewHtml])

  const allFilteredSelected = filteredContacts.length > 0 && filteredContacts.every((c) => selectedSet.has(String(c.id)))

  const toggleSelectAllFiltered = () => {
    setDraft((d) => {
      const next = new Set(d.selectedIds)
      if (allFilteredSelected) {
        filteredContacts.forEach((c) => next.delete(String(c.id)))
      } else {
        filteredContacts.forEach((c) => next.add(String(c.id)))
      }
      return { ...d, selectedIds: Array.from(next) }
    })
  }

  const toggleSelectOne = (id: string) => {
    setDraft((d) => {
      const next = new Set(d.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...d, selectedIds: Array.from(next) }
    })
  }

  const canSend = selectedContacts.length > 0 && draft.subject.trim().length > 0 && draft.message.trim().length > 0

  const sendCampaign = async () => {
    if (!canSend) {
      toast({
        title: "Missing required info",
        description: "Please select recipients and fill subject + message.",
        variant: "destructive",
      })
      return
    }

    const recipients = selectedContacts.map((c) => ({ email: c.email, name: c.name }))
    const payload = {
      campaignName: draft.campaignName,
      fromName: draft.fromName,
      replyTo: draft.replyTo || undefined,
      subject: draft.subject,
      preheader: draft.preheader || undefined,
      recipients,
      html: previewHtml,
      text: `${draft.headline}\n\n${draft.message}\n\n${draft.ctaText}: ${draft.ctaUrl}`,
    }

    const id = toast.loading("Sending campaign...", { description: `Recipients: ${recipients.length}` })
    try {
      const res = await fetch("/api/marketing/email-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await res.json()) as any
      if (!res.ok || !body?.ok) throw new Error(body?.error || "Failed to send")

      toast.success("Campaign sent", { id, description: `Sent to ${body.sentCount} recipients.` })
      setTab("recipients")
    } catch (e: any) {
      toast.error("Send failed", { id, description: e?.message || "Please try again." })
    }
  }

  const resetDraft = () => {
    setDraft((d) => ({
      ...d,
      campaignName: "New Email Campaign",
      subject: "",
      preheader: "",
      headline: "A special offer for you",
      message: "Write your message here...",
      ctaText: "Shop now",
      ctaUrl: "https://",
      brandColor: "#2563eb",
      backgroundColor: "#f8fafc",
      includeLogo: true,
      logoUrl: "/logo-black.webp",
      footerNote: "You received this email because you're a customer in our CRM.",
    }))
    toast({ title: "Draft reset", description: "Email content has been reset (recipients kept)." })
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight">Email Marketing Campaign</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select recipients from CRM and design a bulk email with a live preview.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          Emails only (beta)
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="recipients" className="gap-2">
            <Users className="h-4 w-4" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Send className="h-4 w-4" />
            Design & Send
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipients" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Choose customers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, company, email, tags..."
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={status === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatus("all")}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant={status === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatus("active")}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={status === "prospect" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatus("prospect")}
                  >
                    Prospect
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filteredContacts.length}</span>{" "}
                  {filteredContacts.length === 1 ? "contact" : "contacts"} • Selected{" "}
                  <span className="font-medium text-foreground">{selectedContacts.length}</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllFiltered} disabled={filteredContacts.length === 0}>
                  {allFilteredSelected ? "Unselect all" : "Select all"}
                </Button>
              </div>

              <Separator />

              {filteredContacts.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No contacts match your search.</div>
              ) : (
                <div className="grid gap-3">
                  {filteredContacts.map((c) => {
                    const id = String(c.id)
                    const selected = selectedSet.has(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleSelectOne(id)}
                        className={cn(
                          "w-full text-left rounded-xl border p-4 transition-colors",
                          "hover:bg-accent",
                          selected ? "border-primary bg-primary/5" : "border-border bg-background",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0",
                              selected ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border",
                            )}
                            aria-hidden="true"
                          >
                            {selected ? <Check className="h-4 w-4" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{c.name}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {c.company ? `${c.company} • ` : ""}
                                  {c.email}
                                </div>
                              </div>
                              {c.status ? (
                                <Badge variant="outline" className="shrink-0">
                                  {String(c.status)}
                                </Badge>
                              ) : null}
                            </div>
                            {Array.isArray(c.tags) && c.tags.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {c.tags.slice(0, 4).map((tag) => (
                                  <Badge key={tag} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
                                {c.tags.length > 4 ? (
                                  <Badge variant="secondary">+{c.tags.length - 4}</Badge>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="button" onClick={() => setTab("design")} disabled={selectedContacts.length === 0}>
                  Continue to design
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Campaign content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label>Campaign name</Label>
                    <Input value={draft.campaignName} onChange={(e) => setDraft((d) => ({ ...d, campaignName: e.target.value }))} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Subject *</Label>
                    <Input value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} placeholder="e.g., New arrivals + special pricing" />
                  </div>

                  <div className="grid gap-2">
                    <Label>Preheader</Label>
                    <Input value={draft.preheader} onChange={(e) => setDraft((d) => ({ ...d, preheader: e.target.value }))} placeholder="Short preview text shown in inbox" />
                  </div>

                  <div className="grid gap-2">
                    <Label>Headline</Label>
                    <Input value={draft.headline} onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Message *</Label>
                    <Textarea
                      value={draft.message}
                      onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
                      rows={6}
                      placeholder="Write your email message..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>CTA text</Label>
                      <Input value={draft.ctaText} onChange={(e) => setDraft((d) => ({ ...d, ctaText: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>CTA link</Label>
                      <Input value={draft.ctaUrl} onChange={(e) => setDraft((d) => ({ ...d, ctaUrl: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Brand color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={draft.brandColor}
                          onChange={(e) => setDraft((d) => ({ ...d, brandColor: e.target.value }))}
                          className="h-10 w-14 p-1"
                        />
                        <Input value={draft.brandColor} onChange={(e) => setDraft((d) => ({ ...d, brandColor: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Background</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={draft.backgroundColor}
                          onChange={(e) => setDraft((d) => ({ ...d, backgroundColor: e.target.value }))}
                          className="h-10 w-14 p-1"
                        />
                        <Input value={draft.backgroundColor} onChange={(e) => setDraft((d) => ({ ...d, backgroundColor: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <div className="text-sm font-medium">Include logo</div>
                      <div className="text-xs text-muted-foreground">Uses your dashboard logo URL (editable)</div>
                    </div>
                    <Switch checked={draft.includeLogo} onCheckedChange={(v) => setDraft((d) => ({ ...d, includeLogo: v }))} />
                  </div>

                  {draft.includeLogo ? (
                    <div className="grid gap-2">
                      <Label>Logo URL</Label>
                      <Input value={draft.logoUrl} onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))} />
                      <div className="text-xs text-muted-foreground">Tip: you can use `/logo-black.webp` or any public image URL.</div>
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <Label>Footer note</Label>
                    <Textarea value={draft.footerNote} onChange={(e) => setDraft((d) => ({ ...d, footerNote: e.target.value }))} rows={3} />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3">
                  <div className="text-sm text-muted-foreground">
                    Recipients: <span className="font-medium text-foreground">{selectedContacts.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setTab("recipients")}>
                      Back
                    </Button>
                    <Button type="button" variant="outline" onClick={resetDraft}>
                      Reset email
                    </Button>
                    <Button type="button" className="flex-1" onClick={sendCampaign} disabled={!canSend}>
                      <Send className="h-4 w-4 mr-2" />
                      Send campaign
                    </Button>
                  </div>
                  {!canSend ? (
                    <div className="text-xs text-muted-foreground">
                      Required: at least 1 recipient + subject + message.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Live preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  This is a simplified email builder preview (safe HTML only). Real providers will add tracking + unsubscribe later.
                </div>
                <div className="rounded-xl border overflow-hidden bg-white">
                  <iframe
                    ref={previewFrameRef}
                    title="Email preview"
                    className="w-full h-[520px] bg-white"
                    sandbox="allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


