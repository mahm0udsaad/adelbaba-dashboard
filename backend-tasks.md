# Backend API Development Tasks - Adil-Baba Supplier Dashboard

## Financial Transparency & Wallet System

### Task 1: Wallet Transaction Management

Create endpoints for tracking all financial transactions with detailed breakdowns.

**Endpoints:**

- `GET /api/v1/company/wallet/transactions`

- `POST /api/v1/company/wallet/transactions`

**Requirements:**

- List all financial transactions with pagination and filtering

- Filter by date range, transaction type, status

- Show platform commission amount and percentage per transaction

- Show payment processing fees per transaction

- Show tax amounts per transaction

- Calculate running balance

- Support export to CSV/Excel

- Include order reference for each transaction

**Response should include:**

- Transaction ID, date, type (order, refund, withdrawal)

- Gross amount, commission, processing fee, tax, net amount

- Order reference number

- Payment method

- Status (pending, completed, failed)

- Running balance after transaction

---

## Analytics & Performance Tracking

### Task 2: Supplier Performance Scorecard

Build comprehensive performance metrics system.

**Endpoints:**

- `GET /api/v1/company/analytics/performance-score`

**Requirements:**

- Calculate weighted performance score (0-100)

- Track average response time to RFQs (in hours)

- Calculate order fulfillment rate (completed orders / total orders)

- Track dispute rate (disputes / total orders)

- Include historical trend data (last 30/90/365 days)

- Compare to platform average for each metric

- Identify areas for improvement

**Score Calculation:**

- Response Time: 40% weight (faster = higher score)

- Fulfillment Rate: 35% weight (higher = higher score)

- Dispute Rate: 25% weight (lower = higher score)

### Task 3: Traffic Source Analytics

Track where product views and orders originate from.

**Endpoints:**

- `GET /api/v1/company/analytics/traffic-sources`

**Requirements:**

- Track traffic by source (direct, search, social, referral, ads)

- Group by date range (daily, weekly, monthly)

- Show views, clicks, conversions per source

- Calculate conversion rate per source

- Support filtering by product, date range

### Task 4: Conversion Funnel Analytics

Track user journey from view to order.

**Endpoints:**

- `GET /api/v1/company/analytics/conversion-funnel`

**Requirements:**

- Track stages: Product View → Add to Cart → RFQ Sent → Quote Submitted → Order Created → Order Paid

- Show drop-off rate at each stage

- Calculate overall conversion rate

- Support filtering by product, date range, customer segment

- Show average time between stages

---

## Bulk Operations

### Task 5: Bulk Product Upload/Edit

Enable mass product operations via file upload.

**Endpoints:**

- `POST /api/v1/company/products/bulk-upload`

- `PUT /api/v1/company/products/bulk-edit`

- `GET /api/v1/company/products/template-download`

**Requirements for bulk-upload:**

- Accept CSV and Excel (XLSX) files

- Parse and validate all fields

- Support up to 1000 products per upload

- Handle product images via URLs or separate image upload

- Process in background job with progress tracking

- Return detailed error report for failed rows

- Support create and update operations in same file

**Requirements for bulk-edit:**

- Accept CSV/Excel with product IDs and fields to update

- Support partial updates (only specified fields)

- Validate all changes before applying

- Process in background job

- Return success/failure report

**Requirements for template-download:**

- Generate CSV/Excel template with all required columns

- Include example rows

- Add column descriptions and validation rules in header row

**File Format:**

- Columns: SKU, Product Name, Description, Category ID, Price, Stock, MOQ, Unit ID, Images (URLs), Warehouse ID, etc.

---

## Quote Templates System

### Task 6: Quote Template Management

Allow suppliers to save and reuse complex quote responses.

**Endpoints:**

- `GET /api/v1/company/quotes/templates`

- `POST /api/v1/company/quotes/templates`

- `PUT /api/v1/company/quotes/templates/{id}`

