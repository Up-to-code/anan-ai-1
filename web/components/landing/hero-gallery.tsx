"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    title: "فلل جاهزة",
    subtitle: "خيارات سكنية فاخرة",
  },
  {
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    title: "شقق عائلية",
    subtitle: "في أحياء مخدومة",
  },
  {
    src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    title: "استثمار عقاري",
    subtitle: "فرص جاهزة للمقارنة",
  },
];

interface HeroGalleryProps {
  className?: string;
  itemClassName?: string;
}

export function HeroGallery({ className, itemClassName }: HeroGalleryProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 md:grid-cols-12", className)}>
      {HERO_IMAGES.map((item, index) => (
        <motion.article
          key={item.title}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/35",
            index === 0 && "md:col-span-5 md:h-72",
            index === 1 && "md:col-span-4 md:h-72",
            index === 2 && "md:col-span-3 md:h-72",
            index !== 0 && index !== 1 && index !== 2 && "h-44",
            itemClassName,
          )}
        >
          <Image
            src={item.src}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute bottom-0 w-full p-4 text-right">
            <p className="text-sm font-bold text-white sm:text-base">{item.title}</p>
            <p className="mt-0.5 text-xs text-white/85 sm:text-sm">{item.subtitle}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
