import { ComponentType } from "./component-mapper";

export {
  type Property,
  type Appointment,
  type Service,
  type Document,
  type Coupon,
  type TableColumn,
  type TableData,
} from "@/types";

export interface Message {
  id: string;
  content: string;
  isAi: boolean;
  timestamp: string;
  type?: ComponentType | "text";
  data?: unknown;
}

export interface ChatRequest {
  message: string;
  model: "standard" | "pro";
  conversationId?: string | null;
}

export interface ChatResponse {
  content: string;
  type: ComponentType | "text";
  data?: unknown;
  conversationId?: string;
  error?: string;
}
