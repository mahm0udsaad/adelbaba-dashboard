# Real-time Notification System Setup

This document explains how to set up and use the real-time notification system using Laravel Echo and Pusher.

## Overview

The notification system provides:
- Real-time push notifications via WebSockets (Pusher)
- REST API fallback for fetching notifications
- Unread notification count badge
- Browser desktop notifications support
- Connection status indicator

## Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_BACKEND_URL=https://api.adil-baba.com

# Pusher Configuration for Real-time Notifications
NEXT_PUBLIC_PUSHER_APP_KEY=8fded0e8dde120743638
NEXT_PUBLIC_PUSHER_APP_CLUSTER=eu

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## Architecture

### 1. Notification Context (`src/contexts/notification-context.tsx`)

The main provider that manages:
- Laravel Echo connection to Pusher
- Private channel subscription: `suppliers.{supplierId}`
- Event listening: `.notification.sent`
- Notification state management
- Browser notification permissions

### 2. Notifications Sheet (`components/layout/notifications-sheet.tsx`)

Displays notifications with:
- Real-time updates when new notifications arrive
- Loading states
- Connection status indicator (WiFi icon)
- Refresh button
- Click to mark as read
- Empty state when no notifications

### 3. Sidebar Header (`components/layout/sidebar-header.tsx`)

Shows:
- Bell icon with unread count badge
- Opens notifications sheet on click

## Laravel Echo Configuration

The system connects to Pusher with the following configuration:

```typescript
const echo = new Echo({
  broadcaster: "pusher",
  key: PUSHER_APP_KEY,           // 8fded0e8dde120743638
  cluster: PUSHER_APP_CLUSTER,   // eu
  forceTLS: true,
  authEndpoint: `${BASE_URL}/api/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  },
})
```

## Channel and Event Structure

### Channel
The system listens to a private channel specific to each supplier:
```
suppliers.{supplierId}
```

Where `supplierId` is obtained from `authData.company.supplier.id`

### Event
The event name that triggers notifications:
```
.notification.sent
```

### Event Payload
Expected payload structure:
```typescript
{
  notification: {
    id: string
    type: string
    data: {
      title?: string
      message?: string
      [key: string]: any
    }
    read_at: string | null
    created_at: string
  }
}
```

## API Endpoints

### GET /api/v1/company/notifications
Fetch all notifications for the authenticated user.

**Headers:**
- `Authorization: Bearer {token}`
- `Accept: application/json`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "order.received",
      "data": {
        "title": "New Order",
        "message": "You have received a new order #12345"
      },
      "read_at": null,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/v1/company/notifications/send
Send a test notification (for testing only).

**Headers:**
- `Authorization: Bearer {token}`
- `Accept: application/json`
- `Content-Type: application/json`

**Body:**
```json
{
  "message": "Test notification message"
}
```

## Usage

### Using the Notification Context

```typescript
import { useNotifications } from "@/src/contexts/notification-context"

function MyComponent() {
  const {
    notifications,      // Array of all notifications
    unreadCount,        // Number of unread notifications
    isConnected,        // WebSocket connection status
    isLoading,          // Loading state
    error,              // Error message if any
    refreshNotifications, // Function to manually refresh
    markAsRead,         // Function to mark as read
    clearAll,           // Function to clear all
  } = useNotifications()

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map((notification) => (
        <div key={notification.id}>
          {notification.data.title}
        </div>
      ))}
    </div>
  )
}
```

### Browser Notifications

The system automatically requests permission for browser desktop notifications. When a new notification arrives:
1. It's added to the notification list
2. If browser notifications are enabled, a desktop notification is shown
3. The unread count badge is updated

## Testing

To test the notification system:

1. **Check Connection Status**
   - Open the notifications sheet
   - Look for the WiFi icon (green = connected, gray = disconnected)

2. **Send Test Notification**
   ```bash
   curl -X POST https://api.adil-baba.com/api/v1/company/notifications/send \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Test notification"}'
   ```

3. **Check Browser Console**
   - Open DevTools Console
   - You should see: `✅ Connected to suppliers.{supplierId}`
   - When notification arrives: `🔔 New notification received:`

## Troubleshooting

### Not Connecting
- Check that `NEXT_PUBLIC_PUSHER_APP_KEY` and `NEXT_PUBLIC_PUSHER_APP_CLUSTER` are set correctly
- Verify the user has a valid token and supplier ID
- Check browser console for connection errors

### Not Receiving Notifications
- Verify the channel name matches: `suppliers.{supplierId}`
- Check the event name is exactly: `.notification.sent`
- Ensure the backend is broadcasting to the correct channel
- Check the authentication endpoint is working: `/api/broadcasting/auth`

### Browser Notifications Not Showing
- Check browser notification permissions
- The system automatically requests permission on first connection
- Some browsers block notifications by default

## Security Notes

1. **Private Channels**: The system uses private channels that require authentication
2. **Bearer Token**: All requests include the user's bearer token
3. **Auth Endpoint**: Laravel validates the token before allowing channel subscription
4. **Supplier-Specific**: Each supplier only receives notifications for their own channel

## Mobile Support

The notification system is mobile-first and works seamlessly on:
- iOS Safari
- Android Chrome
- Desktop browsers

Mobile considerations:
- Responsive notification sheet
- Touch-friendly interactions
- Optimized for slow connections
- Automatic reconnection on network changes

