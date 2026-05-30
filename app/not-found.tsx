import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-full place-items-center bg-[var(--site-bg)] px-6 py-24 text-[var(--site-text)] sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="mx-auto w-16 rounded-full bg-[var(--site-accent)] py-2 text-lg font-semibold text-white">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-[var(--site-muted)]">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6 max-[350px]:flex-col max-[350px]:gap-y-5">
          <Link href="/" className="theme-button rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm">
            Go back home
          </Link>
          <Link href="#" className="text-sm font-semibold text-[var(--site-accent)] hover:underline hover:underline-offset-4">
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
