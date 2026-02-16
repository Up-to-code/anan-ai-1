/**
 * Chat message and component types for mobile (aligned with web ComponentMapper).
 */

export type ComponentType =
  | "text"
  | "property"
  | "property-list"
  | "bank"
  | "bank-list";

export interface ChatMessage {
  id: string;
  content: string;
  isAi: boolean;
  timestamp: string;
  type: ComponentType;
  data?: unknown;
}
