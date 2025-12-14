# Notification System - Quick Start Guide

## 🚀 What's Implemented

Your notification system is now fully integrated with real-time updates using Laravel Echo and Pusher!

## ✅ Features

- ✨ **Real-time notifications** via WebSocket (Pusher)
- 📱 **Browser desktop notifications** support
- 🔔 **Unread count badge** on the bell icon
- 🔄 **Auto-refresh** when new notifications arrive
- 📡 **Connection status** indicator
- 💾 **REST API fallback** for reliability
- 📲 **Mobile-first design**

## 🔧 Environment Setup

Create a `.env.local` file in the root directory with:

```bash
NEXT_PUBLIC_BACKEND_URL=https://api.adil-baba.com
NEXT_PUBLIC_PUSHER_APP_KEY=8fded0e8dde120743638
NEXT_PUBLIC_PUSHER_APP_CLUSTER=eu
```

## 📦 Installed Packages

```json
{
  "laravel-echo": "2.2.6",
  "pusher-js": "8.4.0"
}
```

## 🏗️ Architecture

### 1. **NotificationProvider** (`src/contexts/notification-context.tsx`)
- Manages Laravel Echo connection
- Subscribes to: `suppliers.{supplierId}`
- Listens to: `.notification.sent` event
- Provides notification state to the entire app

### 2. **NotificationsSheet** (`components/layout/notifications-sheet.tsx`)
- Displays notifications in a slide-over panel
- Shows real-time updates
- Connection status indicator
- Click to mark as read

### 3. **SidebarHeader** (`components/layout/sidebar-header.tsx`)
- Bell icon with unread count badge
- Opens notification panel on click

### 4. **Providers** (`app/providers.tsx`)
- NotificationProvider added to provider tree
- Wrapped inside AuthProvider (needs auth context)

## 🎯 How It Works

```
Backend Event → Laravel Broadcasting → Pusher → Laravel Echo → NotificationContext → UI Update
```

1. **Backend** broadcasts an event to `suppliers.{supplierId}` channel
2. **Pusher** receives the event and pushes to connected clients
3. **Laravel Echo** in your app receives the event
4. **NotificationContext** adds notification to state
5. **UI** automatically updates (badge count, notification list)
6. **Browser notification** shows (if permission granted)

## 🧪 Testing

### 1. Check Connection
1. Open the app
2. Click the bell icon
3. Look for the WiFi icon (green = connected)
4. Check browser console for: `✅ Connected to suppliers.{supplierId}`

### 2. Send Test Notification
From your backend or using curl:

```bash
curl -X POST https://api.adil-baba.com/api/v1/company/notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test notification from API"}'
```

### 3. Verify
- Notification appears instantly in the panel
- Unread count badge updates
- Browser notification shows (if enabled)
- Console logs: `🔔 New notification received:`

## 📝 Usage Example

```typescript
import { useNotifications } from "@/src/contexts/notification-context"

function MyComponent() {
  const { 
    notifications,          // All notifications
    unreadCount,            // Unread count
    isConnected,            // WebSocket status
    refreshNotifications,   // Manual refresh
    markAsRead              // Mark as read
  } = useNotifications()

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <button onClick={refreshNotifications}>Refresh</button>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.data.title}
        </div>
      ))}
    </div>
  )
}
```

## 🔐 Backend Requirements

Your Laravel backend needs to:

1. **Broadcast notifications** to the correct channel:
   ```php
   broadcast(new NotificationSent($notification))
       ->toOthers()
       ->on("suppliers.{$supplierId}");
   ```

2. **Event name** must be: `.notification.sent`

3. **Payload structure**:
   ```json
   {
     "notification": {
       "id": "uuid",
       "type": "order.received",
       "data": {
         "title": "Title here",
         "message": "Message here"
       },
       "read_at": null,
       "created_at": "2024-01-01T12:00:00Z"
     }
   }
   ```

4. **Auth endpoint** must be available at: `/api/broadcasting/auth`

## 🐛 Troubleshooting

### Not Connecting?
- ✅ Check environment variables are set
- ✅ Verify user is logged in with a valid token
- ✅ Ensure supplier ID exists in `authData.company.supplier.id`
- ✅ Check browser console for errors

### Not Receiving Notifications?
- ✅ Verify channel name: `suppliers.{supplierId}`
- ✅ Verify event name: `.notification.sent`
- ✅ Check backend is broadcasting correctly
- ✅ Test with curl command above

### Browser Notifications Not Working?
- ✅ Check browser notification permissions
- ✅ Some browsers block notifications by default
- ✅ Try clicking "Allow" when prompted

## 📚 Full Documentation

For detailed documentation, see: [docs/NOTIFICATION_SETUP.md](/docs/NOTIFICATION_SETUP.md)

## 🎉 You're Done!

Your notification system is ready to use! Start your dev server and test it out:

```bash
pnpm dev
```

Then open the app, click the bell icon, and send a test notification! 🎊

