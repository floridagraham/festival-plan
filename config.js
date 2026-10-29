// Supabase project for shared picks (Project Settings > API Keys). The publishable key is meant to be
// public; the database's row level security is what keeps picks private to your group.
// Leave these empty and the app runs in on-device-only mode.
window.EDC_CONFIG = {
  supabaseUrl: "https://igkqzqczjcnqmxliprje.supabase.co",
  supabaseAnonKey: "sb_publishable_adXOJbtS1ssTU4AAgCG7SA_4uokwiCC",
  // Tip links, one button each (Venmo, Cash App, Ko-fi, PayPal.me...). Empty list = no tip buttons.
  donateLinks: [
    // amountUrl (optional): the same link with a dollar amount filled in; {amount} is replaced by 5, 10 or 20
    // amountLinks (optional): one ready-made https link per amount, e.g. { "5": "...", "10": "...", "20": "..." };
    // wins over amountUrl. An amount with no link here falls back to amountUrl, or to the plain url.
    { label: "Venmo", url: "https://venmo.com/u/federated", amountUrl: "https://venmo.com/federated?txn=pay&amount={amount}&note=Your%20Festival%20Plan" },
    { label: "Cash App", url: "https://cash.app/$FloridaGraham", amountUrl: "https://cash.app/$FloridaGraham/{amount}",
      // Cash App payment links Graham made in the app (amount + note "Your Festival Plan" filled in), Oct 29
      amountLinks: { "5": "https://cash.app/pay/link/n372fwti", "10": "https://cash.app/pay/link/phdlvm37", "20": "https://cash.app/pay/link/7a2l0c2c" } }
  ],
  // Where Insomniac (or anyone) can reach Graham about working together, e.g. his Linktree.
  // Empty = the Insomniac contact uses contactEmail instead.
  partnerLink: "",
  // Graham's personal page (https). Shows "More about me" under his name on the Made by Graham card. Empty = hidden.
  personalLink: "https://glowbop.com/graham",
  // Graham's public contact address (never his personal Gmail: thousands of people will see it).
  // Used by "Let's talk", "Send me a note", the Insomniac contact, the "Built by" lines, "Other" in the
  // festival vote and the next-year list. Empty = all of those stay hidden.
  contactEmail: "hello@glowbop.com",
  // "Send me a note" box (Oct 28): Graham's Google Form "Your Festival Plan notes" (owned by his Google account,
  // emails him on every response, linked to the sheet "Your Festival Plan notes"). url is the form's formResponse
  // address; note / name / email are its entry IDs. Empty url = the note button opens an email instead.
  noteForm: {
    url: "https://docs.google.com/forms/d/e/1FAIpQLSe4sp1M7L2iMiwMrXCLuvKJXSpeauXWYSYMkD8H-Zilq7HEAg/formResponse",
    note: "entry.273069883", name: "entry.784140844", email: "entry.1468975052"
  },
  // The app's public link, used when people share it.
  appUrl: "https://festplan.glowbop.com/",
  // "Used by N festival-goers" in Quick start and the Made by Graham sheet. Put the real count from PostHog
  // here (a plain number, e.g. 2437; it shows rounded down as "2,400+"). Empty = hidden.
  usedByCount: "",
  // "Want this for next year's festival? Get it first." Paste a Google Form link here (https) to collect
  // emails there. Empty = the button opens an email to contactEmail with the subject "Next year list".
  nextYearForm: "",
  // "What's your next festival?" vote. Each tap is one tracked event (edc_vote_next_festival, festival: key).
  nextFestivals: [
    { key: "edc-las-vegas", name: "EDC Las Vegas" },
    { key: "ultra", name: "Ultra" },
    { key: "electric-forest", name: "Electric Forest" },
    { key: "lost-lands", name: "Lost Lands" },
    { key: "beyond-wonderland", name: "Beyond Wonderland" },
    { key: "okeechobee", name: "Okeechobee" },
    { key: "coachella", name: "Coachella" },
    { key: "tomorrowland", name: "Tomorrowland" },
    { key: "hard-summer", name: "Hard Summer" },
    { key: "imagine", name: "Imagine" }
  ]
};
