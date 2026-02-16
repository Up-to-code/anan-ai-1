"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2, Paperclip, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
}

interface ChatInputProps {
  onSend: (message: string, attachments?: AttachedFile[]) => void;
  isLoading?: boolean;
  onHeightChange?: (height: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  onHeightChange,
  disabled,
  placeholder,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const innerContainerRef = useRef<HTMLDivElement>(null);

  // Height observer for parent layout
  useEffect(() => {
    const el = innerContainerRef.current || containerRef.current;
    if (!el || !onHeightChange) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) onHeightChange(entry.borderBoxSize?.[0]?.blockSize ?? el.clientHeight ?? 0);
    });
    observer.observe(el);
    onHeightChange(el.clientHeight);
    return () => observer.disconnect();
  }, [onHeightChange]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus on desktop
  useEffect(() => {
    if (textareaRef.current && window.innerWidth >= 768) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Mobile keyboard handling
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const height = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(height > 0 ? height : 0);
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: AttachedFile[] = [];
    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const isImage = file.type.startsWith("image/");
      const attachment: AttachedFile = { id, file, type: isImage ? "image" : "document" };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, preview: ev.target?.result as string } : a));
        };
        reader.readAsDataURL(file);
      }
      newAttachments.push(attachment);
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return;
    if (isLoading || disabled) return;
    onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full"
      initial={false}
      animate={{
        marginBottom: keyboardHeight > 100 ? `${Math.max(keyboardHeight - 20, 0)}px` : "0px",
        y: keyboardHeight > 100 ? -Math.min(keyboardHeight * 0.1, 20) : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        ref={innerContainerRef}
        className="relative flex flex-col rounded-2xl bg-card/50 border border-border/30 transition-colors focus-within:border-primary/20 focus-within:bg-card/70"
      >
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative group flex items-center gap-2 bg-muted/30 rounded-lg p-2 pr-3">
                {attachment.type === "image" && attachment.preview ? (
                  <div className="w-9 h-9 rounded overflow-hidden bg-muted">
                    <img src={attachment.preview} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded bg-muted/50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs text-muted-foreground max-w-[80px] truncate">{attachment.file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 pt-3 pb-1.5">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder || "اسأل عنان..."}
            disabled={disabled}
            className={cn(
              "min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent text-right focus-visible:ring-0 shadow-none text-[15px] placeholder:text-muted-foreground/35 leading-relaxed p-0",
              disabled && "cursor-not-allowed opacity-60"
            )}
            dir="rtl"
            rows={1}
          />
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-3 py-2" dir="rtl">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              aria-label="إرفاق ملف"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachments.length === 0) || isLoading || disabled}
            className={cn(
              "rounded-xl h-8 w-8 flex items-center justify-center transition-all duration-150",
              (input.trim() || attachments.length > 0) && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted/30 text-muted-foreground/25 cursor-not-allowed"
            )}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </motion.div>
              ) : (
                <motion.div key="arrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
