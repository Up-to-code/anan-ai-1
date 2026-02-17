"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export function CTASection() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-border/35 bg-card/45 p-8 text-center backdrop-blur-sm sm:p-12"
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            ابدأ البحث العقاري الذكي الآن
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            لا تنتظر — اكتب ما تبحث عنه وابدأ المحادثة مع عنان في ثوانٍ.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/#ask" className="inline-flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                ابدأ الآن
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
