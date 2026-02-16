# Complete Next.js Admin Dashboard Project Generator Prompt

## Project Overview
Create a complete, production-ready Next.js 16+ admin dashboard application with TypeScript, MongoDB, Better Auth authentication, and a comprehensive admin panel for managing users, content, and system settings.

## Technology Stack

### Core Technologies
- **Framework**: Next.js 16.1.1+ with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 4+ with PostCSS
- **Database**: MongoDB 7+ with Mongoose 9+
- **Authentication**: Better Auth 1.4.9+
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Form Validation**: Zod 4+
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Theme**: next-themes for dark/light mode
- **Font**: Cairo (Arabic/Latin support)

### Key Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.13",
    "better-auth": "^1.4.9",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "mongodb": "^7.0.0",
    "mongoose": "^9.0.2",
    "next": "16.1.1",
    "next-themes": "^0.4.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-easy-crop": "^5.5.6",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.2.1"
  }
}
```

## Project Structure

```
project-root/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── services/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── conversations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── messages/
│   │   │   │   └── page.tsx
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx
│   │   │   ├── activity/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── stats/
│   │   │   │   └── route.ts
│   │   │   ├── activity/
│   │   │   │   └── route.ts
│   │   │   └── settings/
│   │   │       └── route.ts
│   │   └── profile/
│   │       └── route.ts
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   ├── stats-card.tsx
│   │   ├── user-table.tsx
│   │   ├── user-form.tsx
│   │   ├── property-table.tsx
│   │   ├── property-form.tsx
│   │   ├── appointment-table.tsx
│   │   ├── service-table.tsx
│   │   ├── service-form.tsx
│   │   ├── conversation-table.tsx
│   │   ├── message-table.tsx
│   │   ├── task-table.tsx
│   │   └── activity-log.tsx
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── badge.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── auth/
│   │   └── client.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── mongoose.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── property.ts
│   │   ├── appointment.ts
│   │   ├── service.ts
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   ├── pending-task.ts
│   │   ├── admin-activity.ts
│   │   └── index.ts
│   ├── data/
│   │   ├── index.ts
│   │   ├── mongodb.ts
│   │   └── types.ts
│   └── utils.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-admin.ts
│   └── index.ts
├── types/
│   └── index.ts
├── auth.ts
├── auth.config.ts
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── package.json
```

## Database Schemas

### Important Note: User Role Management
The User model does not include a `role` field by default. You have two options:
1. **Add role field to User schema**: Add `role: { type: String, enum: ["admin", "manager", "user"], default: "user" }` to the userSchema
2. **Use metadata field**: Store role in `user.metadata.role` and check `user.metadata?.role === "admin"`

For the admin dashboard, you'll need to implement role-based access control. Update the User model or use metadata to track admin status.

### User Model
```typescript
// lib/models/user.ts
import mongoose, { Schema, model, models } from "mongoose";
import type { User } from "@/types";

export interface UserDocument extends Omit<User, "id">, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      trim: true,
      default: "",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
        device: String,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = models.User || model<UserDocument>("User", userSchema);
```

### Admin Activity Model
```typescript
// lib/models/admin-activity.ts
import mongoose, { Schema, models, model } from "mongoose";

export interface AdminActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const adminActivitySchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

adminActivitySchema.index({ userId: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });

export const AdminActivityModel = models.AdminActivity || model("AdminActivity", adminActivitySchema);
```

### Property Model
```typescript
// lib/models/property.ts
import mongoose, { Schema, model, models } from "mongoose";
import type { Property, PropertyType } from "@/types";

