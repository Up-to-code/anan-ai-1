import { Sidebar } from "@/components/layout/sidebar";
import { ChatNavbar } from "@/components/layout/chat-navbar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0">
        <ChatNavbar />
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
}

