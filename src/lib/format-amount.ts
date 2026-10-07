export function sanitizePositiveDecimalInput(value: string) {
  const withoutInvalid = value.replace(",", ".").replace(/[^\d.]/g, "");
  const firstDot = withoutInvalid.indexOf(".");
  if (firstDot === -1) {
    return withoutInvalid;
  }

  return `${withoutInvalid.slice(0, firstDot + 1)}${withoutInvalid.slice(firstDot + 1).replace(/\./g, "")}`;
}

export function parseAmount(value: string) {
  const numeric = Number(sanitizePositiveDecimalInput(value));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

export function formatAmount(value: string | number, maxFractionDigits: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  const [whole, fraction = ""] = numeric.toFixed(maxFractionDigits).split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.replace(/0+$/, "");

  return trimmedFraction.length > 0 ? `${groupedWhole}.${trimmedFraction}` : groupedWhole;
}
