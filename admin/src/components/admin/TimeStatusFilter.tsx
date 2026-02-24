"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export type TimeFilterValue = {
  preset: string;
  fromMs: number;
  toMs: number;
};

const PRESETS: { label: string; key: string; ms: number }[] = [
  { label: "24h", key: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "7d", key: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30d", key: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "90d", key: "90d", ms: 90 * 24 * 60 * 60 * 1000 },
];

export function TimeStatusFilter({
  value,
  onTimeChange,
}: {
  value: TimeFilterValue;
  onTimeChange: (next: TimeFilterValue) => void;
}) {
  return (
    <div className="flex gap-1">
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={value.preset === p.key ? "default" : "outline"}
          onClick={() =>
            onTimeChange({
              preset: p.key,
              fromMs: Date.now() - p.ms,
              toMs: Date.now(),
            })
          }
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
