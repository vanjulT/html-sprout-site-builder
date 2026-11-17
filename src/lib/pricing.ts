// Pricing and booking rules for Azur Voiturier. All amounts are euros TTC.

export const DAY_MS = 24 * 60 * 60 * 1000;
export const SLOT_MINUTES = 30;
export const MIN_LEAD_MINUTES = 60;
export const MAX_MONTHS_AHEAD = 12;

/* ---------- Valet parking ---------- */

export const VALET_PRICE_PER_24H = 50;

export type ValetOptionId = "int" | "ext" | "complet";
export const VALET_OPTIONS: { id: ValetOptionId; price: number }[] = [
  { id: "int", price: 50 },
  { id: "ext", price: 50 },
  { id: "complet", price: 75 },
];

/** Why a date range can't be priced yet. */
export type DateError = "missing" | "past" | "order" | null;

/** Number of started 24 h periods between two dates (minimum 1). 0 when invalid. */
export function startedDays(start: Date | null, end: Date | null): number {
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  if (!(ms > 0)) return 0;
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

/** Selecting the full clean removes the single cleans, and vice versa. */
export function toggleValetOption(current: ValetOptionId[], id: ValetOptionId): ValetOptionId[] {
  if (current.includes(id)) return current.filter((x) => x !== id);
  if (id === "complet") return ["complet"];
  return [...current.filter((x) => x !== "complet"), id];
}

/** True when both single cleans are picked: the full clean is 25 € cheaper. */
export function suggestFullClean(options: ValetOptionId[]): boolean {
  return options.includes("int") && options.includes("ext");
}

export function valetQuote(input: {
  drop: Date | null;
  pick: Date | null;
  options: ValetOptionId[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  let error: DateError = null;
  if (!input.drop || !input.pick) error = "missing";
  else if (input.drop < now) error = "past";
  else if (input.pick <= input.drop) error = "order";
  const slots = error ? 0 : startedDays(input.drop, input.pick);
  const parking = slots * VALET_PRICE_PER_24H;
  const options = VALET_OPTIONS.filter((o) => input.options.includes(o.id)).reduce(
    (sum, o) => sum + o.price,
    0,
  );
  return { slots, parking, options, total: slots ? parking + options : 0, error };
}

/* ---------- VTC ---------- */

export const VTC_VEHICLES = [
  { id: "Berline", seats: 3, bags: 3 },
  { id: "Van", seats: 7, bags: 6 },
] as const;

/** Beyond 3 passengers or 3 bags, only the van fits. */
export function vtcNeedsVan(passengers: number, bags: number): boolean {
  return passengers > 3 || bags > 3;
}

/* ---------- Rental ---------- */

export type Car = {
  id: "citadine" | "berline" | "suv";
  model: string;
  seats: number;
  automatic: boolean;
  kmPerDay: number;
  deposit: number;
  pricePerDay: number;
};

export const CARS: Car[] = [
  { id: "citadine", model: "Peugeot 208", seats: 5, automatic: false, kmPerDay: 250, deposit: 800, pricePerDay: 39 },
  { id: "berline", model: "Peugeot 508", seats: 5, automatic: true, kmPerDay: 300, deposit: 1200, pricePerDay: 59 },
  { id: "suv", model: "Peugeot 3008", seats: 5, automatic: true, kmPerDay: 300, deposit: 1500, pricePerDay: 79 },
];

export type RentalOptionId = "driver" | "insurance" | "seat" | "fuel";
export const RENTAL_OPTIONS: { id: RentalOptionId; price: number; perDay?: boolean }[] = [
  { id: "driver", price: 30 },
  { id: "insurance", price: 15, perDay: true },
  { id: "seat", price: 25 },
  { id: "fuel", price: 70 },
];

export function rentalQuote(input: {
  car: Car | null;
  start: Date | null;
  end: Date | null;
  options: RentalOptionId[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  let error: DateError = null;
  if (!input.start || !input.end) error = "missing";
  else if (input.start < now) error = "past";
  else if (input.end <= input.start) error = "order";
  const days = error ? 0 : startedDays(input.start, input.end);
  const options = RENTAL_OPTIONS.filter((o) => input.options.includes(o.id)).reduce(
    (sum, o) => sum + o.price * (o.perDay ? Math.max(days, 1) : 1),
    0,
  );
  const base = input.car && days ? input.car.pricePerDay * days : 0;
  return { days, base, options, total: base ? base + options : 0, error };
}

/* ---------- Annual subscription ---------- */

export const SUBSCRIPTION = {
  pricePerYear: 2090,
  pickups: 25,
  returns: 25,
  extraTrip: 45,
};

/* ---------- Formatting ---------- */

export const formatEur = (n: number, locale = "fr-FR") => n.toLocaleString(locale);
