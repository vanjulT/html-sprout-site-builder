import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Lock } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConfirmationDialog, type Confirmation } from "@/components/site/ConfirmationDialog";
import {
  BookingLayout,
  Field,
  FormSection,
  Note,
  PageIntro,
  Summary,
  SummaryRow,
  SummaryTotal,
  invalidClass,
} from "@/components/site/form";
import { useI18n } from "@/lib/i18n";
import { SUBSCRIPTION } from "@/lib/pricing";
import { isEmail, isPhone, makeRef } from "@/lib/site";

export const Route = createFileRoute("/abonnement")({
  head: () => ({
    meta: [
      { title: "Abonnement voiturier annuel · Aéroport de Nice | Azur Voiturier" },
      {
        name: "description",
        content:
          "Abonnement annuel voiturier à l'aéroport Nice Côte d'Azur : 2 090 € TTC, 25 prises en charge et 25 retours inclus, parking sécurisé toute l'année.",
      },
      { property: "og:title", content: "Abonnement voiturier annuel à l'aéroport de Nice" },
      {
        property: "og:description",
        content:
          "25 prises en charge et 25 retours inclus, parking sécurisé toute l'année. 2 090 € TTC.",
      },
    ],
  }),
  component: SubscriptionPage,
});

type Errors = Partial<Record<"name" | "phone" | "email" | "plate", string | undefined>>;

function SubscriptionPage() {
  const { t, eur } = useI18n();
  const [contact, setContact] = useState({ name: "", phone: "", email: "", plate: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);

  const set = (k: keyof typeof contact) => (e: ChangeEvent<HTMLInputElement>) => {
    setContact((c) => ({ ...c, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const scrollToForm = () =>
    document.getElementById("subscribe")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const pay = () => {
    const er: Errors = {};
    if (!contact.name.trim()) er.name = t.common.errors.name;
    if (!isPhone(contact.phone)) er.phone = t.common.errors.phone;
    if (!isEmail(contact.email)) er.email = t.common.errors.email;
    if (!contact.plate.trim()) er.plate = t.common.errors.plate;
    setErrors(er);
    if (Object.keys(er).length) {
      document
        .querySelector("[data-invalid]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setDone({
        title: t.sub.successTitle,
        text: t.sub.successText,
        reference: makeRef("AB"),
        lines: [
          [t.sub.formula, t.sub.formulaValue],
          [t.sub.included, t.sub.includedValue],
          [t.sub.vehicle, contact.plate.toUpperCase()],
          [t.sub.paid, `${eur(SUBSCRIPTION.pricePerYear)} ${t.common.vat}`],
        ],
      });
    }, 1200);
  };

  return (
    <>
      <PageIntro eyebrow={t.sub.eyebrow} title={t.sub.title} lead={t.sub.lead} />

      {/* Plan */}
      <section className="site-container py-14 md:py-20">
        <div className="grid gap-10 rounded-lg border bg-card p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
          <div>
            <p className="eyebrow">
              {t.sub.plan} · <span className="text-azur-deep">{t.sub.best}</span>
            </p>
            <p className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <span>
                <span className="figure text-6xl">{SUBSCRIPTION.pickups}</span>
                <span className="ml-2 text-muted-foreground">{t.sub.pickups}</span>
              </span>
              <span>
                <span className="figure text-6xl">{SUBSCRIPTION.returns}</span>
                <span className="ml-2 text-muted-foreground">{t.sub.returns}</span>
              </span>
            </p>
            <ul className="mt-8 space-y-2.5 text-[15px]">
              {t.sub.features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <Check className="size-4 text-azur-deep" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t pt-8 md:border-t-0 md:border-l md:pl-12 md:pt-0 md:text-right">
            <p className="figure text-6xl">{eur(SUBSCRIPTION.pricePerYear)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.common.vat} {t.common.perYear}
            </p>
            <Button size="lg" className="mt-6" onClick={scrollToForm}>
              {t.sub.cta}
              <ArrowRight />
            </Button>
            <p className="mt-4 max-w-[16rem] text-[13px] text-muted-foreground md:ml-auto">
              {t.sub.perTrip}
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-y bg-paper">
        <div className="site-container py-16 md:py-20">
          <h2 className="text-4xl md:text-5xl">{t.sub.whoTitle}</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">{t.sub.whoLead}</p>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {t.sub.who.map((w, i) => (
              <article key={w.title} className="border-t border-foreground pt-6">
                <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-[1.75rem]">{w.title}</h3>
                <p className="mt-3 text-[15px] text-muted-foreground">{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works + extras */}
      <section className="site-container grid gap-16 py-16 md:py-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-4xl md:text-5xl">{t.sub.howTitle}</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {t.sub.steps.map((s, i) => (
              <li key={s.title}>
                <span className="figure text-5xl text-azur-deep">{i + 1}</span>
                <h3 className="mt-3 text-xl">{s.title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-3xl">{t.sub.extrasTitle}</h2>
          <dl className="mt-8">
            {t.sub.extras.map(([label, price]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-dashed py-3 text-[15px]"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="figure text-lg">{price}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="site-container max-w-3xl py-16 md:py-20">
          <h2 className="text-4xl md:text-5xl">{t.sub.faqTitle}</h2>
          <Accordion type="single" collapsible className="mt-8">
            {t.sub.faq.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-[16px] font-semibold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Subscribe form */}
      <div id="subscribe" className="scroll-mt-20 border-t bg-paper">
        <BookingLayout
          form={
            <form noValidate onSubmit={(e) => e.preventDefault()}>
              <FormSection title={t.sub.formTitle} hint={t.sub.formText}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label={t.common.name} htmlFor="s-name" error={errors.name}>
                    <Input
                      id="s-name"
                      value={contact.name}
                      onChange={set("name")}
                      autoComplete="name"
                      placeholder={t.common.namePh}
                      className={errors.name ? invalidClass : undefined}
                    />
                  </Field>
                  <Field label={t.common.phone} htmlFor="s-phone" error={errors.phone}>
                    <Input
                      id="s-phone"
                      type="tel"
                      value={contact.phone}
                      onChange={set("phone")}
                      autoComplete="tel"
                      placeholder={t.common.phonePh}
                      className={errors.phone ? invalidClass : undefined}
                    />
                  </Field>
                  <Field label={t.common.email} htmlFor="s-mail" error={errors.email}>
                    <Input
                      id="s-mail"
                      type="email"
                      value={contact.email}
                      onChange={set("email")}
                      autoComplete="email"
                      placeholder={t.common.emailPh}
                      className={errors.email ? invalidClass : undefined}
                    />
                  </Field>
                  <Field label={t.common.plate} htmlFor="s-plate" error={errors.plate}>
                    <Input
                      id="s-plate"
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
              <SummaryRow label={t.sub.formula} value={t.sub.formulaValue} />
              <SummaryRow label={t.sub.included} value={t.sub.includedValue} />
              <SummaryTotal
                label={t.common.total}
                value={eur(SUBSCRIPTION.pricePerYear)}
                suffix={t.common.vat}
              />
              <Button size="lg" className="w-full" onClick={pay} disabled={busy}>
                <Lock />
                {busy ? t.common.processing : t.sub.pay}
              </Button>
              <Note>{t.common.secure}</Note>
            </Summary>
          }
        />
      </div>

      <ConfirmationDialog data={done} onClose={() => setDone(null)} />
    </>
  );
}
