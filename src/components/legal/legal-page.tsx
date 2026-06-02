import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  LEGAL_LAST_UPDATED,
  legalNavLinks,
  legalPages,
  type LegalPageId,
} from "@/components/legal/legal-content";

type LegalPageProps = {
  pageId: LegalPageId;
};

export function LegalPage({ pageId }: LegalPageProps) {
  const page = legalPages[pageId];

  return (
    <main className="mem-bg min-h-dvh">
      <div className="pointer-events-none fixed inset-0 mem-page-gradient" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 border-b border-[var(--app-border)] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/login"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            >
              <ArrowLeft size={16} />
              Back to Memories
            </Link>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--app-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-accent)]">
              <ShieldCheck size={14} />
              {page.eyebrow}
            </div>

            <h1 className="font-brand text-4xl font-semibold tracking-normal text-[var(--app-heading)] sm:text-5xl">
              {page.title}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--app-muted)]">
              {page.description}
            </p>

            <p className="mt-3 text-sm font-semibold text-[var(--app-faint)]">
              Last updated: {LEGAL_LAST_UPDATED}
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end"
            aria-label="Legal pages"
          >
            {legalNavLinks.map((link) => {
              const active = link.id === pageId;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "rounded-full bg-[var(--app-accent)] px-3 py-1.5 text-xs font-semibold text-white"
                      : "rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                  }
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <section className="grid gap-4">
          {page.sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 shadow-[0_18px_50px_var(--app-shadow)] sm:p-6"
            >
              <h2 className="font-brand text-xl font-semibold tracking-normal text-[var(--app-heading)]">
                {section.heading}
              </h2>

              {section.body?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-sm leading-7 text-[var(--app-muted)] sm:text-[15px]"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-4 grid gap-2 text-sm leading-7 text-[var(--app-muted)] sm:text-[15px]">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--app-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        <footer className="border-t border-[var(--app-border)] pt-6 text-center text-xs leading-6 text-[var(--app-faint)]">
          This page is a draft for review and is not legal advice.
        </footer>
      </div>
    </main>
  );
}

