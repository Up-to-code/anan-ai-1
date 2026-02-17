"use client";

import { motion } from "framer-motion";
import { HeroGallery } from "@/components/landing/hero-gallery";

const IDEA_STEPS = [
  {
    title: "1) وضوح الفكرة",
    description:
      "المشكلة: البحث العقاري مشتت. الحل: مساعد محادثة واحد يجمع الخيارات ويختصر الوقت.",
  },
  {
    title: "2) إثبات القيمة",
    description:
      "سرعة في النتائج، تنظيم واضح، ومقارنة سريعة — كل ما تحتاجه لاتخاذ قرار واعي.",
  },
  {
    title: "3) التحويل",
    description:
      "اكتب احتياجك واضغط إرسال — تنتقل مباشرة لمحادثة مع عنان وتُجاب على سؤالك.",
  },
];

const TRUST_METRICS = [
  { label: "تقليل وقت البحث", value: "50%+" },
  { label: "وضوح التوصيات", value: "مرتب ومباشر" },
  { label: "الانتقال للشات", value: "بضغطة واحدة" },
];

export function StatsSection() {
  return (
    <section id="idea" className="px-4 pb-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            لماذا هذه الفكرة تعمل؟
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            لأنها تبني الصفحة كما يفكر العميل: فهم المشكلة، الثقة في الحل، ثم
            بدء المحادثة.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {IDEA_STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="rounded-2xl border border-border/35 bg-card/45 p-6"
            >
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TRUST_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-border/30 bg-background/70 px-4 py-4 text-center"
              >
                <p className="text-lg font-bold text-primary">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground/80">
            أمثلة: شقق للبيع، فلل جاهزة، قروض عقارية، أفضل الأحياء للعائلات
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8"
        >
          <p className="mb-3 text-right text-sm font-medium text-muted-foreground">
            صور تدعم الفكرة قبل بدء المحادثة
          </p>
          <HeroGallery itemClassName="h-32 sm:h-36" />
        </motion.div>
      </div>
    </section>
  );
}
