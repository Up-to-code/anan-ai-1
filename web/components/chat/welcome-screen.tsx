"use client";

import { motion } from "framer-motion";
import { Building2, Calculator, Home, Landmark, MoveLeft } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  userName?: string;
}

const SUGGESTIONS = [
  { text: "ابحث عن شقق للبيع في شمال الرياض", icon: Home },
  { text: "قارن بين فيلتين بميزانية 2 مليون", icon: Building2 },
  { text: "احسب قسط التمويل المتوقع", icon: Calculator },
  { text: "أفضل بنك للقرض العقاري الأول", icon: Landmark },
];

export function WelcomeScreen({ onSuggestionClick, userName }: WelcomeScreenProps) {
  const greeting = userName ? `مرحبًا ${userName}` : "مرحبًا بك";

  return (
    <div className="flex min-h-[60vh] flex-col justify-center px-1 py-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-7 text-right"
      >
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">{greeting}</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          ابدأ من أحد السيناريوهات الجاهزة أو اكتب طلبك الخاص.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.text}
              type="button"
              onClick={() => onSuggestionClick(item.text)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex items-center gap-3 rounded-xl border border-border/35 bg-card/50 px-3.5 py-3 text-right transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card/75"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="flex-1 text-sm font-medium text-foreground/90">{item.text}</p>
              <MoveLeft className="h-4 w-4 text-muted-foreground/45 transition-colors group-hover:text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
