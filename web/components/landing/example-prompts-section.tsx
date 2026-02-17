"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

const EXAMPLE_PROMPTS = [
  {
    text: "أبحث عن شقة 3 غرف في الرياض بميزانية مليون",
    category: "بحث",
  },
  {
    text: "قارن لي أفضل خيارات التمويل للعقار الأول",
    category: "مقارنة",
  },
  {
    text: "أفضل أحياء جدة للعائلات بميزانية متوسطة",
    category: "توصيات",
  },
  {
    text: "فيلا جاهزة للسكن مع حديقة صغيرة",
    category: "تفاصيل",
  },
];

export function ExamplePromptsSection() {
  return (
    <section id="examples" className="px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MessageCircle className="h-3.5 w-3.5" />
            أمثلة لما يمكنك السؤال عنه
          </p>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            اسأل بأي صيغة
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            عنان يفهم طلبك سواء كتبته بالتفصيل أو بجملة بسيطة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXAMPLE_PROMPTS.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
            >
              <Link
                href={`/chat/new?q=${encodeURIComponent(item.text)}`}
                className="block rounded-2xl border border-border/35 bg-card/45 p-4 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card/60"
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary/80">
                  {item.category}
                </span>
                <p className="mt-2 text-sm font-medium text-foreground">{item.text}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
