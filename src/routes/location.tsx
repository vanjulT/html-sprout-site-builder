import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog, type Confirmation } from "@/components/site/ConfirmationDialog";
import { DateTimeField, adjustedEnd } from "@/components/site/DateTimeField";
import {
  BookingLayout,
  Field,
  FormSection,
  Note,
  OptionRow,
  OptionalTag,
  PageIntro,
  Segmented,
  Summary,
  SummaryRow,
  SummaryTotal,
  invalidClass,
} from "@/components/site/form";
import { useI18n } from "@/lib/i18n";
import { daysFromNow, formatShort, parseLocalIso } from "@/lib/datetime";
import { CARS, RENTAL_OPTIONS, rentalQuote, type Car, type RentalOptionId } from "@/lib/pricing";
import { isEmail, isPhone, makeRef, type Terminal } from "@/lib/site";
import { cn } from "@/lib/utils";

type Search = {
  start?: string | undefined;
  end?: string | undefined;
  place?: Terminal | undefined;
};

export const Route = createFileRoute("/location")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    start: typeof s["start"] === "string" ? s["start"] : undefined,
    end: typeof s["end"] === "string" ? s["end"] : undefined,
    place: s["place"] === "T1" || s["place"] === "T2" ? s["place"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Location de véhicules · Aéroport de Nice | Azur Voiturier" },
      {
        name: "description",
        content:
          "Location de voiture livrée au dépose-minute de l'aéroport Nice Côte d'Azur, T1 ou T2. Citadine dès 39 € TTC par jour.",
      },
      { property: "og:title", content: "Location de véhicules livrés à l'aéroport de Nice" },
      {
        property: "og:description",
        content: "Votre véhicule vous attend au dépose-minute. Dès 39 € TTC par jour.",
      },
    ],
  }),
  component: RentalPage,
});

type Errors = Partial<Record<"name" | "phone" | "email" | "car", string | undefined>>;

