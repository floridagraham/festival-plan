// Supabase project for shared picks (Project Settings > API Keys). The publishable key is meant to be
// public; the database's row level security is what keeps picks private to your group.
// Leave these empty and the app runs in on-device-only mode.
window.EDC_CONFIG = {
  supabaseUrl: "https://igkqzqczjcnqmxliprje.supabase.co",
  supabaseAnonKey: "sb_publishable_adXOJbtS1ssTU4AAgCG7SA_4uokwiCC",
  // Tip links, one button each (Venmo, Cash App, Ko-fi, PayPal.me...). Empty list = no tip buttons.
  donateLinks: [
    { label: "Venmo", url: "https://venmo.com/u/federated" },
    { label: "Cash App", url: "https://cash.app/$FloridaGraham" }
  ]
};
