"use client";

import { motion } from "framer-motion";
import { Compass, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { HeroGallery } from "@/components/landing/hero-gallery";

const WHY_ITEMS = [
  {
    icon: Compass,
    title: "لماذا عنان؟",
    description:
      "البحث العقاري التقليدي مشتت. عنان يجمع لك الخيارات في محادثة واحدة — بدون تنقل بين عشرات المواقع.",
  },
  {
    icon: LineChart,
    title: "لماذا هذه الفكرة؟",
    description:
      "القرار العقاري قرار مالي كبير. عنان يفهم هدفك، يختصر الخيارات، ويقترح الخطوة التالية بسرعة ووضوح.",
  },
  {
    icon: ShieldCheck,
    title: "لماذا نحن؟",
    description:
      "بيانات عملية، تجربة بسيطة، وتوصيات قابلة للتنفيذ — لا نصائح عامة ولا واجهات معقدة.",
  },
];

const WHY_US_POINTS = [
  "واجهة سهلة وبدون تشتيت",
  "مخرجات مرتبة: سعر، موقع، غرف، مساحة",
  "البحث والمقارنة في مكان واحد",
  "متوافق مع الموبايل وسريع التحميل",
];

export function FeaturesSection() {
  return (
    <section id="why" className="px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            ما الذي يميّز عنان؟
          </p>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            البحث العقاري أصبح أبسط
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            وضوح القيمة، تجربة سلسة، وتحويل سريع إلى محادثة فعلية من أول رسالة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {WHY_ITEMS.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="rounded-2xl border border-border/35 bg-card/45 p-6 backdrop-blur-sm"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          id="why-us"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-10 rounded-2xl border border-border/35 bg-card/40 p-6 sm:p-8"
        >
          <h3 className="text-xl font-semibold text-foreground">لماذا نحن عمليًا؟</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WHY_US_POINTS.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-border/30 bg-background/65 px-4 py-3 text-sm text-foreground/90"
              >
                {point}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8"
        >
          <p className="mb-3 text-right text-sm font-medium text-muted-foreground">
            لمحة سريعة من الخيارات العقارية
          </p>
          <HeroGallery itemClassName="h-36 sm:h-40" />
        </motion.div>
      </div>
    </section>
  );
}
