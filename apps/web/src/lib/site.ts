export const SITE = {
  name: "Rokkam",
  nameTelugu: "రొక్కం",
  // Set by the deploy workflow; custom domain rokkam.in once purchased.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  city: "Hyderabad",
  // WhatsApp Business number pending from client — leave empty to show "coming soon".
  whatsappNumber: "",
};

export function whatsappLink(text: string): string | null {
  if (!SITE.whatsappNumber) return null;
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
