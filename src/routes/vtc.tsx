import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog, type Confirmation } from "@/components/site/ConfirmationDialog";
import { DateTimeField, adjustedEnd } from "@/components/site/DateTimeField";
import {
  BookingLayout,
  Field,
  FormSection,
  Note,
  OptionRow,
  PageIntro,
  Segmented,
  Stepper,
  Summary,
  SummaryRow,
  invalidClass,
} from "@/components/site/form";
import { useI18n } from "@/lib/i18n";
import { daysFromNow, formatShort, parseLocalIso } from "@/lib/datetime";
import { VTC_VEHICLES, vtcNeedsVan } from "@/lib/pricing";
import { PLACES, isEmail, isPhone, makeRef, type Terminal } from "@/lib/site";

type Trip = "to" | "from" | "rt";
type Search = { dir?: "to" | "from"; addr?: string; date?: string; pax?: number };

export const Route = createFileRoute("/vtc")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    dir: s.dir === "to" || s.dir === "from" ? s.dir : undefined,
    addr: typeof s.addr === "string" ? s.addr : undefined,
    date: typeof s.date === "string" ? s.date : undefined,
    pax: typeof s.pax === "number" && s.pax >= 1 && s.pax <= 7 ? s.pax : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chauffeur privé VTC · Aéroport de Nice | Azur Voiturier" },
      {
        name: "description",
        content:
          "Demandez un devis VTC vers ou depuis l'aéroport Nice Côte d'Azur. Berline ou van, prix fixe communiqué sous 2 h.",
      },
      { property: "og:title", content: "Chauffeur privé vers ou depuis l'aéroport de Nice" },
      { property: "og:description", content: "Berline ou van, prix fixe communiqué avant la course." },
    ],
  }),
  component: VtcPage,
});

type Errors = Partial<Record<"addr" | "date" | "date2" | "name" | "phone" | "email", string>>;

function VtcPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const [trip, setTrip] = useState<Trip>(search.dir ?? "to");
  const [addr, setAddr] = useState(search.addr ?? "");
  const [term, setTerm] = useState<Terminal>("T2");
  const [date, setDate] = useState<Date | null>(null);
  const [date2, setDate2] = useState<Date | null>(null);
  const [flight, setFlight] = useState("");
  const [flight2, setFlight2] = useState("");
  const [pax, setPax] = useState(search.pax ?? 2);
  const [bags, setBags] = useState(2);
  const [vehicle, setVehicle] = useState<"Berline" | "Van">("Berline");
  const [seat, setSeat] = useState(false);
  const [sign, setSign] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", notes: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);

  useEffect(() => {
    setDate(parseLocalIso(search.date) ?? daysFromNow(1, 9));
    setDate2(daysFromNow(6, 18));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsVan = vtcNeedsVan(pax, bags);
  useEffect(() => {
    if (needsVan) setVehicle("Van");
  }, [needsVan]);

  const from = trip === "from";
  const airport = t.common.airportTerminal(term);
  const place = addr.trim() || t.vtc.yourAddress;
  const [a, b] = from ? [airport, place] : [place, airport];
  const tripLabel = t.vtc.tabs[trip];
  const dateLabel = formatShort(date, t.locale) + (trip === "rt" ? ` → ${formatShort(date2, t.locale)}` : "");
  const travellers = `${t.common.passengers(pax)} · ${t.common.bags(bags)}`;
  const extras = [seat && t.vtc.childSeat, sign && t.vtc.nameSign].filter(Boolean).join(", ") || t.common.none;

  const set = (k: keyof typeof contact) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContact((c) => ({ ...c, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const send = () => {
    const er: Errors = {};
    if (!addr.trim()) er.addr = t.common.errors.address;
    if (!date || date < new Date()) er.date = t.common.errors.date;
    if (trip === "rt" && (!date2 || !date || date2 <= date)) er.date2 = t.common.errors.returnAfter;
    if (!contact.name.trim()) er.name = t.common.errors.name;
    if (!isPhone(contact.phone)) er.phone = t.common.errors.phone;
    if (!isEmail(contact.email)) er.email = t.common.errors.email;
    setErrors(er);
    if (Object.keys(er).length) {
      setTimeout(() => document.querySelector("[data-invalid]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setDone({
        title: t.vtc.successTitle,
        text: t.vtc.successText,
        reference: makeRef("VTC"),
        lines: [
          [t.vtc.trip, `${a} → ${b}`],
          [t.vtc.date, dateLabel],
          [t.vtc.vehicle, t.vtc.vehicleNames[vehicle]],
          [t.vtc.travellers, travellers],
          [t.vtc.extras, extras],
        ],
      });
    }, 1000);
  };

  const addressField = (
    <Field label={from ? t.vtc.dropoffAddress : t.vtc.pickupAddress} htmlFor="t-addr" error={errors.addr}>
      <Input
        id="t-addr"
        list="t-places"
        value={addr}
        onChange={(e) => {
          setAddr(e.target.value);
          setErrors((er) => ({ ...er, addr: undefined }));
        }}
        placeholder={t.vtc.addressPh}
        autoComplete="off"
        className={errors.addr ? invalidClass : undefined}
      />
      <datalist id="t-places">
        {PLACES.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </Field>
  );
  const terminalField = (
    <Field label={from ? t.vtc.pickup : t.vtc.destination}>
      <Segmented
        label={from ? t.vtc.pickup : t.vtc.destination}
        value={term}
        onChange={setTerm}
        options={[
          { value: "T1", label: "Terminal 1" },
          { value: "T2", label: "Terminal 2" },
        ]}
      />
    </Field>
  );

  return (
    <>
      <PageIntro eyebrow={t.vtc.eyebrow} title={t.vtc.title} lead={t.vtc.lead} />
      <BookingLayout
        form={
          <form noValidate onSubmit={(e) => e.preventDefault()}>
            <FormSection title={t.vtc.trip}>
              <Segmented
                label={t.vtc.trip}
                value={trip}
                onChange={setTrip}
                options={[
                  { value: "to", label: t.vtc.tabs.to },
                  { value: "from", label: t.vtc.tabs.from },
                  { value: "rt", label: t.vtc.tabs.rt },
                ]}
              />
              <p className="mt-5 flex flex-wrap items-center gap-3 rounded-md bg-paper px-4 py-3 text-sm font-semibold">
                <span className="truncate">{a}</span>
                <span className="text-muted-foreground">→</span>
                <span className="truncate">{b}</span>
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {from ? terminalField : addressField}
                {from ? addressField : terminalField}
                <Field
                  label={trip === "rt" ? t.vtc.outbound : from ? t.vtc.landing : t.vtc.dateTime}
                  htmlFor="t-date"
                  error={errors.date}
                >
                  <DateTimeField
                    id="t-date"
                    value={date}
                    invalid={!!errors.date}
                    onChange={(d) => {
                      const e = adjustedEnd(date, d, date2);
                      if (e) setDate2(e);
                      setDate(d);
                      setErrors((er) => ({ ...er, date: undefined }));
                    }}
                  />
                </Field>
                <Field label={t.common.flight} htmlFor="t-flight">
                  <Input id="t-flight" value={flight} onChange={(e) => setFlight(e.target.value)} placeholder={t.common.flightPh} autoComplete="off" />
                </Field>
                {trip === "rt" && (
                  <>
                    <Field label={t.vtc.returnDate} htmlFor="t-date2" error={errors.date2}>
                      <DateTimeField
                        id="t-date2"
                        value={date2}
                        after={date}
                        invalid={!!errors.date2}
                        onChange={(d) => {
                          setDate2(d);
                          setErrors((er) => ({ ...er, date2: undefined }));
                        }}
                      />
                    </Field>
                    <Field label={t.common.flightReturn} htmlFor="t-flight2">
                      <Input id="t-flight2" value={flight2} onChange={(e) => setFlight2(e.target.value)} placeholder={t.common.flightPh} autoComplete="off" />
                    </Field>
                  </>
                )}
                <Field label={t.vtc.passengers}>
                  <Stepper value={pax} min={1} max={7} onChange={setPax} label={t.vtc.passengers} lessLabel={t.vtc.less} moreLabel={t.vtc.more} />
                </Field>
                <Field label={t.vtc.bags}>
                  <Stepper value={bags} min={0} max={6} onChange={setBags} label={t.vtc.bags} lessLabel={t.vtc.less} moreLabel={t.vtc.more} />
                </Field>
              </div>
            </FormSection>

            <FormSection title={t.vtc.vehicle}>
              <div className="grid gap-2.5 md:grid-cols-2">
                {VTC_VEHICLES.map((v) => (
                  <OptionRow
                    key={v.id}
                    label={t.vtc.vehicleNames[v.id]}
                    detail={`${t.vtc.seats(v.seats)} · ${t.vtc.luggage(v.bags)}`}
                    price=""
                    checked={vehicle === v.id}
                    disabled={v.id === "Berline" && needsVan}
                    onToggle={() => setVehicle(v.id)}
                  />
                ))}
              </div>
              {needsVan && <Note>{t.vtc.vehicleHint}</Note>}
              <div className="mt-6 grid gap-2.5 md:grid-cols-2">
                <OptionRow label={t.vtc.childSeat} price="" checked={seat} onToggle={() => setSeat((x) => !x)} />
                <OptionRow label={t.vtc.nameSign} price="" checked={sign} onToggle={() => setSign((x) => !x)} />
              </div>
            </FormSection>

            <FormSection title={t.vtc.contact} hint={t.vtc.contactHint}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t.common.name} htmlFor="t-name" error={errors.name}>
                  <Input id="t-name" value={contact.name} onChange={set("name")} autoComplete="name" placeholder={t.common.namePh} className={errors.name ? invalidClass : undefined} />
                </Field>
                <Field label={t.common.phone} htmlFor="t-phone" error={errors.phone}>
                  <Input id="t-phone" type="tel" value={contact.phone} onChange={set("phone")} autoComplete="tel" placeholder={t.common.phonePh} className={errors.phone ? invalidClass : undefined} />
                </Field>
                <Field label={t.common.email} htmlFor="t-mail" error={errors.email} className="md:col-span-2">
                  <Input id="t-mail" type="email" value={contact.email} onChange={set("email")} autoComplete="email" placeholder={t.common.emailPh} className={errors.email ? invalidClass : undefined} />
                </Field>
                <Field label={`${t.vtc.notes} (${t.common.optional.toLowerCase()})`} htmlFor="t-notes" className="md:col-span-2">
                  <Textarea id="t-notes" value={contact.notes} onChange={set("notes")} placeholder={t.vtc.notesPh} className="min-h-24 bg-card text-[15px]" />
                </Field>
              </div>
            </FormSection>
          </form>
        }
        summary={
          <Summary title={t.vtc.request}>
            <SummaryRow label={t.vtc.trip} value={tripLabel} />
            <SummaryRow label={t.vtc.date} value={dateLabel} />
            <SummaryRow label={t.vtc.vehicle} value={t.vtc.vehicleNames[vehicle]} />
            <SummaryRow label={t.vtc.travellers} value={travellers} />
            <SummaryRow label={t.vtc.extras} value={extras} />
            <p className="my-5 rounded-md bg-sun-soft px-4 py-3 text-[13.5px]">{t.vtc.noPayment}</p>
            <Button size="lg" className="w-full" onClick={send} disabled={busy}>
              <Send />
              {busy ? t.common.processing : t.vtc.send}
            </Button>
            <Note>{t.vtc.afterNote}</Note>
          </Summary>
        }
      />
      <ConfirmationDialog data={done} onClose={() => setDone(null)} />
    </>
  );
}
