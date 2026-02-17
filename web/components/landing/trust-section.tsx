"use client";

import { motion } from "framer-motion";
import { Smartphone, Zap, Building2 } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Smartphone,
    title: "يعمل على الجوال",
    description: "تجربة سلسة من أي جهاز — ابحث وأنت في الطريق.",
  },
  {
    icon: Zap,
    title: "استجابة سريعة",
    description: "إجابات مباشرة دون انتظار طويل.",
  },
  {
    icon: Building2,
    title: "تركيز عقاري",
    description: "مصمم خصيصًا لسوق العقار السعودي.",
  },
];

export function TrustSection() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            لماذا تثق بعنان؟
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            نركز على ما يهمك فعلياً.
          </p>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {TRUST_ITEMS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="flex items-start gap-4 rounded-2xl border border-border/35 bg-card/30 px-5 py-4 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