export interface PropertyDocument extends Omit<Property, "id">, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const propertySchema = new Schema<PropertyDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: String,
      required: true,
    },
    priceNumeric: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["buy", "rent"],
      required: true,
      index: true,
    },
    bedrooms: {
      type: Number,
      default: null,
    },
    bathrooms: {
      type: Number,
      default: null,
    },
    area: {
      type: String,
      default: null,
    },
    areaNumeric: {
      type: Number,
      default: null,
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

propertySchema.index({ type: 1, location: 1 });
propertySchema.index({ priceNumeric: 1 });
propertySchema.index({ areaNumeric: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ type: 1, priceNumeric: 1, location: 1 });

export const PropertyModel = models.Property || model<PropertyDocument>("Property", propertySchema);
```

### Appointment Model
```typescript
// lib/models/appointment.ts
import mongoose, { Schema, model, models } from "mongoose";
import type { Appointment, AppointmentStatus } from "@/types";

export interface AppointmentDocument extends Omit<Appointment, "id">, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "pending",
      index: true,
    },
    propertyId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

appointmentSchema.index({ userId: 1, date: 1 });
appointmentSchema.index({ userId: 1, status: 1 });

export const AppointmentModel =
  models.Appointment || model<AppointmentDocument>("Appointment", appointmentSchema);
```

### Service Model
```typescript
// lib/models/service.ts
import mongoose, { Schema, model, models } from "mongoose";
import type { Service } from "@/types";

export interface ServiceDocument extends Omit<Service, "id">, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const serviceSchema = new Schema<ServiceDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: null,
      index: true,
    },
    price: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

serviceSchema.index({ category: 1 });

export const ServiceModel = models.Service || model<ServiceDocument>("Service", serviceSchema);
```

### Conversation Model
```typescript
// lib/models/conversation.ts
import mongoose, { Schema, model, models } from "mongoose";
import type { Conversation } from "@/types";

export interface ConversationDocument extends Omit<Conversation, "id">, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export const ConversationModel =
  models.Conversation || model<ConversationDocument>("Conversation", conversationSchema);
```

### Message Model
```typescript
// lib/models/message.ts
import mongoose, { Schema, model, models } from "mongoose";
import type { Message, MessageType } from "@/types";

