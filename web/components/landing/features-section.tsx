"use client";

import { motion } from "framer-motion";
import { Search, Calculator, Clock, Shield, Building2, MessageCircle } from "lucide-react";

const features = [
    {
        icon: Search,
        title: "بحث ذكي",
        description: "ابحث عن عقارك المثالي بالمحادثة. قل ما تريد، وعنان يبحث لك.",
        gradient: "from-blue-500/20 to-cyan-500/10",
        iconColor: "text-blue-400",
    },
    {
        icon: Calculator,
        title: "حاسبة التمويل",
        description: "احسب قرضك العقاري فورًا مع مقارنة عروض البنوك المختلفة.",
        gradient: "from-emerald-500/20 to-green-500/10",
        iconColor: "text-emerald-400",
    },
    {
        icon: MessageCircle,
        title: "محادثة طبيعية",
        description: "تكلم بالعربي بطريقتك، وعنان يفهمك ويرد عليك بلهجتك.",
        gradient: "from-violet-500/20 to-purple-500/10",
        iconColor: "text-violet-400",
    },
    {
        icon: Clock,
        title: "متاح ٢٤/٧",
        description: "وكيلك الذكي متاح في أي وقت، بدون انتظار أو مواعيد.",
        gradient: "from-amber-500/20 to-orange-500/10",
        iconColor: "text-amber-400",
    },
    {
        icon: Building2,
        title: "عقارات موثقة",
        description: "عقارات حقيقية وبيانات محدثة من مصادر موثوقة.",
        gradient: "from-rose-500/20 to-pink-500/10",
        iconColor: "text-rose-400",
    },
    {
        icon: Shield,
        title: "خصوصية تامة",
        description: "محادثاتك سرية ومحمية. بياناتك لن تشارك مع أي طرف.",
        gradient: "from-teal-500/20 to-cyan-500/10",
        iconColor: "text-teal-400",
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function FeaturesSection() {
    return (
        <section className="relative py-24 px-4 sm:px-6 overflow-hidden" id="features">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        كل ما تحتاجه في <span className="text-primary">مكان واحد</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        عنان يجمع لك كل أدوات البحث العقاري في وكيل ذكي واحد يفهم احتياجاتك
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                variants={item}
                                className="group relative rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/20 hover:bg-card/50 hover:shadow-xl hover:shadow-primary/5"
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 transition-transform group-hover:scale-110`}
                                >
                                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                                </div>

                                <h3 className="text-lg font-bold text-foreground mb-2">
                                    {feature.title}
                                </h3>

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover glow */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