function RentalPage() {
  const { t, eur } = useI18n();
  const search = Route.useSearch();
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [place, setPlace] = useState<Terminal>(search.place ?? "T2");
  const [returnPlace, setReturnPlace] = useState<Terminal>(search.place ?? "T2");
  const [flight, setFlight] = useState("");
  const [car, setCar] = useState<Car | null>(null);
  const [options, setOptions] = useState<RentalOptionId[]>([]);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showDateError, setShowDateError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);

  useEffect(() => {
    setStart(parseLocalIso(search.start) ?? daysFromNow(1, 10));
    setEnd(parseLocalIso(search.end) ?? daysFromNow(4, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = rentalQuote({ car, start, end, options });
  const set = (k: keyof typeof contact) => (e: ChangeEvent<HTMLInputElement>) => {
    setContact((c) => ({ ...c, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const toggleOption = (id: RentalOptionId) =>
    setOptions((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const pay = () => {
    setShowDateError(true);
    const er: Errors = {};
    if (!car) er.car = t.rental.chooseCar;
    if (!contact.name.trim()) er.name = t.common.errors.name;
    if (!isPhone(contact.phone)) er.phone = t.common.errors.phone;
    if (!isEmail(contact.email)) er.email = t.common.errors.email;
    setErrors(er);
    if (q.error || Object.keys(er).length) {
      document
        .querySelector("[data-invalid]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setDone({
        title: t.rental.successTitle,
        text: t.rental.successText,
        reference: makeRef("AL"),
        lines: [
          [t.rental.vehicle, car ? `${t.rental.categories[car.id]} · ${car.model}` : "—"],
          [t.rental.start, `${formatShort(start, t.locale)} · ${place}`],
          [t.rental.end, `${formatShort(end, t.locale)} · ${returnPlace}`],
          [
            t.rental.options,
            options.map((o) => t.rental.optionLabels[o]).join(", ") || t.common.none,
          ],
          [t.rental.depositLabel, car ? t.rental.depositValue(eur(car.deposit)) : "—"],
          [t.rental.paid, `${eur(q.total)} ${t.common.vat}`],
        ],
      });
    }, 1200);
  };

  const placeOptions = [
    { value: "T1" as const, label: t.common.dropZone("T1") },
    { value: "T2" as const, label: t.common.dropZone("T2") },
  ];

  return (
    <>
      <PageIntro eyebrow={t.rental.eyebrow} title={t.rental.title} lead={t.rental.lead} />
      <BookingLayout
        form={
          <form noValidate onSubmit={(e) => e.preventDefault()}>
            <FormSection title={t.rental.delivery}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label={t.rental.start}
                  htmlFor="r-start"
                  error={showDateError && q.error ? t.common.dateErrors[q.error] : undefined}
                >
                  <DateTimeField
                    id="r-start"
                    value={start}
                    invalid={showDateError && !!q.error}
                    onChange={(d) => {
                      const e = adjustedEnd(start, d, end);
                      if (e) {
                        setEnd(e);
                        toast(t.dt.adjusted(formatShort(e, t.locale)));
                      }
                      setStart(d);
                    }}
                  />
                </Field>
                <Field label={t.rental.deliveryPlace}>
                  <Segmented
                    label={t.rental.deliveryPlace}
                    value={place}
                    onChange={setPlace}
                    options={placeOptions}
                  />
                </Field>
                <Field label={t.common.flight} htmlFor="r-flight" className="md:col-span-2">
                  <Input
                    id="r-flight"
                    value={flight}
                    onChange={(e) => setFlight(e.target.value)}
                    placeholder={t.common.flightPh}
                    autoComplete="off"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title={t.rental.returnTitle}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t.rental.end} htmlFor="r-end">
                  <DateTimeField id="r-end" value={end} onChange={setEnd} after={start} />
                </Field>
                <Field label={t.rental.returnPlace}>
                  <Segmented
                    label={t.rental.returnPlace}
                    value={returnPlace}
                    onChange={setReturnPlace}
                    options={placeOptions}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title={t.rental.vehicles}>
              <div className="flex flex-col gap-3" data-invalid={errors.car ? "" : undefined}>
                {CARS.map((c) => {
                  const selected = car?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border bg-card px-5 py-4 transition-colors",
                        selected ? "border-foreground" : "border-input",
                      )}
                    >
                      <div className="min-w-[12rem] flex-1">
                        <p className="font-display text-2xl">{t.rental.categories[c.id]}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.model} {t.rental.orSimilar}
                        </p>
                        <p className="mt-2 text-[13px] text-muted-foreground">
                          {[
                            t.rental.seats(c.seats),
                            c.automatic ? t.rental.automatic : t.rental.manual,
                            t.rental.km(c.kmPerDay),
                            t.rental.deposit(eur(c.deposit)),
                          ].join(" · ")}
                        </p>
                      </div>
                      <p className="flex items-baseline gap-1.5">
                        <span className="figure text-3xl">{eur(c.pricePerDay)}</span>
                        <span className="text-sm text-muted-foreground">{t.common.perDay}</span>
                      </p>
                      <Button
                        type="button"
                        variant={selected ? "default" : "outline"}
                        aria-pressed={selected}
                        onClick={() => {
                          setCar(c);
                          setErrors((er) => ({ ...er, car: undefined }));
                        }}
                      >
                        {selected && <Check />}
                        {selected ? t.rental.selected : t.rental.choose}
                      </Button>
                    </div>
                  );
                })}
                {errors.car && (
                  <p className="text-[13px] font-medium text-destructive">{errors.car}</p>
                )}
              </div>
            </FormSection>

            <FormSection title={t.rental.options} aside={<OptionalTag />}>
              <div className="flex flex-col gap-2.5">
                {RENTAL_OPTIONS.map((o) => (
                  <OptionRow
                    key={o.id}
                    label={t.rental.optionLabels[o.id]}
                    price={`+${eur(o.price)}${o.perDay ? ` ${t.common.perDay}` : ""}`}
                    checked={options.includes(o.id)}
                    onToggle={() => toggleOption(o.id)}
                  />
                ))}
              </div>
            </FormSection>

            <FormSection title={t.valet.contact} hint={t.valet.contactHint}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t.common.name} htmlFor="r-name" error={errors.name}>
                  <Input
                    id="r-name"
                    value={contact.name}
                    onChange={set("name")}
                    autoComplete="name"
                    placeholder={t.common.namePh}
                    className={errors.name ? invalidClass : undefined}
                  />
                </Field>
                <Field label={t.common.phone} htmlFor="r-phone" error={errors.phone}>
                  <Input
                    id="r-phone"
                    type="tel"
                    value={contact.phone}
                    onChange={set("phone")}
                    autoComplete="tel"
                    placeholder={t.common.phonePh}
                    className={errors.phone ? invalidClass : undefined}
                  />
                </Field>
                <Field
                  label={t.common.email}
                  htmlFor="r-mail"
                  error={errors.email}
                  className="md:col-span-2"
                >
                  <Input
                    id="r-mail"
                    type="email"
                    value={contact.email}
                    onChange={set("email")}
                    autoComplete="email"
                    placeholder={t.common.emailPh}
                    className={errors.email ? invalidClass : undefined}
                  />
                </Field>
              </div>
            </FormSection>
          </form>
        }
        summary={
          <Summary title={t.common.summary}>
            <SummaryRow
              label={t.rental.vehicle}
              value={car ? t.rental.categories[car.id] : t.rental.toChoose}
            />
            <SummaryRow label={t.rental.duration} value={q.days ? t.common.days(q.days) : "—"} />
            <SummaryRow label={t.rental.delivery} value={place} />
            <SummaryRow label={t.rental.returnTitle} value={returnPlace} />
            <SummaryRow
              label={t.rental.options}
              value={q.options ? eur(q.options) : t.common.none}
            />
            <SummaryTotal label={t.common.total} value={eur(q.total)} suffix={t.common.vat} />
            <Button size="lg" className="w-full" onClick={pay} disabled={busy}>
              <Lock />
              {busy ? t.common.processing : t.rental.pay}
            </Button>
            {q.error && showDateError && <Note tone="error">{t.common.dateErrors[q.error]}</Note>}
            <Note>{t.common.secure}</Note>
            <Note>{t.rental.idNote}</Note>
            <Note>{t.rental.depositNote}</Note>
          </Summary>
        }
      />
      <ConfirmationDialog data={done} onClose={() => setDone(null)} />
    </>
  );
}
