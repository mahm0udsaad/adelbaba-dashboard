"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  Edit,
  Save,
  X,
  MessageSquare,
  Video,
  Users,
} from "lucide-react"

import type { CRMContactDetail, CRMNote } from "@/src/services/crm-api"
import { crmApi } from "@/src/services/crm-api"
import { toEnglishLocaleString, toEnglishLocaleDateString } from "@/lib/utils"

// Remove local mock; details now fetched via API

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contactId = params.id as string

  const [contact, setContact] = useState<CRMContactDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [editedTags, setEditedTags] = useState("")
  const [newNote, setNewNote] = useState("")
  const [addingNote, setAddingNote] = useState(false)
  const [addingInteraction, setAddingInteraction] = useState(false)
  const [interactionType, setInteractionType] = useState("call")
  const [interactionTitle, setInteractionTitle] = useState("")
  const [interactionDetails, setInteractionDetails] = useState("")

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const data = await crmApi.getContact(contactId)
        setContact(data)
        setEditedTags((data.tags || []).join(", "))
      } catch (error) {
        setContact(null)
      } finally {
        setLoading(false)
      }
    }

    fetchContact()
  }, [contactId])

  const handleAddNote = async () => {
    if (!contact || !newNote.trim()) return
    setAddingNote(true)
    try {
      const created: CRMNote = await crmApi.addNote(contact.id, newNote.trim())
      setContact({ ...contact, notes: [created, ...(contact.notes || [])] })
      setNewNote("")
    } finally {
      setAddingNote(false)
    }
  }

  const handleEditNote = async (note: CRMNote) => {
    if (!contact) return
    const value = window.prompt("Edit note", note.note)
    if (value == null) return
    const updated = await crmApi.editNote(contact.id, note.id, value)
    setContact({
      ...contact,
      notes: (contact.notes || []).map((n) => (n.id === note.id ? updated : n)),
    })
  }

  const handleDeleteNote = async (note: CRMNote) => {
    if (!contact) return
    const confirmed = window.confirm("Delete this note?")
    if (!confirmed) return
    await crmApi.deleteNote(contact.id, note.id)
    setContact({
      ...contact,
      notes: (contact.notes || []).filter((n) => n.id !== note.id),
    })
  }

  const handleSaveTags = async () => {
    if (!contact) return
    const tags = editedTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const updated = await crmApi.updateTags(contact.id, tags)
    setContact({ ...contact, tags: updated.tags || tags })
    setIsEditingTags(false)
  }

  const handleAddInteraction = async () => {
    if (!contact || !interactionTitle.trim()) return
    setAddingInteraction(true)
    try {
      const created = await crmApi.addInteraction(contact.id, {
        interaction_type: interactionType as any,
        title: interactionTitle.trim(),
        details: interactionDetails.trim() || undefined,
      })
      setContact({ ...contact, interactions: [created, ...(contact.interactions || [])] })
      setInteractionTitle("")
      setInteractionDetails("")
    } finally {
      setAddingInteraction(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "prospect":
        return "bg-blue-100 text-blue-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "call":
        return <Phone className="h-4 w-4" />
      case "meeting":
        return <Video className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Contact not found</p>
          <Button onClick={() => router.push("/dashboard/crm")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/crm")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contact.customer.name}</h1>
            <p className="text-muted-foreground">{contact.customer.has_company && contact.customer.company_name ? contact.customer.company_name : ""}</p>
          </div>
        </div>
        {/* No discrete status in API; could infer from activity if needed */}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{contact.customer.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{contact.customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">{contact.customer.has_company && contact.customer.company_name ? contact.customer.company_name : ""}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Contact</p>
                  <p className="text-sm text-muted-foreground">{toEnglishLocaleDateString(contact.updated_at || contact.created_at || new Date().toISOString())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Orders</span>
                </div>
                <span className="text-lg font-bold">{contact.placed_orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Paid Orders</span>
                </div>
                <span className="text-lg font-bold">{contact.paid_orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Revenue</span>
                </div>
                <span className="text-lg font-bold">${toEnglishLocaleString(contact.total_spent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg. Order Value</span>
                <span className="text-lg font-bold">${toEnglishLocaleString(contact.avg_order_value)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">RFQs</span>
                <span className="text-lg font-bold">{contact.rfqs_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quotes Received</span>
                <span className="text-lg font-bold">{contact.quotes_received}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tags</CardTitle>
                {!isEditingTags ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingTags(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingTags(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveTags}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isEditingTags ? (
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Textarea
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  placeholder="Comma separated tags"
                  className="min-h-[80px]"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a new note..."
                    className="min-h-[80px]"
                  />
                  <Button size="sm" onClick={handleAddNote} disabled={addingNote}>
                    {addingNote ? "Saving..." : "Add Note"}
                  </Button>
                </div>

                <div className="space-y-2">
                  {(contact.notes || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  ) : (
                    (contact.notes || []).map((n) => (
                      <div key={n.id} className="border rounded p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                            <p className="text-xs text-muted-foreground mt-1">{toEnglishLocaleDateString(n.updated_at || n.created_at, { dateStyle: "short", timeStyle: "short" })}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditNote(n)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(n)}>
                              <X className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Interaction History</CardTitle>
              <CardDescription>Recent communications and meetings with this contact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add interaction */}
                <div className="border rounded-lg p-4">
                  <div className="grid gap-2 md:grid-cols-3">
                    <select
                      className="border rounded px-2 py-1"
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value)}
                    >
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="order">Order</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      className="border rounded px-2 py-1"
                      placeholder="Title"
                      value={interactionTitle}
                      onChange={(e) => setInteractionTitle(e.target.value)}
                    />
                    <input
                      className="border rounded px-2 py-1 md:col-span-1"
                      placeholder="Details (optional)"
                      value={interactionDetails}
                      onChange={(e) => setInteractionDetails(e.target.value)}
                    />
                  </div>
                  <div className="mt-2">
                    <Button size="sm" onClick={handleAddInteraction} disabled={addingInteraction}>
                      {addingInteraction ? "Adding..." : "Add Interaction"}
                    </Button>
                  </div>
                </div>

                {(contact.interactions || []).map((interaction) => (
                  <div key={interaction.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getInteractionIcon(interaction.interaction_type)}
                        <h4 className="font-medium">{interaction.description || interaction.interaction_type}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {interaction.interaction_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{toEnglishLocaleDateString(interaction.created_at, { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
