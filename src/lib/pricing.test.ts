import { describe, expect, it } from "vitest";
import {
  CARS,
  rentalQuote,
  startedDays,
  suggestFullClean,
  toggleValetOption,
  valetQuote,
  vtcNeedsVan,
} from "./pricing";

const now = new Date("2026-06-01T08:00:00");
const at = (iso: string) => new Date(iso);

describe("valet parking", () => {
  it("charges 50 € per started 24 h slot", () => {
    const q = valetQuote({ drop: at("2026-06-02T08:00"), pick: at("2026-06-04T09:00"), options: [], now });
    expect(q.slots).toBe(3);
    expect(q.total).toBe(150);
  });

  it("charges at least one slot for a short stay", () => {
    expect(startedDays(at("2026-06-02T08:00"), at("2026-06-02T10:00"))).toBe(1);
  });

  it("adds cleaning options: full clean costs 75 €", () => {
    const q = valetQuote({ drop: at("2026-06-02T08:00"), pick: at("2026-06-03T08:00"), options: ["complet"], now });
    expect(q.total).toBe(125);
  });

  it("full clean replaces interior and exterior", () => {
    expect(toggleValetOption(["int", "ext"], "complet")).toEqual(["complet"]);
    expect(toggleValetOption(["complet"], "int")).toEqual(["int"]);
  });

  it("suggests the full clean when both single cleans are picked", () => {
    expect(suggestFullClean(["int", "ext"])).toBe(true);
    expect(suggestFullClean(["int"])).toBe(false);
  });

  it("refuses a drop-off in the past", () => {
    const q = valetQuote({ drop: at("2026-05-30T08:00"), pick: at("2026-06-03T08:00"), options: [], now });
    expect(q.total).toBe(0);
    expect(q.error).toBe("past");
  });
});

describe("VTC", () => {
  it("requires the van above 3 passengers or 3 bags", () => {
    expect(vtcNeedsVan(3, 3)).toBe(false);
    expect(vtcNeedsVan(4, 1)).toBe(true);
    expect(vtcNeedsVan(2, 4)).toBe(true);
  });
});

describe("rental", () => {
  const berline = CARS.find((c) => c.id === "berline")!;

  it("charges the daily rate per started day", () => {
    const q = rentalQuote({ car: berline, start: at("2026-06-02T10:00"), end: at("2026-06-05T10:00"), options: [], now });
    expect(q.days).toBe(3);
    expect(q.total).toBe(177);
  });

  it("charges reinforced insurance 15 € per day, other options once", () => {
    const q = rentalQuote({
      car: berline,
      start: at("2026-06-02T10:00"),
      end: at("2026-06-05T10:00"),
      options: ["insurance", "driver"],
      now,
    });
    expect(q.options).toBe(45 + 30);
  });
});