- `DELETE /api/v1/company/quotes/templates/{id}`

**Requirements:**

- Create reusable templates for quote responses

- Save template name, description, message content

- Save pricing structure (tiered, range, or SKU-based)

- Save lead time, currency, payment terms

- Support template variables (e.g., {{product_name}}, {{quantity}})

- List all templates with search and filtering

- Apply template to RFQ with auto-population

- Track template usage statistics

**Template Fields:**

- Name, description, message template

- Default currency, default lead time

- Pricing structure template

- Attachment templates

- Created/updated timestamps

---

## Shipping Document Management

### Task 7: Shipping Document Upload & Management

Allow suppliers to upload and manage their own shipping documents.

**Endpoints:**

- `POST /api/v1/company/orders/{id}/shipping-documents`

- `GET /api/v1/company/orders/{id}/shipping-documents`

- `DELETE /api/v1/company/orders/{id}/shipping-documents/{documentId}`

- `PUT /api/v1/company/shipments/{id}/tracking-info`

**Requirements:**

- Upload shipping documents (invoice, packing list, customs documents, labels)

- Support multiple file formats (PDF, images, Excel)

- Maximum file size: 10MB per document

- Allow multiple documents per order

- Tag documents by type (invoice, packing_list, label, customs, other)

- Store documents securely with access control

- Allow document download for buyer and supplier

- Track document upload timestamp

**For tracking-info endpoint:**

- Update tracking number manually

- Update shipping company name

- Update estimated delivery date

- Add shipping notes

- These fields already exist in shipments table, just need update capability

**Request Body for document upload:**

- document (file)

- document_type (enum: invoice, packing_list, label, customs, other)

- notes (optional)

**Response:**

- Document ID

- File name

- Document type

- Upload timestamp

- Download URL

- Uploaded by (user info)

---

## Enhanced Dispute Management

### Task 8: Dispute Response System

Complete the dispute resolution workflow.

**Endpoints:**

- `POST /api/v1/company/disputes/{id}/respond`

- `POST /api/v1/company/disputes/{id}/accept`

- `POST /api/v1/company/disputes/{id}/reject`

- `POST /api/v1/company/disputes/{id}/counter-offer`

- `GET /api/v1/company/disputes/{id}/timeline`

**Requirements for /respond:**

- Submit response message to dispute

- Upload evidence files (images, documents, videos)

- Set response type (explanation, counter-offer, acceptance, rejection)

**Requirements for /accept:**

- Accept buyer's dispute terms

- Process refund if applicable

- Close dispute automatically

- Notify buyer

**Requirements for /reject:**

- Reject dispute with reason

- Escalate to platform review automatically

- Notify buyer and platform admin

**Requirements for /counter-offer:**

- Propose alternative resolution (partial refund, replacement, store credit)

- Set expiry time for counter-offer

- Notify buyer

**Requirements for /timeline:**

- Show chronological history of dispute

- Include all messages, evidence, status changes

- Show who took each action and when

- Track platform admin interventions

---

## Certificate Verification Enhancement

### Task 9: Certificate Verification Workflow

Add verification status management for certificates.

**Endpoints:**

- `PUT /api/v1/company/certificates/{id}/verify-status`

- `GET /api/v1/company/certificates/verification-badge`

**Requirements:**

- Update certificate verification status (pending, verified, rejected)

- Add verification date and verified_by admin info

- Add rejection reason if rejected

- Return badge/icon URL based on verification status

- Show verification status on certificate list

- Filter certificates by verification status

**Status Flow:**

- Pending → Under Review → Verified/Rejected

- Allow re-submission if rejected

---

## Inventory Forecasting

### Task 10: Predictive Inventory Analytics

Build forecasting system for stock management.

**Endpoints:**

- `GET /api/v1/company/inventory/forecast`

**Requirements:**

- Analyze sales history (last 90 days minimum)

- Calculate average daily/weekly/monthly sales per SKU

- Factor in seasonality if applicable

