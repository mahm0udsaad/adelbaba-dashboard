import { NextResponse } from "next/server"

type Recipient = { email: string; name?: string }

type EmailCampaignPayload = {
  campaignName?: string
  fromName?: string
  replyTo?: string
  subject: string
  preheader?: string
  recipients: Recipient[]
  html: string
  text?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  let payload: EmailCampaignPayload
  try {
    payload = (await req.json()) as EmailCampaignPayload
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const subject = String(payload?.subject || "").trim()
  const html = String(payload?.html || "").trim()
  const recipients = Array.isArray(payload?.recipients) ? payload.recipients : []

  if (!subject) return NextResponse.json({ ok: false, error: "Subject is required" }, { status: 400 })
  if (!html) return NextResponse.json({ ok: false, error: "HTML body is required" }, { status: 400 })
  if (recipients.length === 0) return NextResponse.json({ ok: false, error: "At least 1 recipient is required" }, { status: 400 })
  if (recipients.some((r) => !r?.email || !isValidEmail(String(r.email)))) {
    return NextResponse.json({ ok: false, error: "One or more recipient emails are invalid" }, { status: 400 })
  }
  if (recipients.length > 500) {
    return NextResponse.json({ ok: false, error: "Recipient limit exceeded (max 500)" }, { status: 400 })
  }

  // NOTE: Stubbed send. Replace with real provider (SES/SendGrid/etc) later.
  // We intentionally do not log emails/content to avoid leaking PII in server logs.
  return NextResponse.json({ ok: true, sentCount: recipients.length })
}


