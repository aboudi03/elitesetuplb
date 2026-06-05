import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { infoPageMap, infoPages, whatsappContactHref } from "@/lib/info-pages";
import { contactEmails } from "@/lib/utils";

type InfoPageProps = {
  params: Promise<{ infoSlug: string }>;
};

export function generateStaticParams() {
  return infoPages.map((page) => ({ infoSlug: page.slug }));
}

export async function generateMetadata({ params }: InfoPageProps): Promise<Metadata> {
  const { infoSlug } = await params;
  const page = infoPageMap.get(infoSlug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: page.title,
    description: page.description,
  };
}

const InfoPage = async ({ params }: InfoPageProps) => {
  const { infoSlug } = await params;
  const page = infoPageMap.get(infoSlug);

  if (!page) {
    notFound();
  }

  return (
    <main className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <section className="border-b border-[var(--site-border)] bg-[var(--site-panel)]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--site-accent)]">
            Elite Setup
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight max-sm:text-3xl">
            {page.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--site-muted)]">
            {page.description}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--site-muted)]">
            Last updated: {page.updatedAt}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {page.sections.map((section) => (
          <article
            key={section.heading}
            className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm"
          >
            <h2 className="text-xl font-black uppercase text-[var(--site-text)]">
              {section.heading}
            </h2>
            {section.body ? (
              <p className="mt-3 text-base leading-7 text-[var(--site-muted)]">
                {section.body}
              </p>
            ) : null}
            {section.items ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-[var(--site-muted)]">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}

        <aside className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-6">
          <h2 className="text-lg font-black uppercase">Need help?</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
            Contact Elite Setup on WhatsApp or send email to {contactEmails.support}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={whatsappContactHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--site-accent)] px-5 text-sm font-black uppercase text-white transition hover:bg-[var(--site-accent-strong)]"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${contactEmails.support}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-5 text-sm font-black uppercase text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
            >
              Email support
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default InfoPage;