- Calculate reorder point based on lead time

- Suggest restock quantity based on sales velocity

- Show days until stockout at current rate

- Support filtering by warehouse, product category

- Include confidence level for predictions

**Response includes:**

- SKU details

- Current stock level

- Average daily sales

- Forecasted demand (next 30/60/90 days)

- Recommended reorder point

- Recommended restock quantity

- Days until stockout

- Confidence level (low, medium, high)

---

## Custom Order Pipeline

### Task 11: Configurable Order Workflow

Allow suppliers to customize order stages.

**Endpoints:**

- `GET /api/v1/company/orders/pipeline/stages`

- `POST /api/v1/company/orders/pipeline/configure`

- `PUT /api/v1/company/orders/pipeline/stages/{id}`

- `DELETE /api/v1/company/orders/pipeline/stages/{id}`

- `POST /api/v1/company/orders/{id}/move-stage`

**Requirements:**

- Create custom pipeline stages (e.g., "Payment Confirmed", "In Production", "Quality Check")

- Define stage order/sequence

- Set stage colors for UI visualization

- Allow stage-specific actions (send notification, update inventory)

- Move orders between stages

- Track time spent in each stage

- Generate pipeline reports (orders per stage, bottlenecks)

**Default Stages:**

- Pending → Payment Confirmed → In Production → Quality Check → Ready for Shipment → Shipped → Delivered

---

## Enhanced CRM Features

### Task 12: Contact Product View History

Track which products each contact viewed.

**Endpoints:**

- `GET /api/v1/company/contacts/{id}/product-views`

**Requirements:**

- Record product views by contact (when logged in)

- Track view timestamp, duration, device type

- Show most viewed products by contact

- Show recent view history with pagination

- Include product details (name, SKU, price, image)

### Task 13: Contact RFQ History

Complete RFQ tracking per contact.

**Endpoints:**

- `GET /api/v1/company/contacts/{id}/rfq-history`

**Requirements:**

- List all RFQs submitted by contact

- Include RFQ status (open, quoted, closed, converted)

- Show quote response details

- Calculate quote-to-order conversion rate per contact

- Show timeline of RFQ activity

---

## Email Marketing Campaign System

### Task 14: Database Schema Setup for Email Campaigns
**Priority:** High - Required for basic functionality

**What needs to be done:**
- Set up database tables for CRM contacts (replacing current mock data)
- Create marketing campaigns table for tracking sent emails
- Add email templates table for reusable designs
- Implement campaign analytics (opens, clicks, bounces)

### Task 15: CRM Contacts API Implementation
**Priority:** High - Required for basic functionality

**Endpoints:**
- `GET /api/v1/company/crm/contacts` - List contacts with filtering
- `POST /api/v1/company/crm/contacts` - Create new contact
- `PUT /api/v1/company/crm/contacts/{id}` - Update contact
- `DELETE /api/v1/company/crm/contacts/{id}` - Delete contact
- `GET /api/v1/company/crm/contacts/{id}` - Get contact details

**Requirements:**
- Replace `useMockData()` in marketing page with real API calls
- Support filtering by status, tags, company, country
- Support search by name, email, company
- Implement pagination (50 contacts per page)
- Return data in format matching current mock structure
- Add contact import from CSV functionality

**Response format** (must match current frontend expectations):
```json
{
  "id": "string",
  "name": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "country": "string",
  "status": "active|prospect|inactive",
  "tags": ["string"],
  "totalOrders": 0,
  "totalRevenue": 0.00,
  "lastContact": "2024-01-01T00:00:00Z"
}
```

### Task 16: Email Campaign Sending Implementation
**Priority:** High - Core functionality

**Endpoint:** `POST /api/marketing/email-campaign` (existing stub)

**Requirements:**
- Choose and integrate email service provider (SendGrid, AWS SES, Resend, or similar)
- Implement actual email sending instead of stub response
- Add proper error handling and rate limiting
- Support HTML and text email content
- Handle bounce processing and unsubscribe requests
- Track delivery status

