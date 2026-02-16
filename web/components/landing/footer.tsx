"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerLinks = [
    {
        title: "المنصة",
        links: [
            { label: "ابدأ محادثة", href: "/chat/new" },
            { label: "المميزات", href: "/#features" },
            { label: "الأسعار", href: "/#stats" },
        ],
    },
    {
        title: "الدعم",
        links: [
            { label: "الأسئلة الشائعة", href: "#" },
            { label: "تواصل معنا", href: "#" },
            { label: "مركز المساعدة", href: "#" },
        ],
    },
    {
        title: "القانون",
        links: [
            { label: "سياسة الخصوصية", href: "#" },
            { label: "شروط الاستخدام", href: "#" },
            { label: "اتفاقية المستخدم", href: "#" },
        ],
    },
];

export function Footer() {
    return (
        <footer className="relative border-t border-border/30 bg-card/20 backdrop-blur-sm" dir="rtl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70">
                                <Sparkles className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold text-foreground">عنان AI</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            أول وكيل عقاري ذكي في العالم العربي. نساعدك تلاقي عقارك المثالي بالذكاء الاصطناعي.
                        </p>
                    </div>

                    {/* Link columns */}
                    {footerLinks.map((group) => (
                        <div key={group.title}>
                            <h4 className="text-sm font-bold text-foreground mb-4">{group.title}</h4>
                            <ul className="space-y-2.5">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground/50">
                        © {new Date().getFullYear()} عنان AI. جميع الحقوق محفوظة.
                    </p>
                    <p className="text-xs text-muted-foreground/50">
                        صنع بـ ❤️ في السعودية
                    </p>
                </div>
            </div>
        </footer>
    );
}
