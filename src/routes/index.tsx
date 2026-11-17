import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimeField, adjustedEnd } from "@/components/site/DateTimeField";
import { Field, Segmented } from "@/components/site/form";
import { useI18n } from "@/lib/i18n";
import { daysFromNow, toLocalIso } from "@/lib/datetime";
import { SUBSCRIPTION, VALET_PRICE_PER_24H, startedDays } from "@/lib/pricing";
import { PLACES, type Terminal } from "@/lib/site";
import { cn } from "@/lib/utils";
import curbPhoto from "@/assets/nice-airport-curb.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Azur Voiturier · Voiturier, VTC et location à l'aéroport de Nice" },
      {
        name: "description",
        content:
          "Parking voiturier dès 50 € TTC / 24 h, chauffeur privé et location de véhicules au dépose-minute de l'aéroport Nice Côte d'Azur, terminaux 1 et 2.",
      },
      { property: "og:title", content: "Azur Voiturier · Aéroport Nice Côte d'Azur" },
      {
        property: "og:description",
        content: "Voiturier, chauffeur privé et location de véhicules au dépose-minute de l'aéroport de Nice.",
      },
    ],
  }),
  component: Home,
});

type Tab = "valet" | "vtc" | "rental";

function BookingWidget() {
  const { t, eur } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("valet");

  const [drop, setDrop] = useState<Date | null>(null);
  const [pick, setPick] = useState<Date | null>(null);
  const [term, setTerm] = useState<Terminal>("T2");
  const [dir, setDir] = useState<"to" | "from">("to");
  const [addr, setAddr] = useState("");
  const [rideDate, setRideDate] = useState<Date | null>(null);
  const [pax, setPax] = useState(2);
  const [rStart, setRStart] = useState<Date | null>(null);
  const [rEnd, setREnd] = useState<Date | null>(null);
  const [place, setPlace] = useState<Terminal>("T2");

  useEffect(() => {
    setDrop(daysFromNow(1, 8));
    setPick(daysFromNow(5, 20));
    setRideDate(daysFromNow(1, 9));
    setRStart(daysFromNow(1, 10));
    setREnd(daysFromNow(4, 10));
  }, []);

  const valid = drop && pick && pick > drop && drop > new Date();
  const slots = valid ? startedDays(drop, pick) : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "valet", label: t.home.tabs.valet },
    { id: "vtc", label: t.home.tabs.vtc },
    { id: "rental", label: t.home.tabs.rental },
  ];

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex border-b" role="tablist">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              "relative flex-1 py-4 text-[14.5px] font-semibold transition-colors",
              tab === x.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.label}
            {tab === x.id && <span className="absolute inset-x-6 -bottom-px h-[2px] bg-sun" />}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-7">
        {tab === "valet" && (
          <div className="fade-in flex flex-col gap-4">
            <Field label={t.home.drop} htmlFor="h-drop">
              <DateTimeField
                id="h-drop"
                value={drop}
                onChange={(d) => {
                  const e = adjustedEnd(drop, d, pick);
                  if (e) setPick(e);
                  setDrop(d);
                }}
              />
            </Field>
            <Field label={t.home.pick} htmlFor="h-pick">
              <DateTimeField id="h-pick" value={pick} onChange={setPick} after={drop} />
            </Field>
            <Field label={t.common.terminal}>
              <Segmented
                label={t.common.terminal}
                value={term}
                onChange={setTerm}
                options={[
                  { value: "T1", label: "Terminal 1" },
                  { value: "T2", label: "Terminal 2" },
                ]}
              />
            </Field>
            <div className="flex items-baseline justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                {slots ? t.home.estimate(slots) : t.home.checkDates}
              </span>
              <span className="figure text-3xl">{eur(slots * VALET_PRICE_PER_24H)}</span>
            </div>
            <Button
              size="lg"
              onClick={() =>
                navigate({
                  to: "/voiturier",
                  search: {
                    drop: drop ? toLocalIso(drop) : undefined,
                    pick: pick ? toLocalIso(pick) : undefined,
                    term,
                  },
                })
              }
            >
              {t.home.valetCta}
              <ArrowRight />
            </Button>
          </div>
        )}

        {tab === "vtc" && (
          <div className="fade-in flex flex-col gap-4">
            <Field label={t.home.direction}>
              <Segmented
                label={t.home.direction}
                value={dir}
                onChange={setDir}
                options={[
                  { value: "to", label: t.home.toAirport },
                  { value: "from", label: t.home.fromAirport },
                ]}
              />
            </Field>
            <Field label={t.home.address} htmlFor="h-addr">
              <Input
                id="h-addr"
                list="h-places"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder={t.home.addressPh}
              />
              <datalist id="h-places">
                {PLACES.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
              <Field label={t.home.dateTime} htmlFor="h-ride">
                <DateTimeField id="h-ride" value={rideDate} onChange={setRideDate} />
              </Field>
              <Field label={t.home.passengers} htmlFor="h-pax">
                <select
                  id="h-pax"
                  value={pax}
                  onChange={(e) => setPax(+e.target.value)}
                  className="h-14 rounded-md border border-input bg-card px-3 text-[15px]"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Button
              size="lg"
              className="mt-2"
              onClick={() =>
                navigate({
                  to: "/vtc",
                  search: { dir, addr: addr || undefined, date: rideDate ? toLocalIso(rideDate) : undefined, pax },
                })
              }
            >
              {t.home.vtcCta}
              <ArrowRight />
            </Button>
          </div>
        )}

        {tab === "rental" && (
          <div className="fade-in flex flex-col gap-4">
            <Field label={t.home.rentStart} htmlFor="h-rs">
              <DateTimeField
                id="h-rs"
                value={rStart}
                onChange={(d) => {
                  const e = adjustedEnd(rStart, d, rEnd);
                  if (e) setREnd(e);
                  setRStart(d);
                }}
              />
            </Field>
            <Field label={t.home.rentEnd} htmlFor="h-re">
              <DateTimeField id="h-re" value={rEnd} onChange={setREnd} after={rStart} />
            </Field>
            <Field label={t.home.delivery}>
              <Segmented
                label={t.home.delivery}
                value={place}
                onChange={setPlace}
                options={[
                  { value: "T1", label: t.common.dropZone("T1") },
                  { value: "T2", label: t.common.dropZone("T2") },
                ]}
              />
            </Field>
            <Button
              size="lg"
              className="mt-2"
              onClick={() =>
                navigate({
                  to: "/location",
                  search: {
                    start: rStart ? toLocalIso(rStart) : undefined,
                    end: rEnd ? toLocalIso(rEnd) : undefined,
                    place,
                  },
                })
              }
            >
              {t.home.rentalCta}
              <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Home() {
  const { t, eur } = useI18n();
  const services = [
    { key: "valet", to: "/voiturier", ...t.home.services.valet },
    { key: "vtc", to: "/vtc", ...t.home.services.vtc },
    { key: "rental", to: "/location", ...t.home.services.rental },
  ] as const;

  return (
    <>
      {/* Intro + booking */}
      <section className="site-container grid gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div className="fade-in">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1 className="mt-6 text-5xl leading-[1.02] md:text-7xl">
            {t.home.title1}
            <br />
            <em className="text-azur-deep">{t.home.title2}</em>
          </h1>
          <p className="mt-7 max-w-lg text-lg text-muted-foreground">{t.home.lead}</p>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14.5px] font-medium">
            {t.home.facts.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-sun" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <BookingWidget />
      </section>

      {/* Photo */}
      <div className="site-container">
        <img
          src={curbPhoto}
          alt={t.home.imageAlt}
          width={1920}
          height={960}
          className="aspect-[2.2/1] w-full rounded-lg object-cover"
        />
      </div>

      {/* Services */}
      <section className="site-container py-20 md:py-28">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <p className="eyebrow">{t.home.servicesEyebrow}</p>
            <h2 className="mt-4 text-4xl md:text-5xl">{t.home.servicesTitle}</h2>
          </div>
          <p className="max-w-md text-muted-foreground md:justify-self-end">{t.home.servicesLead}</p>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {services.map((s, i) => (
            <article key={s.key} className="flex flex-col border-t border-foreground pt-6">
              <span className="text-sm font-semibold text-muted-foreground tabular-nums">0{i + 1}</span>
              <h3 className="mt-3 text-[1.75rem]">{s.title}</h3>
              <p className="mt-3 flex-1 text-[15px] text-muted-foreground">{s.text}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="figure text-3xl">{s.price}</span>
                <span className="text-sm text-muted-foreground">{s.unit}</span>
              </p>
              <Link to={s.to} className="text-link mt-5 self-start text-[15px] font-semibold">
                {s.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-paper">
        <div className="site-container py-20 md:py-24">
          <p className="eyebrow">{t.home.howEyebrow}</p>
          <h2 className="mt-4 text-4xl md:text-5xl">{t.home.howTitle}</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
            {t.home.steps.map((s, i) => (
              <li key={s.title}>
                <span className="figure text-6xl text-azur-deep">{i + 1}</span>
                <h3 className="mt-4 text-2xl">{s.title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Subscription */}
      <section className="site-container py-20 md:py-28">
        <div className="grid gap-8 rounded-lg border bg-card p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
          <div>
            <p className="eyebrow">{t.home.subEyebrow}</p>
            <h2 className="mt-4 text-3xl md:text-4xl">{t.home.subTitle}</h2>
            <p className="mt-4 max-w-xl text-muted-foreground">{t.home.subText}</p>
          </div>
          <div className="md:text-right">
            <p className="figure text-5xl">{eur(SUBSCRIPTION.pricePerYear)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.common.vat} {t.common.perYear}
            </p>
            <Button asChild variant="outline" size="lg" className="mt-6">
              <Link to="/abonnement">
                {t.home.subCta}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
