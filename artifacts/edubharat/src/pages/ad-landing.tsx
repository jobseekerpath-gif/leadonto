import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, Mic2, MessageCircle, ShieldCheck, Sparkles, Target } from "lucide-react";
import { PageMeta } from "@/components/page-meta";
import { withAcquisition, track, trackFunnel } from "@/lib/analytics";

type AdLandingVariant = "english" | "interview";

const DATA: Record<AdLandingVariant, {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  features: string[];
  examples: string[];
  pageTitle: string;
  metaDescription: string;
}> = {
  english: {
    eyebrow: "SPOKEN ENGLISH PRACTICE",
    title: "Speak English without freezing.",
    highlight: "Practise it out loud.",
    description:
      "Talk to an AI English coach in real situations. When you get stuck, switch to Hindi, Tamil, Telugu, Bengali, Marathi and other Indian languages, then come back to English.",
    primaryCta: "Start 15 Free Minutes",
    primaryHref: "/english-guru/app",
    secondaryCta: "See how it works",
    secondaryHref: "/english-guru",
    features: [
      "15 minutes free — no signup and no card",
      "Voice conversation, not typing",
      "Mother-tongue help when you get stuck",
      "Designed for phone browsers and patchy data",
    ],
    examples: [
      "Job interview answers",
      "Office meetings and introductions",
      "Customer and BPO calls",
      "Daily conversation and confidence practice",
    ],
    pageTitle: "Practise Spoken English Free | Lead Onto",
    metaDescription:
      "Practise spoken English with an AI coach. 15 minutes free, no signup, no card, with Indian-language support.",
  },
  interview: {
    eyebrow: "AI MOCK INTERVIEW PRACTICE",
    title: "Practise the interview before the real interview.",
    highlight: "Speak. Get challenged. Improve.",
    description:
      "Choose a role, answer realistic questions by voice, and get structured feedback on communication, confidence, grammar and role-relevant answers.",
    primaryCta: "Start a Free Mock Interview",
    primaryHref: "/interview-ace",
    secondaryCta: "Practise English first",
    secondaryHref: "/english-guru/app",
    features: [
      "Role-specific interview questions",
      "Natural follow-up questions based on your answers",
      "Voice-first practice on phone or desktop",
      "Detailed feedback and saved interview reports",
    ],
    examples: [
      "HR and fresher interviews",
      "Sales, Banking and Insurance",
      "Software and Data Analytics",
      "BPO, Customer Service and Operations",
    ],
    pageTitle: "AI Mock Interview Practice | Lead Onto",
    metaDescription:
      "Practise realistic job interviews with an AI interviewer. Role-based questions, voice practice and structured feedback.",
  },
};

export default function AdLanding({ variant }: { variant: AdLandingVariant }) {
  const data = DATA[variant];

  useEffect(() => {
    track("ad_landing_viewed", { variant });
    trackFunnel("landing_viewed", { placement: "ad_landing", variant });
  }, [variant]);

  const handleCta = (placement: "primary" | "secondary") => {
    track("ad_landing_cta_clicked", { variant, placement });
    trackFunnel("cta_clicked", {
      cta: placement === "primary" ? data.primaryCta : data.secondaryCta,
      placement: "ad_landing",
      variant,
    });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#FFFDF9] text-secondary">
      <PageMeta
        title={data.pageTitle}
        description={data.metaDescription}
        canonicalUrl={`https://leadonto.com/ad/${variant}`}
      />

      <header className="border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href={withAcquisition("/")} className="text-lg font-extrabold tracking-tight text-secondary">
            Lead Onto<span className="text-primary">.</span>
          </Link>
          <Link
            href={withAcquisition("/pricing")}
            className="text-sm font-bold text-muted-foreground hover:text-secondary"
          >
            Pricing
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute -right-28 -top-28 -z-10 h-96 w-96 rounded-full bg-orange-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -left-28 top-24 -z-10 h-80 w-80 rounded-full bg-violet-200/45 blur-3xl" />

          <div className="container mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:py-20">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{data.eyebrow}</p>
              <h1 className="mt-4 max-w-3xl text-[clamp(2.35rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#111827]">
                {data.title}{" "}
                <span className="text-primary">{data.highlight}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#596273]">{data.description}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={withAcquisition(data.primaryHref)}
                  onClick={() => handleCta("primary")}
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-6 text-base font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#EA580C]"
                >
                  <Mic2 className="h-5 w-5" />
                  {data.primaryCta}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href={withAcquisition(data.secondaryHref)}
                  onClick={() => handleCta("secondary")}
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 border-indigo-200 bg-white px-6 text-base font-extrabold text-indigo-800 transition hover:bg-indigo-50"
                >
                  {data.secondaryCta}
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted-foreground">
                {data.features.slice(0, 3).map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-7">
              <div className="flex items-center gap-3 border-b border-border/70 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  {variant === "english" ? <MessageCircle className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-extrabold text-secondary">
                    {variant === "english" ? "English Guru" : "Interview Ace"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {variant === "english" ? "Live AI speaking practice" : "Role-based AI mock interview"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {data.examples.map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-[#FFFDF9] p-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-secondary">{item}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {variant === "english"
                          ? "Use your voice and practise the situation until the words come naturally."
                          : "Answer by voice and get a follow-up that responds to what you actually said."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800">
                    <ShieldCheck className="h-4 w-4" />
                    No fake testimonials
                  </div>
                  <p className="mt-1 text-xs leading-5 text-emerald-900/75">See the product and try it yourself.</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-orange-800">
                    <Sparkles className="h-4 w-4" />
                    Pay as you go
                  </div>
                  <p className="mt-1 text-xs leading-5 text-orange-900/75">₹1 per credit, no subscription.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 bg-white py-12 sm:py-16">
          <div className="container mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">WHAT YOU GET</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">
                  Built for practice, not promises.
                </h2>
                <div className="mt-7 space-y-4">
                  {data.features.map((item) => (
                    <div key={item} className="flex gap-3">
                      <div className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="font-semibold leading-7 text-secondary">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-700">WHY THIS LANDING PAGE</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-secondary">
                  Your ad brought you here for one reason.
                </h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  This page focuses on the same use case as the ad instead of making you search the whole homepage. The next step takes you directly to the relevant product.
                </p>
                <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-extrabold text-secondary">
                    {variant === "english"
                      ? "Try the experience before you pay."
                      : "Choose your role and practise before the real interview."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {variant === "english"
                      ? "Your first 15 minutes are free, with no signup and no card."
                      : "Guest practice is available, so you can test the interview experience before buying credits."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#111827] py-12 text-white sm:py-16">
          <div className="container mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-orange-300">NEXT STEP</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                {variant === "english" ? "Start speaking now." : "Start your mock interview now."}
              </h2>
            </div>
            <Link
              href={withAcquisition(data.primaryHref)}
              onClick={() => handleCta("primary")}
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-7 text-base font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#EA580C]"
            >
              {data.primaryCta}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