export interface MessageDocument extends Omit<Message, "id" | "timestamp">, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    isAi: {
      type: Boolean,
      required: true,
      default: false,
    },
    type: {
      type: String,
      enum: [
        "text",
        "appointment",
        "appointment-list",
        "property",
        "property-list",
        "service",
        "service-list",
        "image",
        "document",
        "coupon",
        "table",
        "streaming",
      ],
      default: "text",
    },
    data: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        if (ret.createdAt && ret.createdAt instanceof Date) {
          ret.timestamp = ret.createdAt.toISOString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel = models.Message || model<MessageDocument>("Message", messageSchema);
```

### Pending Task Model
```typescript
// lib/models/pending-task.ts
import mongoose, { Schema, model, models } from "mongoose";
import type { PendingTask, TaskStatus } from "@/types";

export interface PendingTaskDocument extends Omit<PendingTask, "id">, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const pendingTaskSchema = new Schema<PendingTaskDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

pendingTaskSchema.index({ userId: 1, status: 1 });
pendingTaskSchema.index({ conversationId: 1, status: 1 });

export const PendingTaskModel =
  models.PendingTask || model<PendingTaskDocument>("PendingTask", pendingTaskSchema);
```

### Admin Activity Model
```typescript
// lib/models/admin-activity.ts
import mongoose, { Schema, model, models } from "mongoose";

export interface AdminActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const adminActivitySchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

adminActivitySchema.index({ userId: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });

export const AdminActivityModel = models.AdminActivity || model("AdminActivity", adminActivitySchema);
```

### Models Index
```typescript
// lib/models/index.ts
export { UserModel } from "./user";
export { ConversationModel } from "./conversation";
export { MessageModel } from "./message";
export { PropertyModel } from "./property";
export { AppointmentModel } from "./appointment";
export { ServiceModel } from "./service";
export { PendingTaskModel } from "./pending-task";
export { AdminActivityModel } from "./admin-activity";
```

## Authentication Setup

### Better Auth Configuration
```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "./lib/db";

const databaseAdapter = mongodbAdapter(getDb());

export const auth = betterAuth({
  database: databaseAdapter,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

export type Auth = typeof auth;
```

### Auth API Route
```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Auth Client
```typescript
// lib/auth/client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

## Admin Dashboard Features

### 1. Dashboard Overview Page
- Statistics cards (Total Users, Active Users, New Users Today, Admin Actions)
- Recent activity feed
- User growth chart
- Quick actions panel

### 2. User Management
- User list table with pagination, sorting, and filtering
- Create new user
- Edit user details
- Delete user (with confirmation)
- View user profile with full details
- Search and filter users
- View user's conversations and messages
- View user's appointments
- View user's login history

### 3. Property Management
- Property list table with pagination, sorting, and filtering
- Create new property
- Edit property details
- Delete property (with confirmation)
- Filter by type (buy/rent), location, price range
- Search properties
- View property details

### 4. Appointment Management
- Appointment list table with pagination, sorting, and filtering
- View all appointments
- Filter by status (confirmed, pending, cancelled)
- Filter by date range
- View appointment details
- Update appointment status
- Link appointments to properties

### 5. Service Management
- Service list table with pagination, sorting, and filtering
- Create new service
- Edit service details
- Delete service (with confirmation)
- Filter by category
- Search services

### 6. Conversation Management
- View all conversations
- Filter by user
- View conversation messages
- Search conversations
- View conversation statistics

### 7. Message Management
- View all messages
- Filter by conversation, user, type
- Search messages
- View message details and data

### 8. Pending Task Management
- View all pending tasks
- Filter by status (pending, processing, completed, failed)
- View task results and errors
- Monitor task processing

### 9. Activity Logs
- View all admin actions
- Filter by user, action type, resource type, date range
- Export logs functionality
- Track all CRUD operations

### 5. Admin Layout
- Sidebar navigation
- Header with user info and theme toggle
- Breadcrumb navigation
- Responsive design

## Component Specifications

### Admin Sidebar
```typescript
// components/admin/admin-sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Home,
  Calendar,
  Briefcase,
  MessageSquare,
  Mail,
  CheckSquare,
  Activity,
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Properties", href: "/admin/properties", icon: Home },
  { name: "Appointments", href: "/admin/appointments", icon: Calendar },
  { name: "Services", href: "/admin/services", icon: Briefcase },
  { name: "Conversations", href: "/admin/conversations", icon: MessageSquare },
  { name: "Messages", href: "/admin/messages", icon: Mail },
  { name: "Tasks", href: "/admin/tasks", icon: CheckSquare },
  { name: "Activity", href: "/admin/activity", icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();
  
  return (
    <div className="w-64 border-r border-border bg-card h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
      </div>
      <nav className="px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

### Stats Card Component
```typescript
// components/admin/stats-card.tsx
"use client";

import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, trend, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-1",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
```

### User Table Component
```typescript
// components/admin/user-table.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  return (
    <div className="border border-border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.plan === "paid" ? "default" : "outline"}>
                  {user.plan}
                </Badge>
              </TableCell>
              <TableCell>
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(user.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## API Routes

### Admin Users API
```typescript
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserModel } from "@/lib/models/user";
import { connectDB } from "@/lib/db/mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Check admin role - either add role field to schema or use metadata
    // Option 1: If role field exists: if (user.role !== "admin")
    // Option 2: If using metadata: if (user.metadata?.role !== "admin")
    // For now, you may need to manually set admin users or implement role management

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;
    const users = await UserModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await UserModel.countDocuments(query);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        plan: u.plan,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Check admin role - implement based on your role management approach

    await connectDB();
    
    const body = await request.json();
    const { email, name, role, plan } = body;

    const newUser = new UserModel({
      email,
      name,
      role: role || "user",
      plan: plan || "free",
    });

    await newUser.save();

    return NextResponse.json({
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      plan: newUser.plan,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Admin Stats API
```typescript
// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserModel } from "@/lib/models/user";
import { AdminActivityModel } from "@/lib/models/admin-activity";
import { connectDB } from "@/lib/db/mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Check admin role - implement based on your role management approach

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const lastMonthStart = new Date(now.setMonth(now.getMonth() - 1));

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      adminActionsToday,
      usersLastMonth,
      usersThisMonth,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ lastLoginAt: { $gte: todayStart } }),
      UserModel.countDocuments({ createdAt: { $gte: todayStart } }),
      AdminActivityModel.countDocuments({ createdAt: { $gte: todayStart } }),
      UserModel.countDocuments({
        createdAt: {
          $gte: lastMonthStart,
          $lt: todayStart,
        },
      }),
      UserModel.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    const userGrowth = usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
      : 0;

    return NextResponse.json({
      totalUsers,
      activeUsers,
      newUsersToday,
      adminActionsToday,
      userGrowth: Math.round(userGrowth * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Styling & Theming

### Global CSS
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --radius: 0.75rem;
  --radius-sm: calc(var(--radius) - 4px);
}

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.75rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 5.9% 10%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 217 91% 60%;
}

body {
  font-family: var(--font-cairo), ui-sans-serif, system-ui, sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

### Root Layout
```typescript
// app/layout.tsx
import "./globals.css";
import { Cairo } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";

const cairo = Cairo({ 
  subsets: ["arabic", "latin"], 
  weight: ["400", "600", "700"], 
  variable: "--font-cairo" 
});

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing users and system",
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cairo.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem 
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Admin Layout with Route Protection
```typescript
// app/(admin)/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserModel } from "@/lib/models/user";
import { connectDB } from "@/lib/db/mongoose";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ 
    headers: new Headers() 
  });

  if (!session?.user) {
    redirect("/auth/login");
  }

  await connectDB();
  const user = await UserModel.findOne({ email: session.user.email });

  if (!user) {
    redirect("/");
  }
  
  // Check admin role - implement based on your role management approach
  // Option 1: if (user.role !== "admin") redirect("/");
  // Option 2: if (user.metadata?.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader user={user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Dashboard Page Example
```typescript
// app/(admin)/admin/dashboard/page.tsx
import { StatsCard } from "@/components/admin/stats-card";
import { ActivityLog } from "@/components/admin/activity-log";
import { Users, UserPlus, Activity, TrendingUp } from "lucide-react";

async function getStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={{
            value: stats.userGrowth,
            isPositive: stats.userGrowth > 0,
          }}
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Activity}
        />
        <StatsCard
          title="New Users Today"
          value={stats.newUsersToday}
          icon={UserPlus}
        />
        <StatsCard
          title="Admin Actions"
          value={stats.adminActionsToday}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActivityLog limit={10} />
      </div>
    </div>
  );
}
```

## Environment Variables
```env
# .env.local
MONGODB_URI=mongodb://localhost:27017/admin-dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Implementation Checklist

### Phase 1: Setup
- [ ] Initialize Next.js project with TypeScript
- [ ] Install all dependencies
- [ ] Setup Tailwind CSS and PostCSS
- [ ] Configure MongoDB connection
- [ ] Setup Better Auth
- [ ] Create database models
- [ ] Setup theme provider

### Phase 2: Authentication
- [ ] Create auth API routes
- [ ] Create login page
- [ ] Create signup page
- [ ] Create auth hooks
- [ ] Implement route protection

### Phase 3: Admin Components
- [ ] Create admin layout
- [ ] Create admin sidebar
- [ ] Create admin header
- [ ] Create UI components (table, card, etc.)
- [ ] Create stats cards
- [ ] Create user table
- [ ] Create user form
- [ ] Create activity log component

### Phase 4: Admin Pages
- [ ] Create dashboard page
- [ ] Create users list page
- [ ] Create user detail/edit page
- [ ] Create properties list page
- [ ] Create property detail/edit page
- [ ] Create appointments list page
- [ ] Create appointment detail page
- [ ] Create services list page
- [ ] Create service detail/edit page
- [ ] Create conversations list page
- [ ] Create conversation detail page
- [ ] Create messages list page
- [ ] Create tasks list page
- [ ] Create activity logs page

### Phase 5: API Routes
- [ ] Create admin users API (GET, POST, PUT, DELETE)
- [ ] Create admin properties API (GET, POST, PUT, DELETE)
- [ ] Create admin appointments API (GET, PUT)
- [ ] Create admin services API (GET, POST, PUT, DELETE)
- [ ] Create admin conversations API (GET)
- [ ] Create admin messages API (GET)
- [ ] Create admin tasks API (GET)
- [ ] Create admin stats API
- [ ] Create admin activity API

### Phase 6: Features
- [ ] Implement user CRUD operations
- [ ] Implement search and filtering
- [ ] Implement pagination
- [ ] Implement activity logging
- [ ] Implement settings management
- [ ] Add error handling
- [ ] Add loading states

## Additional Requirements

1. **Error Handling**: All API routes should have proper error handling
2. **Loading States**: All pages should show loading states
3. **Form Validation**: All forms should use Zod for validation
4. **Responsive Design**: All pages should be mobile-responsive
5. **Accessibility**: Follow WCAG guidelines
6. **Performance**: Optimize images and use Next.js optimizations
7. **Security**: Implement proper authorization checks
8. **Code Quality**: Use TypeScript strictly, proper error handling

## Notes

- All components should support both light and dark modes
- Use theme-aware classes (bg-background, text-foreground, etc.)
- All API routes should check for admin role
- Log all admin actions to AdminActivity collection
- Use server components where possible
- Use client components only when needed (interactivity, hooks)
- Implement proper TypeScript types throughout
- Use consistent naming conventions
- Add proper error boundaries
- Implement proper loading states

## Summary of Models Included

The admin dashboard should manage the following entities:

1. **Users** - User accounts with profiles, login history, and metadata
2. **Properties** - Real estate properties (buy/rent) with location, price, features
3. **Appointments** - Scheduled appointments linked to properties
4. **Services** - Service listings with categories and pricing
5. **Conversations** - User chat conversations
6. **Messages** - Individual messages within conversations
7. **Pending Tasks** - Background tasks with status tracking
8. **Admin Activity** - Audit log of all admin actions

## Role Management Implementation

Since the User model doesn't include a `role` field by default, you need to implement role management. Options:

1. **Add role field to User schema** (Recommended):
   ```typescript
   role: {
     type: String,
     enum: ["admin", "manager", "user"],
     default: "user",
     index: true,
   }
   ```

2. **Use metadata field**:
   ```typescript
   // Store in metadata
   metadata: {
     role: "admin"
   }
   // Check with: user.metadata?.role === "admin"
   ```

3. **Create separate Admin collection**:
   - Create an Admin model that references User IDs
   - Check if user ID exists in Admin collection

## Complete Feature List

### Dashboard
- Statistics overview
- Recent activity
- Quick actions
- Charts and graphs

### User Management
- List, create, edit, delete users
- View user details
- View user's conversations, messages, appointments
- Search and filter

### Property Management
- List, create, edit, delete properties
- Filter by type, location, price
- Search properties
- View property details

### Appointment Management
- View all appointments
- Filter by status, date, user
- Update appointment status
- View appointment details

### Service Management
- List, create, edit, delete services
- Filter by category
- Search services

### Conversation Management
- View all conversations
- Filter by user
- View conversation details
- View messages in conversation

### Message Management
- View all messages
- Filter by conversation, user, type
- Search messages

### Task Management
- View all pending tasks
- Filter by status
- View task results and errors

### Activity Logs
- View all admin actions
- Filter by user, action, resource, date
- Export logs

---

**This prompt should generate a complete, production-ready Next.js admin dashboard with all the specified features, components, and functionality. All models from the actual project are included, and the prompt provides comprehensive guidance for building a full-featured admin panel.**

