"use client";

import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

interface ToolActivity {
  id: string;
  toolName: string;
  label: string;
}

interface ToolActivityTimelineProps {
  activities: ToolActivity[];
}

export function ToolActivityTimeline({ activities }: ToolActivityTimelineProps) {
  if (activities.length === 0) return null;

  return (
    <div
      className="w-full rounded-xl border border-border/40 bg-card/70 p-2.5 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" />
        نشاط الأدوات
      </div>
      <div className="space-y-1.5">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.16 }}
            className="flex items-start gap-2 rounded-lg bg-background/70 px-2.5 py-2"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
            <p className="line-clamp-1 text-xs text-foreground/90">{activity.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
