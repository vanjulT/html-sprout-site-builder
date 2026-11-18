import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
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
import { daysFromNow, durationText, formatShort, parseLocalIso } from "@/lib/datetime";
import {
  VALET_OPTIONS,
  suggestFullClean,
  toggleValetOption,
  valetQuote,
  type ValetOptionId,
} from "@/lib/pricing";
import { isEmail, isPhone, makeRef, type Terminal } from "@/lib/site";

type Search = { drop?: string | undefined; pick?: string | undefined; term?: Terminal | undefined };

export const Route = createFileRoute("/voiturier")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    drop: typeof s["drop"] === "string" ? s["drop"] : undefined,
    pick: typeof s["pick"] === "string" ? s["pick"] : undefined,
    term: s["term"] === "T1" || s["term"] === "T2" ? s["term"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Réserver un voiturier · Aéroport de Nice | Azur Voiturier" },
      {
        name: "description",
        content:
          "Parking voiturier à l'aéroport Nice Côte d'Azur : 50 € TTC par tranche de 24 h, remise des clés au dépose-minute T1 ou T2.",
      },
      { property: "og:title", content: "Réserver un voiturier à l'aéroport de Nice" },
      {
        property: "og:description",
        content:
          "50 € TTC par tranche de 24 h. Remise des clés au dépose-minute, parking sécurisé.",
      },
    ],
  }),
  component: ValetPage,
});

type Errors = Partial<Record<"name" | "phone" | "email" | "plate", string | undefined>>;

