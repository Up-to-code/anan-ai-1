"use client";

import { motion } from "framer-motion";
import {
  Home,
  Building2,
  Landmark,
  ChevronLeft,
  Sparkles,
  Calculator,
} from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  userName?: string;
}

const suggestions = [
  {
    text: "عرض عقارات للبيع في الرياض",
    icon: Home,
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    text: "عقارات للإيجار بجدة",
    icon: Building2,
    color: "from-emerald-500/20 to-emerald-600/10",
  },
  {
    text: "احسب قرضك العقاري",
    icon: Calculator,
    color: "from-violet-500/20 to-violet-600/10",
  },
  {
    text: "ما هي أفضل البنوك للقرض؟",
    icon: Landmark,
    color: "from-amber-500/20 to-amber-600/10",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function WelcomeScreen({
  onSuggestionClick,
  userName = "هناك",
}: WelcomeScreenProps) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center py-6 sm:py-10 px-4 sm:px-6"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/20">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          مرحباً، {userName}
        </h1>
        <p className="text-lg text-muted-foreground">
          كيف يمكنني مساعدتك اليوم؟
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl"
      >
        {suggestions.map((suggestion, i) => {
          const Icon = suggestion.icon;
          return (
            <motion.button
              key={i}
              variants={item}
              type="button"
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group relative flex items-center gap-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-4 text-right transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${suggestion.color} transition-transform group-hover:scale-110`}
              >
                <Icon className="h-5 w-5 text-foreground/80" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                {suggestion.text}
              </span>
              <ChevronLeft className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:-translate-x-1 transition-all" />
            </motion.button>
          );
        })}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-xs text-muted-foreground/50"
      >
        Powered by عنان AI
      </motion.p>
    </div>
  );
}
