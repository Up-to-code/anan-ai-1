/**
 * Custom event system for app-wide communication
 */

// Event types
export const EVENTS = {
  CONVERSATION_DELETED: "conversation:deleted",
  CONVERSATION_CREATED: "conversation:created",
  CLEAR_CHAT: "chat:clear",
} as const;

// Type-safe event emitter
export function emitEvent(eventName: string, data?: unknown) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}

// Type-safe event listener
export function onEvent(eventName: string, callback: (data?: unknown) => void) {
  if (typeof window !== "undefined") {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener(eventName, handler as EventListener);
    return () => window.removeEventListener(eventName, handler as EventListener);
  }
  return () => {};
}