**Request Body** (current format):
```json
{
  "campaignName": "string",
  "fromName": "string",
  "replyTo": "string",
  "subject": "string",
  "preheader": "string",
  "recipients": [{"email": "string", "name": "string"}],
  "html": "string",
  "text": "string"
}
```

**Response:**
```json
{"ok": true, "sentCount": 100}
```

**Implementation steps:**
1. Set up email service provider account
2. Install and configure email service SDK
3. Implement batch sending for large recipient lists
4. Add email validation before sending
5. Store campaign data in database
6. Track sending status for each recipient

### Task 17: Email Campaign Analytics
**Priority:** Medium - Enhanced functionality

**Endpoints:**
- `GET /api/v1/company/marketing/campaigns/{id}/analytics`
- `GET /api/v1/company/marketing/campaigns/{id}/recipients`

**Requirements:**
- Track email opens (via tracking pixel)
- Track link clicks (via link redirection)
- Track bounce rates and delivery failures
- Calculate open rate, click rate, conversion rate
- Show geographic breakdown of opens/clicks
- Show device type breakdown (desktop, mobile)
- Generate campaign performance reports

**Analytics Response:**
```json
{
  "campaignId": 123,
  "totalSent": 1000,
  "delivered": 950,
  "opened": 150,
  "clicked": 25,
  "bounced": 50,
  "openRate": 15.8,
  "clickRate": 2.5,
  "conversionRate": 0.5,
  "geographicBreakdown": [
    {"country": "USA", "opens": 80, "clicks": 15},
    {"country": "UK", "opens": 45, "clicks": 8}
  ]
}
```

### Task 18: Email Template System
**Priority:** Medium - Enhanced functionality

**Endpoints:**
- `GET /api/v1/company/marketing/templates`
- `POST /api/v1/company/marketing/templates`
- `PUT /api/v1/company/marketing/templates/{id}`
- `DELETE /api/v1/company/marketing/templates/{id}`

**Requirements:**
- Save and load email templates
- Support template variables ({{contact_name}}, {{company_name}})
- Preview template rendering
- Categorize templates (welcome, promotional, follow-up)
- Track template usage statistics
- Import/export templates

