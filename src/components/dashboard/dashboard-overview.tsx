import Link from "next/link";

function greetingForHour(hour: number) {
  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

const DASHBOARD_CARDS = [
  { href: "/dashboard/stocks", label: "Stocks" },
  { href: "/dashboard/activity", label: "Activity" },
] as const;

export function DashboardOverview() {
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="label-caps flex items-center gap-2 text-secondary">
            <span className="h-2 w-2 rounded-full bg-primary-container shadow-[0_0_8px_rgb(0_231_254_/_0.8)]" />
            Operational · Layer-1 fastlane
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface md:text-[28px] md:leading-9">
            {greetingForHour(now.getHours())}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {dateLabel} · Global markets live
          </p>
        </div>

        <label className="relative w-full max-w-md">
          <span className="sr-only">Search stocks, tokens, actions</span>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            fill="none"
            viewBox="0 0 16 16"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <input
            className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-2.5 pl-9 pr-4 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary-container"
            placeholder="Search stocks, tokens, actions..."
            type="search"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DASHBOARD_CARDS.map((card) => (
          <Link
            key={card.href}
            className="flex h-32 items-start rounded-lg border border-outline-variant bg-surface-container p-5 text-2xl font-semibold tracking-tight text-on-surface scanline neon-bloom"
            href={card.href}
          >
            {card.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