function ValetPage() {
  const { t, eur } = useI18n();
  const search = Route.useSearch();
  const [drop, setDrop] = useState<Date | null>(null);
  const [pick, setPick] = useState<Date | null>(null);
  const [term, setTerm] = useState<Terminal>(search.term ?? "T2");
  const [flight, setFlight] = useState("");
  const [options, setOptions] = useState<ValetOptionId[]>([]);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", plate: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showDateError, setShowDateError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);

  useEffect(() => {
    setDrop(parseLocalIso(search.drop) ?? daysFromNow(1, 8));
    setPick(parseLocalIso(search.pick) ?? daysFromNow(5, 20));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = valetQuote({ drop, pick, options });
  const set = (k: keyof typeof contact) => (e: ChangeEvent<HTMLInputElement>) => {
    setContact((c) => ({ ...c, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const pay = () => {
    setShowDateError(true);
    const er: Errors = {};
    if (!contact.name.trim()) er.name = t.common.errors.name;
    if (!isPhone(contact.phone)) er.phone = t.common.errors.phone;
    if (!isEmail(contact.email)) er.email = t.common.errors.email;
    if (!contact.plate.trim()) er.plate = t.common.errors.plate;
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
        title: t.valet.successTitle,
        text: t.valet.successText,
        reference: makeRef("AV"),
        lines: [
          [t.valet.drop, formatShort(drop, t.locale)],
          [t.valet.pick, formatShort(pick, t.locale)],
          [t.common.terminal, term],
          [t.valet.vehicle, contact.plate.toUpperCase()],
          [
            t.valet.options,
            options.map((o) => t.valet.optionLabels[o]).join(", ") || t.common.none,
          ],
          [t.valet.paid, `${eur(q.total)} ${t.common.vat}`],
        ],
      });
    }, 1200);
  };

  return (
    <>
      <PageIntro eyebrow={t.valet.eyebrow} title={t.valet.title} lead={t.valet.lead} />
      <BookingLayout
        form={
          <form noValidate onSubmit={(e) => e.preventDefault()}>
            <FormSection title={t.valet.stay} hint={t.valet.stayHint}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label={t.valet.drop}
                  htmlFor="v-drop"
                  error={showDateError && q.error ? t.common.dateErrors[q.error] : undefined}
                >
                  <DateTimeField
                    id="v-drop"
                    value={drop}
                    invalid={showDateError && !!q.error}
                    onChange={(d) => {
                      const e = adjustedEnd(drop, d, pick);
                      if (e) {
                        setPick(e);
                        toast(t.dt.adjusted(formatShort(e, t.locale)));
                      }
                      setDrop(d);
                    }}
                  />
                </Field>
                <Field label={t.valet.pick} htmlFor="v-pick">
                  <DateTimeField id="v-pick" value={pick} onChange={setPick} after={drop} />
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
                <Field label={t.common.flightReturn} htmlFor="v-flight">
                  <Input
                    id="v-flight"
                    value={flight}
                    onChange={(e) => setFlight(e.target.value)}
                    placeholder={t.common.flightPh}
                    autoComplete="off"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title={t.valet.options} hint={t.valet.optionsHint} aside={<OptionalTag />}>
              <div className="flex flex-col gap-2.5">
                {VALET_OPTIONS.map((o) => (
                  <OptionRow
                    key={o.id}
                    label={t.valet.optionLabels[o.id]}
                    price={`+${eur(o.price)}`}
                    checked={options.includes(o.id)}
                    onToggle={() => setOptions((cur) => toggleValetOption(cur, o.id))}
                  />
                ))}
              </div>
              {suggestFullClean(options) && (
                <div className="fade-in mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-sun-soft px-4 py-3 text-sm">
                  <span>{t.valet.fullCleanTip}</span>
                  <button
                    type="button"
                    className="text-link font-semibold"
                    onClick={() => {
                      setOptions(["complet"]);
                      toast(t.valet.fullCleanDone);
                    }}
                  >
                    {t.valet.fullCleanSwitch}
                  </button>
                </div>
              )}
            </FormSection>

            <FormSection title={t.valet.contact} hint={t.valet.contactHint}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t.common.name} htmlFor="v-name" error={errors.name}>
                  <Input
                    id="v-name"
                    value={contact.name}
                    onChange={set("name")}
                    autoComplete="name"
                    placeholder={t.common.namePh}
                    className={errors.name ? invalidClass : undefined}
                  />
                </Field>
                <Field label={t.common.phone} htmlFor="v-phone" error={errors.phone}>
                  <Input
                    id="v-phone"
                    type="tel"
                    value={contact.phone}
                    onChange={set("phone")}
                    autoComplete="tel"
                    placeholder={t.common.phonePh}
                    className={errors.phone ? invalidClass : undefined}
                  />
                </Field>
                <Field label={t.common.email} htmlFor="v-mail" error={errors.email}>
                  <Input
                    id="v-mail"
                    type="email"
                    value={contact.email}
                    onChange={set("email")}
                    autoComplete="email"
                    placeholder={t.common.emailPh}
                    className={errors.email ? invalidClass : undefined}
                  />
                </Field>
                <Field label={t.common.plate} htmlFor="v-plate" error={errors.plate}>
                  <Input
                    id="v-plate"
                    value={contact.plate}
                    onChange={set("plate")}
                    placeholder={t.common.platePh}
                    className={`uppercase placeholder:normal-case ${errors.plate ? invalidClass : ""}`}
                  />
                </Field>
              </div>
            </FormSection>
          </form>
        }
        summary={
          <Summary title={t.common.summary}>
            <SummaryRow
              label={t.valet.duration}
              value={q.slots ? durationText(drop, pick, t.locale === "fr-FR" ? "j" : "d") : "—"}
            />
            <SummaryRow
              label={t.valet.parking}
              value={q.slots ? `${t.common.slots(q.slots)} · ${eur(q.parking)}` : "—"}
            />
            <SummaryRow label={t.common.terminal} value={term} />
            <SummaryRow
              label={t.valet.options}
              value={q.options ? eur(q.options) : t.common.none}
            />
            <SummaryTotal label={t.common.total} value={eur(q.total)} suffix={t.common.vat} />
            <Button size="lg" className="w-full" onClick={pay} disabled={busy}>
              <Lock />
              {busy ? t.common.processing : t.valet.pay(eur(q.total))}
            </Button>
            {q.error && showDateError && <Note tone="error">{t.common.dateErrors[q.error]}</Note>}
            <Note>{t.common.secure}</Note>
            <Note>{t.valet.rateNote}</Note>
          </Summary>
        }
      />
      <ConfirmationDialog data={done} onClose={() => setDone(null)} />
    </>
  );
}
