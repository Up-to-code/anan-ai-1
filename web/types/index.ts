/**
 * Core Type Definitions
 * Centralized types for the entire application
 */

// ============================================
// User Types
// ============================================

export type UserPlan = "free" | "paid";

export interface LoginHistoryEntry {
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  device?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: UserPlan;
  phone?: string;
  location?: string;
  avatar?: string;
  lastLoginAt?: Date;
  loginHistory?: LoginHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateUserInput {
  email: string;
  name: string;
  plan?: UserPlan;
}

// ============================================
// Conversation & Message Types
// ============================================

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationInput {
  userId: string;
  title: string;
}

export type MessageType =
  | "text"
  | "appointment"
  | "appointment-list"
  | "property"
  | "property-list"
  | "service"
  | "service-list"
  | "image"
  | "document"
  | "coupon"
  | "table"
  | "streaming";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  isAi: boolean;
  timestamp: string;
  type: MessageType;
  data?: unknown;
  createdAt: Date;
}

export interface CreateMessageInput {
  conversationId: string;
  content: string;
  isAi: boolean;
  type?: MessageType;
  data?: unknown;
}

// ============================================
// Property Types
// ============================================

export type PropertyType = "buy" | "rent";

export interface Property {
  id: string;
  title: string;
  description?: string;
  location: string;
  price: string;
  priceNumeric: number; // For sorting/filtering
  type: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  areaNumeric?: number; // For sorting/filtering
  image?: string;
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyQuery {
  type?: PropertyType;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  limit?: number;
  offset?: number;
}

export interface CreatePropertyInput {
  title: string;
  description?: string;
  location: string;
  price: string;
  priceNumeric: number;
  type: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  areaNumeric?: number;
  image?: string;
  features?: string[];
}

// ============================================
// Appointment Types
// ============================================

export type AppointmentStatus = "confirmed" | "pending" | "cancelled";

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  propertyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentInput {
  userId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  status?: AppointmentStatus;
  propertyId?: string;
}

// ============================================
// Service Types
// ============================================

export interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  price?: string;
  createdAt: Date;
}

// ============================================
// Document Types
// ============================================

export interface Document {
  id: string;
  name: string;
  size: string;
  url?: string;
  type: string;
}

// ============================================
// Coupon Types
// ============================================

export interface Coupon {
  id: string;
  code: string;
  discount: string;
  expiry: string;
  isActive: boolean;
}

// ============================================
// Table Types
// ============================================

export interface TableColumn {
  header: string;
  accessor: string;
  align?: "left" | "center" | "right";
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, string | number>[];
}

// ============================================
// API Types
// ============================================

export type Channel = "web" | "whatsapp";

export interface ChatRequest {
  userId: string;
  message: string;
  conversationId?: string;
  channel?: Channel;
  model?: "standard" | "pro";
  userPlan?: UserPlan;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  conversationId: string;
  content: string;
  type: MessageType;
  data?: unknown;
  timestamp: string;
  toolsUsed?: string[];
  modelUsed?: string;
  userPlan?: UserPlan;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  retryAfter?: number;
}

// ============================================
// Tool Types
// ============================================

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// Rate Limiting Types
// ============================================

export interface RateLimitEntry {
  userId: string;
  timestamps: number[];
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// ============================================
// Pending Task Types (for SSE)
// ============================================

export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export interface PendingTask {
  id: string;
  userId: string;
  conversationId: string;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================
// Model Configuration Types
// ============================================

export type ModelTier = "free" | "standard" | "premium";

export interface ModelFeatures {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
}

export interface ModelInfo {
  id: string;
  displayName: string;
  contextLimit: number;
  features: ModelFeatures;
  tier: ModelTier;
}

// ============================================
// SSE Event Types
// ============================================

export type SSEEventType = "message" | "task_complete" | "error" | "heartbeat";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: string;
}

