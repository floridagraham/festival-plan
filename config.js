// Supabase project for shared picks (Project Settings > API Keys). The publishable key is meant to be
// public; the database's row level security is what keeps picks private to your group.
// Leave these empty and the app runs in on-device-only mode.
window.EDC_CONFIG = {
  supabaseUrl: "https://igkqzqczjcnqmxliprje.supabase.co",
  supabaseAnonKey: "sb_publishable_adXOJbtS1ssTU4AAgCG7SA_4uokwiCC",
  // Tip links, one button each (Venmo, Cash App, Ko-fi, PayPal.me...). Empty list = no tip buttons.
  donateLinks: [
    // amountUrl (optional): the same link with a dollar amount filled in; {amount} is replaced by 5, 10 or 20
    { label: "Venmo", url: "https://venmo.com/u/federated", amountUrl: "https://venmo.com/federated?txn=pay&amount={amount}&note=Your%20Festival%20Plan" },
    { label: "Cash App", url: "https://cash.app/$FloridaGraham", amountUrl: "https://cash.app/$FloridaGraham/{amount}" }
  ],
  // Where Insomniac (or anyone) can reach Graham about working together, e.g. his Linktree.
  // Empty = the "Insomniac team" notes on the Show your love card and in the footer stay hidden.
  partnerLink: "",
  // Graham's public contact address (never his personal Gmail: thousands of people will see it).
  // Shows "Send me a note" on the Show your love card, and is the "Are you Insomniac?" Contact me
  // when partnerLink is empty. Empty = both stay hidden.
  contactEmail: "hello@glowbop.com"
};
