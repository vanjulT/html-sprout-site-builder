export const SITE = {
  name: "Azur Voiturier",
  // International format without "+", e.g. "33612345678". Empty = WhatsApp link shows a notice.
  whatsapp: "",
  quoteDelay: "2 h",
};

export const NAV = [
  { to: "/voiturier", label: "Voiturier" },
  { to: "/vtc", label: "VTC" },
  { to: "/location", label: "Location" },
  { to: "/abonnement", label: "Abonnement" },
] as const;

export const PLACES = [
  "Nice, Promenade des Anglais",
  "Nice, Vieux-Nice",
  "Cannes, La Croisette",
  "Antibes, Juan-les-Pins",
  "Monaco, Monte-Carlo",
  "Menton, centre",
  "Èze village",
  "Saint-Jean-Cap-Ferrat",
  "Villefranche-sur-Mer",
  "Grasse, centre",
  "Saint-Tropez",
  "Sophia Antipolis",
];

export const TERMINALS = ["T1", "T2"] as const;
export type Terminal = (typeof TERMINALS)[number];

export const makeRef = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
export const isPhone = (v: string) => v.replace(/\D/g, "").length >= 9;
