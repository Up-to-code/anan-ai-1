"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUp,
  Loader2,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Zap,
} from "lucide-react";
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
  model?: "standard" | "pro";
  onModelChange?: (model: "standard" | "pro") => void;
  onHeightChange?: (height: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  model = "standard",
  onModelChange,
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

  useEffect(() => {
    const containerToMeasure =
      innerContainerRef.current || containerRef.current;
    if (!containerToMeasure || !onHeightChange) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ??
          containerToMeasure.clientHeight ??
          0;
        onHeightChange(height);
      }
    });

    observer.observe(containerToMeasure);
    onHeightChange(containerToMeasure.clientHeight);

    return () => observer.disconnect();
  }, [onHeightChange]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (textareaRef.current && window.innerWidth >= 768) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

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

      const attachment: AttachedFile = {
        id,
        file,
        type: isImage ? "image" : "document",
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, preview: e.target?.result as string } : a,
            ),
          );
        };
        reader.readAsDataURL(file);
      }

      newAttachments.push(attachment);
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full px-4"
      initial={false}
      animate={{
        marginBottom:
          keyboardHeight > 100
            ? `${Math.max(keyboardHeight - 20, 0)}px`
            : "0px",
        y: keyboardHeight > 100 ? -Math.min(keyboardHeight * 0.1, 20) : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <motion.div
        ref={innerContainerRef}
        className="relative flex flex-col rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 transition-colors focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5"
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group flex items-center gap-2 bg-muted/50 rounded-lg p-2 pr-3"
              >
                {attachment.type === "image" && attachment.preview ? (
                  <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                    <img
                      src={attachment.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                  {attachment.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-3 pt-3 pb-2">
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
              "min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent text-right focus-visible:ring-0 shadow-none text-[15px] sm:text-base placeholder:text-muted-foreground/40 leading-relaxed",
              disabled && "cursor-not-allowed opacity-60",
            )}
            dir="rtl"
            rows={1}
          />
        </div>

        <div
          className="flex items-center justify-between gap-2 border-t border-border/30 px-3 py-2"
          dir="rtl"
        >
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
              aria-label="إرفاق ملف"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {onModelChange && (
              <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 mr-2">
                <button
                  type="button"
                  onClick={() => onModelChange("standard")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    model === "standard"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">عنان</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModelChange("pro")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    model === "pro"
                      ? "bg-gradient-to-l from-primary/20 to-primary/5 shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden sm:inline">بلس</span>
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              (!input.trim() && attachments.length === 0) ||
              isLoading ||
              disabled
            }
            size="icon"
            className={cn(
              "rounded-xl h-9 w-9 transition-all duration-200",
              (input.trim() || attachments.length > 0) && !disabled
                ? "bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="arrow"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowUp className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
