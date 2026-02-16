"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Zap, MessageCircle } from "lucide-react";

function useCountUp(target: number, duration: number = 2000, startOnView: boolean = true) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(!startOnView);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!startOnView) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasStarted(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [startOnView]);

    useEffect(() => {
        if (!hasStarted) return;
        const startTime = Date.now();
        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [hasStarted, target, duration]);

    return { count, ref };
}

const stats = [
    {
        icon: Building2,
        value: 2500,
        suffix: "+",
        label: "عقار متاح",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        icon: Users,
        value: 1200,
        suffix: "+",
        label: "مستخدم نشط",
        gradient: "from-violet-500 to-purple-500",
    },
    {
        icon: MessageCircle,
        value: 15000,
        suffix: "+",
        label: "محادثة مكتملة",
        gradient: "from-emerald-500 to-green-500",
    },
    {
        icon: Zap,
        value: 3,
        suffix: " ثوان",
        label: "متوسط وقت الرد",
        gradient: "from-amber-500 to-orange-500",
    },
];

export function StatsSection() {
    return (
        <section className="relative py-20 px-4 sm:px-6" id="stats">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-14"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                        أرقام تتحدث عنا
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        نتائج حقيقية من مستخدمين حقيقيين
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, i) => (
                        <StatCard key={stat.label} stat={stat} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatCard({
    stat,
    index,
}: {
    stat: (typeof stats)[number];
    index: number;
}) {
    const { count, ref } = useCountUp(stat.value, 2000);
    const Icon = stat.icon;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative group text-center rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:border-primary/20 hover:bg-card/50"
        >
            <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${stat.gradient} bg-opacity-10`}
                style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))`, opacity: 0.15 }}
            >
                <Icon className="h-6 w-6 text-foreground" />
            </div>

            <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1" dir="ltr">
                {count.toLocaleString("ar-SA")}
                <span className="text-primary text-xl">{stat.suffix}</span>
            </div>

            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
        </motion.div>
    );
}
