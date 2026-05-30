"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Heart, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AuthShellProps = {
  children: ReactNode;
  variant?: "brand" | "centered";
};

const featureCards = [
  {
    icon: Heart,
    title: "Memory",
    text: "Save life moments.",
    style: "bg-[#EEF2FF] text-[#6366F1]",
  },
  {
    icon: LockKeyhole,
    title: "Vault",
    text: "Private thoughts protected.",
    style: "bg-[#0F172A] text-white",
  },
  {
    icon: Users,
    title: "Inner Circle",
    text: "Trusted sharing only.",
    style: "bg-amber-100 text-amber-600",
  },
];

export function AuthShell({ children, variant = "brand" }: AuthShellProps) {
  if (variant === "centered") {
    return (
      <main className="relative min-h-dvh overflow-x-hidden bg-[#F8FAFC]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(99,102,241,0.13),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(255,228,230,0.68),transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#f8fafc_100%)]" />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-center justify-center px-4 py-5 sm:px-6">
          {children}
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#F8FAFC]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(99,102,241,0.13),transparent_30%),radial-gradient(circle_at_90%_88%,rgba(255,228,230,0.7),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#f8fafc_100%)]" />

      <div className="relative mx-auto grid h-full w-full max-w-[1440px] items-center px-4 py-4 sm:px-6 lg:grid-cols-[1fr_0.88fr] lg:gap-10 lg:px-12 xl:px-16">
        <section className="hidden lg:flex lg:h-full lg:flex-col lg:justify-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Badge variant="privacy" className="gap-2">
              <ShieldCheck size={14} />
              Private-first memories
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="font-brand mt-7 max-w-3xl text-[clamp(3.8rem,5.6vw,5.7rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-[#0F172A]"
          >
            Your life,
            <br />
            remembered
            <br />
            beautifully.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14 }}
            className="mt-7 max-w-xl text-lg leading-8 text-slate-600"
          >
            Save meaningful memories, protect your private Vault, and share only
            what you choose.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.22,
                },
              },
            }}
            className="mt-10 grid max-w-3xl grid-cols-3 gap-4"
          >
            {featureCards.map((item) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[1.7rem] border border-white/70 bg-white/72 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.06)] backdrop-blur-2xl"
                >
                  <div
                    className={`mb-4 flex size-12 items-center justify-center rounded-2xl ${item.style}`}
                  >
                    <Icon size={21} />
                  </div>

                  <h3 className="font-brand text-base font-semibold tracking-[-0.03em] text-[#0F172A]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <section className="mx-auto flex h-full w-full max-w-[480px] flex-col items-center justify-center lg:ml-auto lg:mr-0">
          {children}
        </section>
      </div>
    </main>
  );
}