"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const BLOCKS = [
  {
    title: "ابحث بذكاء",
    text: "محادثة واحدة بدل عشرات التبويبات. اكتب ماذا تبحث عنه وابدأ الحصول على نتائج مرتبة فورًا.",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    imagePosition: "right" as const,
  },
  {
    title: "وفر وقتك",
    text: "لا مزيد من القفز بين المواقع. عنان يجمع الخيارات، يرتبها، ويختصر لك الطريق إلى القرار.",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    imagePosition: "left" as const,
  },
  {
    title: "قرّر بثقة",
    text: "مخرجات واضحة: سعر، موقع، غرف، مساحة. قارن بين الخيارات واختر ما يناسبك.",
    image:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
    imagePosition: "right" as const,
  },
];

export function HeroValueSection() {
  return (
    <section className="relative px-4 py-12 sm:px-6">
      {/* Background lighting - extends into this section */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[320px] w-[320px] rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute top-[60%] right-1/3 h-[280px] w-[280px] rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl space-y-16">
        {BLOCKS.map((block, index) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.1 }}
            className={block.imagePosition === "right"
              ? "flex flex-col gap-6 md:flex-row md:items-center md:gap-10"
              : "flex flex-col gap-6 md:flex-row-reverse md:items-center md:gap-10"}
          >
            {/* Image */}
            <div className="relative min-h-[220px] w-full shrink-0 overflow-hidden rounded-2xl border border-border/35 bg-card/45 md:min-h-[260px] md:w-[45%]">
              <Image
                src={block.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>

            {/* Title + Text */}
            <div className="flex flex-1 flex-col justify-center md:w-[55%]">
              <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
                {block.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {block.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