**Template Structure:**
```json
{
  "id": 1,
  "name": "Welcome Email",
  "category": "welcome",
  "htmlContent": "<html><body>Hello {{contact_name}}...</body></html>",
  "textContent": "Hello {{contact_name}}...",
  "variables": ["contact_name", "company_name"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Task 19: Email Compliance Features
**Priority:** High - Legal requirement

**Endpoints:**
- `POST /api/marketing/unsubscribe` - Process unsubscribe requests
- `GET /api/marketing/unsubscribe/{token}` - Unsubscribe confirmation page
- `POST /api/marketing/unsubscribe/confirm` - Confirm unsubscribe

**Requirements:**
- Add unsubscribe links to all campaign emails
- Process unsubscribe requests automatically
- Maintain unsubscribe list per company
- Honor unsubscribe requests (no future emails)
- Generate compliance reports
- Include proper email headers (List-Unsubscribe)

**Unsubscribe Link Format:**
```
https://yourdomain.com/unsubscribe?token=encrypted_token&campaign=123
```

**Implementation:**
1. Generate unique unsubscribe tokens for each recipient
2. Include unsubscribe link in email footer
3. Process unsubscribe requests and update contact preferences
4. Prevent sending to unsubscribed contacts

---

## Email Campaign Database Schema

### Task X: Database Schema Setup for Email Campaigns
**Priority:** High - Required for basic functionality

**What needs to be done:**
- Set up database tables for CRM contacts (replacing current mock data)
- Create marketing campaigns table for tracking sent emails
- Add email templates table for reusable designs
- Implement campaign analytics (opens, clicks, bounces)

## CRM Data Management

### Task X+1: CRM Contacts API Implementation
**Priority:** High - Required for basic functionality

**Endpoints:**
- `GET /api/v1/company/crm/contacts` - List contacts with filtering
- `POST /api/v1/company/crm/contacts` - Create new contact
- `PUT /api/v1/company/crm/contacts/{id}` - Update contact
- `DELETE /api/v1/company/crm/contacts/{id}` - Delete contact
- `GET /api/v1/company/crm/contacts/{id}` - Get contact details

**Requirements:**
- Replace `useMockData()` in marketing page with real API calls
- Support filtering by status, tags, company, country
- Support search by name, email, company
- Implement pagination (50 contacts per page)
- Return data in format matching current mock structure
- Add contact import from CSV functionality

**Response format** (must match current frontend expectations):
```json
{
  "id": "string",
  "name": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "country": "string",
  "status": "active|prospect|inactive",
  "tags": ["string"],
  "totalOrders": 0,
  "totalRevenue": 0.00,
  "lastContact": "2024-01-01T00:00:00Z"
}
```

---

## Email Service Integration

### Task X+2: Email Campaign Sending Implementation
**Priority:** High - Core functionality

**Endpoint:** `POST /api/marketing/email-campaign` (existing stub)

**Requirements:**
- Choose and integrate email service provider (SendGrid, AWS SES, Resend, or similar)
- Implement actual email sending instead of stub response
- Add proper error handling and rate limiting
- Support HTML and text email content
- Handle bounce processing and unsubscribe requests
- Track delivery status

**Request Body** (current format):
```json
{
  "campaignName": "string",
  "fromName": "string",
  "replyTo": "string",
  "subject": "string",
  "preheader": "string",
  "recipients": [{"email": "string", "name": "string"}],
  "html": "string",
  "text": "string"
}
```

**Response:**
```json
{"ok": true, "sentCount": 100}
```

**Implementation steps:**
1. Set up email service provider account
2. Install and configure email service SDK
3. Implement batch sending for large recipient lists
4. Add email validation before sending
5. Store campaign data in database
6. Track sending status for each recipient

---

## Campaign Analytics & Tracking

### Task X+3: Email Campaign Analytics
**Priority:** Medium - Enhanced functionality

**Endpoints:**
- `GET /api/v1/company/marketing/campaigns/{id}/analytics`
- `GET /api/v1/company/marketing/campaigns/{id}/recipients`

**Requirements:**
- Track email opens (via tracking pixel)
- Track link clicks (via link redirection)
- Track bounce rates and delivery failures
- Calculate open rate, click rate, conversion rate
- Show geographic breakdown of opens/clicks
- Show device type breakdown (desktop, mobile)
- Generate campaign performance reports

**Analytics Response:**
```json
{
  "campaignId": 123,
  "totalSent": 1000,
  "delivered": 950,
  "opened": 150,
  "clicked": 25,
  "bounced": 50,
  "openRate": 15.8,
  "clickRate": 2.5,
  "conversionRate": 0.5,
  "geographicBreakdown": [
    {"country": "USA", "opens": 80, "clicks": 15},
    {"country": "UK", "opens": 45, "clicks": 8}
  ]
}
```

---

## Email Template Management

### Task X+4: Email Template System
**Priority:** Medium - Enhanced functionality

**Endpoints:**
- `GET /api/v1/company/marketing/templates`
- `POST /api/v1/company/marketing/templates`
- `PUT /api/v1/company/marketing/templates/{id}`
- `DELETE /api/v1/company/marketing/templates/{id}`

**Requirements:**
- Save and load email templates
- Support template variables ({{contact_name}}, {{company_name}})
- Preview template rendering
- Categorize templates (welcome, promotional, follow-up)
- Track template usage statistics
- Import/export templates

**Template Structure:**
```json
{
  "id": 1,
  "name": "Welcome Email",
  "category": "welcome",
  "htmlContent": "<html><body>Hello {{contact_name}}...</body></html>",
  "textContent": "Hello {{contact_name}}...",
  "variables": ["contact_name", "company_name"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Compliance & Unsubscribe Management

### Task X+5: Email Compliance Features
**Priority:** High - Legal requirement

**Endpoints:**
- `POST /api/marketing/unsubscribe` - Process unsubscribe requests
- `GET /api/marketing/unsubscribe/{token}` - Unsubscribe confirmation page
- `POST /api/marketing/unsubscribe/confirm` - Confirm unsubscribe

**Requirements:**
- Add unsubscribe links to all campaign emails
- Process unsubscribe requests automatically
- Maintain unsubscribe list per company
- Honor unsubscribe requests (no future emails)
- Generate compliance reports
- Include proper email headers (List-Unsubscribe)

**Unsubscribe Link Format:**
```
https://yourdomain.com/unsubscribe?token=encrypted_token&campaign=123
```

**Implementation:**
1. Generate unique unsubscribe tokens for each recipient
2. Include unsubscribe link in email footer
3. Process unsubscribe requests and update contact preferences
4. Prevent sending to unsubscribed contacts

---

## Technical Implementation Notes

**Email Service Provider Selection:**
- **SendGrid**: Recommended for ease of use and good deliverability
- **AWS SES**: Cost-effective for high volume
- **Resend**: Modern API, good for transactional emails

**Database Indexes Required:**
```sql
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_campaigns_company_id ON email_campaigns(company_id);
CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
```

**Background Processing:**
- Use queue system for large email campaigns
- Process analytics tracking asynchronously
- Handle bounce notifications via webhooks

**Rate Limiting:**
- Limit emails per hour/day per company
- Prevent spam and maintain sender reputation
- Queue excessive sends for later processing

**Testing Requirements:**
- Unit tests for email validation and template rendering
- Integration tests with email service provider
- End-to-end tests for campaign creation and sending
- Load tests for large recipient lists

**Security Considerations:**
- Encrypt unsubscribe tokens
- Validate all email addresses
- Sanitize template variables to prevent XSS
- Rate limit API endpoints

---

---

## Marketing Automation System

### Task 20: Automated Email Campaign Management

Build automated email campaign system.

**Endpoints:**

- `GET /api/v1/company/marketing/automated-campaigns`

- `POST /api/v1/company/marketing/automated-campaigns`

- `PUT /api/v1/company/marketing/automated-campaigns/{id}`

- `DELETE /api/v1/company/marketing/automated-campaigns/{id}`

- `POST /api/v1/company/marketing/automated-campaigns/{id}/activate`

- `GET /api/v1/company/marketing/automated-campaigns/{id}/stats`

**Requirements:**

- Create automated email campaigns (separate from manual campaigns in Task 14-19)

- Define triggers (new lead, abandoned quote, post-order)

- Set email sequence (email 1 after X days, email 2 after Y days)

- Use email templates with variables

- Track open rate, click rate, conversion rate

- Support A/B testing different email content

- Pause/resume campaigns

- Segment audience for targeting

**Campaign Types:**

- Welcome sequence for new contacts

- Abandoned quote follow-up

- Post-order follow-up (review request)

- Re-engagement for inactive contacts

### Task 21: Automated Email Template Management

Manage email templates for automated campaigns.

**Endpoints:**

- `GET /api/v1/company/marketing/automated-templates`

- `POST /api/v1/company/marketing/automated-templates`

- `PUT /api/v1/company/marketing/automated-templates/{id}`

**Requirements:**

- Create email templates with HTML support

- Support variables ({{contact_name}}, {{company_name}}, {{product_name}})

- Preview email before sending

- Test send to specific email

- Save multiple versions for A/B testing

---

## Advanced Ad Analytics

### Task 22: Detailed Ad Performance Metrics

Enhance ad reporting with detailed metrics.

**Endpoints:**

- `GET /api/v1/company/ads/performance-detailed`

**Requirements:**

- Calculate CPC (Cost Per Click) for each ad

- Calculate CPA (Cost Per Acquisition/Order)

- Calculate ROI (Return on Investment)

- Show geographic breakdown (views/clicks by region)

- Show device breakdown (desktop, mobile, tablet)

- Show time-of-day performance

- Compare ad performance over time

- Support filtering by date range, ad type

**New Metrics:**

- CTR (Click-Through Rate) - already exists

- CPC = Budget Spent / Total Clicks

- CPA = Budget Spent / Total Orders

- ROI = (Revenue from Ad Orders - Budget Spent) / Budget Spent * 100

### Task 23: Geographic Ad Targeting

Add location-based ad targeting.

**Endpoints:**

- `PUT /api/v1/company/ads/{id}/targeting`

**Requirements:**

- Target ads by region (country, state, city)

- Target ads by industry/category

- Target ads by buyer company size

- Track performance by segment

- Update existing ad creation endpoint to accept targeting parameters

**Targeting Options:**

- Geographic: regions, states, cities

- Industry: buyer's business category

- Company Size: small, medium, large (by employee count or revenue)

- Buyer Type: new vs returning buyers

---

## Message Templates (Backend Support)

### Task 24: Message Template Management

Provide backend for saving message templates.

**Endpoints:**

- `GET /api/v1/company/inbox/templates`

- `POST /api/v1/company/inbox/templates`

- `PUT /api/v1/company/inbox/templates/{id}`

- `DELETE /api/v1/company/inbox/templates/{id}`

**Requirements:**

- Save frequently used message templates

- Support variables ({{buyer_name}}, {{order_number}})

- Categorize templates (greeting, follow-up, shipping update, etc.)

- Track template usage

- Quick-apply template to conversation

---

## Implementation Priority Summary

**Sprint 1-2 (Weeks 1-4) - Critical for Launch:**

1. Wallet Transaction Management (Task 1)

2. Performance Scorecard (Task 2)

3. Traffic & Conversion Analytics (Task 3, 4)

4. Bulk Product Operations (Task 5)

5. Quote Templates (Task 6)

6. **Email Marketing Setup (Tasks 14-16)**

**Sprint 3-4 (Weeks 5-8) - Essential for Trust:**

7. Shipping Document Management (Task 7)

8. Enhanced Dispute Management (Task 8)

9. Certificate Verification (Task 9)

10. **Email Campaign Analytics (Tasks 17-18)**

**Sprint 5-6 (Weeks 9-12) - Operational Efficiency:**

11. Inventory Forecasting (Task 10)

12. Custom Order Pipeline (Task 11)

13. Enhanced CRM (Task 12, 13)

14. **Email Compliance (Task 19)**

**Sprint 7-8 (Weeks 13-16) - Growth & Automation:**

15. Marketing Automation (Task 20, 21)

16. Advanced Ad Analytics (Task 22, 23)

17. Message Templates (Task 24)

---

## Technical Notes

**Background Jobs:**

Tasks requiring background processing: bulk upload, bulk edit, email campaigns, inventory forecasting. Use queue system for asynchronous processing.

**External Integrations:**

- Email service: Setup transactional email service for automated campaigns

- Payment tracking: Ensure commission calculation integrated with payment processor

- File storage: Use secure cloud storage for shipping documents and uploaded files

**Database Considerations:**

- Index frequently queried fields (dates, statuses, IDs)

- Consider separate analytics database for reporting queries

- Archive old transactions to maintain performance

**Security:**

- Validate all file uploads (size, type, malware scanning)

- Rate limit bulk operations per company

- Sanitize template variables to prevent XSS

- Encrypt sensitive data (financial info, personal data)

**Testing:**

- Unit tests for all calculation logic (performance score, ROI, forecasting)

- Integration tests for external APIs (shipping, email)

- Load tests for bulk operations with large files

- End-to-end tests for critical flows (dispute resolution, order pipeline)
