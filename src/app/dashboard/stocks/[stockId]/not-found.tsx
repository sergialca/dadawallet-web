import Link from "next/link";

export default function StockNotFound() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Stock not found</h1>
      <Link className="text-sm font-semibold text-primary-container" href="/dashboard/stocks">
        Back to stocks
      </Link>
    </section>
  );
}
