import { HeroChat } from "@/components/landing/hero-chat";
import { HeroGallery } from "@/components/landing/hero-gallery";
import { Footer } from "@/components/landing/footer";
import { Check, CircleDot, HeartHandshake, Sparkles } from "lucide-react";

const WHY_POINTS = [
  "واجهة محادثة واحدة بدل التنقل بين مواقع كثيرة",
  "نتائج مرتبة وواضحة حسب ميزانية المستخدم",
  "تجربة سريعة على الجوال والويب بنفس الجودة",
];

const WHY_US_POINTS = [
  "منطق خلفي قوي مع واجهة أخف وأسهل",
  "انتقال مباشر من الصفحة إلى المحادثة الفعلية",
  "تجربة ليلية ونهارية متوازنة بدون تشويش بصري",
  "تغذية راجعة لحظية أثناء التفكير والبحث",
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background" dir="rtl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-120px] top-[-140px] h-96 w-96 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute left-[-120px] top-[18%] h-[26rem] w-[26rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-160px] right-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <main className="relative">
        <section className="px-4 pb-8 pt-20 sm:px-6 sm:pt-24">
          <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4 text-right">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                تجربة عقارية أقرب للناس
              </p>
              <h1 className="text-4xl font-black leading-tight text-foreground sm:text-5xl">
                ابحث عن بيتك بهدوء
                <span className="block text-primary">ومحادثة بسيطة</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                اكتب طلبك فقط. عنان يتكفل بالباقي ويعطيك نتائج مفهومة خطوة بخطوة.
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-card/55 px-3 py-2 text-sm text-foreground/85">
                <HeartHandshake className="h-4 w-4 text-primary" />
                تجربة إنسانية، واضحة، وبدون تعقيد
              </div>
            </div>

            <div className="rounded-3xl border border-border/40 bg-card/55 p-4 backdrop-blur-sm sm:p-5">
              <HeroChat />
            </div>
          </div>
        </section>

        <section id="why" className="px-4 py-14 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 text-right">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">لماذا هذه الواجهة؟</h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                لأن قرارك العقاري يحتاج وضوح وسرعة وتجربة سهلة من أول ثانية.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {WHY_POINTS.map((item) => (
                <article
                  key={item}
                  className="rounded-2xl border border-border/35 bg-card/45 p-5"
                >
                  <CircleDot className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="px-4 py-12 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-5 text-right">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">عن الفكرة</h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                صور واقعية ضمن المحتوى لتدعم الفهم، وليس داخل الهيرو.
              </p>
            </div>
            <HeroGallery />
          </div>
        </section>

        <section id="why-us" className="px-4 py-14 sm:px-6">
          <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border/35 bg-card/45 p-6">
              <h3 className="text-2xl font-bold text-foreground">لماذا نحن؟</h3>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                نفس المنطق الخلفي القوي، لكن تجربة جديدة بالكامل في الواجهة والتفاعل.
              </p>
              <div className="mt-5 space-y-3">
                {WHY_US_POINTS.map((point) => (
                  <div key={point} className="flex items-start gap-2 rounded-xl bg-background/75 px-3 py-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm text-foreground/90">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="idea" className="rounded-2xl border border-border/35 bg-card/45 p-6">
              <h3 className="text-xl font-bold text-foreground">لماذا الفكرة تعمل؟</h3>
              <ol className="mt-4 space-y-3 text-sm text-foreground/90">
                <li className="rounded-xl bg-background/70 p-3">
                  1. المستخدم يكتب هدفه مباشرة بدون تعقيد.
                </li>
                <li className="rounded-xl bg-background/70 p-3">
                  2. النظام يفكر ويبحث ويعرض مسار واضح للقرار.
                </li>
                <li className="rounded-xl bg-background/70 p-3">
                  3. المحادثة تستمر بنفس السياق حتى الوصول لنتيجة.
                </li>
              </ol>
              <div className="mt-4">
                <HeroGallery itemClassName="h-28 sm:h-32" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
