const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatInr(amount: number): string {
  return `₹${inr.format(Math.abs(amount))}`;
}

/** Signed ledger amount: "− ₹1,200" / "+ ₹300". */
export function formatSigned(amount: number): string {
  return `${amount < 0 ? "−" : "+"} ${formatInr(amount)}`;
}
