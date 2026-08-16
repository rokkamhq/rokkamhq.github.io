// Seller-facing copy, EN first with i18n keys (CLAUDE.md §10).
// TE/UR translation is a dedicated pass — never inline-guess translations.

const en: Record<string, string> = {
  "nav.sell": "Sell your device",
  "nav.how": "How it works",
  "nav.trust": "Why Rokkam",
  "nav.business": "For business",
  "nav.cta": "Get price",

  "hero.eyebrow": "Hyderabad & Secunderabad only — that's the point.",
  "hero.title": "Sell your phone or laptop. Cash before the agent leaves.",
  "hero.sub":
    "60-minute pickup in Hitec City, Gachibowli & central Hyderabad. Certified data wipe. The price we quote is the price we pay.",
  "hero.wa": "or get a quote on WhatsApp",
  "hero.cta": "Get my price",
  "hero.cta2": "How it works",
  "hero.badge.pickup": "60-min pickup · Zone A",
  "hero.badge.upi": "UPI paid on the spot",
  "hero.badge.wipe": "NIST-grade data wipe",

  "pillars.title": "Why sellers switch to Rokkam",
  "pillars.locked.title": "Locked Quote Guarantee",
  "pillars.locked.body":
    "Every rupee of deduction is shown before you commit. If your phone matches what you told us, the agent cannot change the price — the app won't let them.",
  "pillars.speed.title": "Fastest pickup in the city",
  "pillars.speed.body":
    "We only serve Hyderabad, so we're built for it: 60–90 minutes in Zone A, same-day almost everywhere else in GHMC.",
  "pillars.wipe.title": "Certified data destruction",
  "pillars.wipe.body":
    "Every phone gets a NIST 800-88 wipe and a signed, QR-verifiable Data Destruction Certificate. Your photos and passwords die with the handover.",
  "pillars.legit.title": "Fully legitimate",
  "pillars.legit.body":
    "IMEI checked against the national CEIR blacklist, seller KYC, GST-compliant paperwork. Clean for you, clean for us.",

  "how.title": "Sold in four steps",
  "how.step1.title": "Answer honestly",
  "how.step1.body": "Pick your device, answer a 2-minute condition check. Watch the price build line by line — no surprises later.",
  "how.step2.title": "Lock your price",
  "how.step2.body": "Your quote is locked for 7 days. Book a pickup slot that suits you.",
  "how.step3.title": "Agent verifies at your door",
  "how.step3.body": "Same checklist, same answers. Match = locked price, no haggling. Ever.",
  "how.step4.title": "Paid before they leave",
  "how.step4.body": "UPI hits your account while the agent is still at your door. Then your phone gets a certified data wipe.",

  "zones.title": "Where we pick up",
  "zones.sub": "GHMC limits only. Enter your pincode during checkout — we'll tell you your slot straight away.",
  "zones.outside": "Not in your area yet — we're expanding across GHMC first. Leave your number and we'll tell you when we arrive.",

  "faq.title": "Straight answers",
  "faq.q1": "Will the agent reduce the price at my door?",
  "faq.a1":
    "Only if the phone doesn't match your answers — and then the app recalculates using the same public deduction table, with photo evidence, and you can simply say no. Agents cannot type a price.",
  "faq.q2": "What happens to my data?",
  "faq.a2":
    "Every device is wiped to NIST 800-88 at our Hyderabad hub. You get a signed Data Destruction Certificate with a QR code anyone can verify.",
  "faq.q3": "Is this legal? What about stolen phones?",
  "faq.a3":
    "We screen every IMEI against the government CEIR blacklist before paying, keep a purchase register, and take seller KYC. Stolen devices are refused.",
  "faq.q4": "Which areas do you cover?",
  "faq.a4": "Hyderabad and Secunderabad (GHMC) only. Zone A gets 60–90 minute pickup; the rest of GHMC same-day or next-day.",

  "sell.title": "What are you selling?",
  "sell.sub": "Mobiles and laptops today. Cameras are next.",
  "sell.pickCategory": "Pick a category",
  "sell.pickBrand": "Pick your brand",
  "sell.pickModel": "Pick your model",
  "sell.upto": "Get up to",
  "sell.pickVariant": "Which storage do you have?",
  "sell.variantHint": "Check Settings → General → About if unsure.",
  "sell.pickConfig": "Which configuration is yours?",
  "sell.configHint": "Pick what's inside your machine — the price adjusts as you choose.",
  "sell.cameras.soon": "Cameras — coming soon",

  "wizard.ledgerTitle": "Your price, live",
  "wizard.base": "Base price",
  "wizard.floor": "Minimum scrap value applied",
  "wizard.next": "Next",
  "wizard.back": "Back",
  "wizard.seePrice": "Show my final price",
  "wizard.progress": "Step",

  "result.title": "Your locked price",
  "result.lockNote": "Locked for 7 days against this exact condition report.",
  "result.quoteCode": "Quote code",
  "result.pincode.label": "Your pincode",
  "result.pincode.cta": "Check pickup time",
  "result.book.wa": "Book pickup on WhatsApp",
  "result.book.soon": "Online slot booking is landing shortly — WhatsApp booking opens first.",
  "result.restart": "Re-check with different answers",

  "booking.title": "Book your pickup",
  "booking.phone.label": "Your mobile number",
  "booking.phone.cta": "Send OTP",
  "booking.otp.label": "Enter the 6-digit code sent to",
  "booking.otp.cta": "Verify",
  "booking.address.line1": "Flat / house, street, area",
  "booking.address.line2": "Landmark (optional)",
  "booking.address.cta": "Find pickup slots",
  "booking.done.title": "Pickup booked ✅",
  "booking.done.body": "Your order number is",
  "booking.done.amount": "Agent pays you via UPI on verification:",

  "decline.title": "We can't buy this one",
  "decline.body":
    "We're unable to complete this purchase. Nothing is wrong with asking — but this device doesn't fit what we can legally buy and resell.",
  "decline.back": "Check a different phone",

  "footer.tagline": "Hyderabad's own re-commerce. Built local, paid instant.",
  "footer.compliance":
    "CEIR-screened purchases · KYC on every transaction · GST margin-scheme invoicing · DPDPA-aligned data handling",
  "footer.languages": "తెలుగు and اردو coming soon",
};

export function t(key: string): string {
  return en[key] ?? key;
}
