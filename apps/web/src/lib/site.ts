export const SITE = {
  name: "Rokkam",
  nameTelugu: "రొక్కం",
  url: "https://rokkam.pages.dev", // custom domain rokkam.in once purchased
  city: "Hyderabad",
  // WhatsApp Business number pending from client — leave empty to show "coming soon".
  whatsappNumber: "",
};

export function whatsappLink(text: string): string | null {
  if (!SITE.whatsappNumber) return null;
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
