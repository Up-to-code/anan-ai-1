"use client";

import { motion } from "framer-motion";
import { PenLine, LayoutList, CheckCircle2, Zap } from "lucide-react";

const STEPS = [
  {
    icon: PenLine,
    title: "اكتب احتياجك",
    description: "وصف بسيط لما تبحث عنه — شقة، فيلا، أو نصيحة تمويلية.",
  },
  {
    icon: LayoutList,
    title: "احصل على نتائج",
    description: "عنان يرتب الخيارات ويقترح ما يناسبك حسب ميزانيتك وأهدافك.",
  },
  {
    icon: CheckCircle2,
    title: "قرّر بثقة",
    description: "قارن، اختر، واتخذ الخطوة التالية — كل ذلك في محادثة واحدة.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
            كيف يعمل؟
          </p>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            ثلاث خطوات بسيطة
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            من كتابة احتياجك حتى اتخاذ القرار — عنان يرافقك في كل خطوة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="rounded-2xl border border-border/35 bg-card/45 p-6 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
