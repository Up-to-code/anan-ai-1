"use client";

import { motion } from "framer-motion";
import { Home, Building2, Calculator, Landmark, ChevronLeft } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  userName?: string;
}

const suggestions = [
  {
    text: "عرض عقارات للبيع في الرياض",
    icon: Home,
    gradient: "from-blue-500/15 to-blue-600/5",
    iconColor: "text-blue-400",
  },
  {
    text: "عقارات للإيجار بجدة",
    icon: Building2,
    gradient: "from-emerald-500/15 to-emerald-600/5",
    iconColor: "text-emerald-400",
  },
  {
    text: "احسب قرضك العقاري",
    icon: Calculator,
    gradient: "from-violet-500/15 to-violet-600/5",
    iconColor: "text-violet-400",
  },
  {
    text: "ما هي أفضل البنوك للقرض؟",
    icon: Landmark,
    gradient: "from-amber-500/15 to-amber-600/5",
    iconColor: "text-amber-400",
  },
];

export function WelcomeScreen({
  onSuggestionClick,
  userName,
}: WelcomeScreenProps) {
  const greeting = userName ? `أهلاً ${userName}` : "أهلاً بك";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-8 px-4" dir="rtl">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {greeting}
        </h1>
        <p className="text-base text-muted-foreground">
          كيف أقدر أساعدك اليوم؟
        </p>
      </motion.div>

      {/* Suggestion cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl"
      >
        {suggestions.map((suggestion, i) => {
          const Icon = suggestion.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
              type="button"
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group relative flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3.5 text-right transition-all duration-200 hover:border-primary/25 hover:bg-card/60"
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${suggestion.gradient}`}>
                <Icon className={`h-4.5 w-4.5 ${suggestion.iconColor}`} />
              </div>
              <span className="flex-1 text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {suggestion.text}
              </span>
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
