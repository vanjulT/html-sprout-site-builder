import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";
import { LanguageSwitch } from "./Header";

export function openWhatsApp(missingMessage: string) {
  if (!SITE.whatsapp) {
    toast(missingMessage);
    return;
  }
  window.open(`https://wa.me/${SITE.whatsapp}`, "_blank", "noopener");
}

export function WhatsAppButton() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => openWhatsApp(t.notices.whatsappMissing)}
      aria-label={t.notices.whatsappLabel}
      title={t.notices.whatsappLabel}
      className="fixed bottom-5 right-5 z-30 grid size-12 place-items-center rounded-full border bg-card text-foreground shadow-sm transition-colors hover:border-foreground/40"
    >
      <MessageCircle className="size-5" />
    </button>
  );
}

export function Footer() {
  const { t } = useI18n();
  const soon = () => toast(t.notices.soon);
  const linkCls =
    "block py-1 text-[14.5px] text-muted-foreground transition-colors hover:text-foreground";
  return (
    <footer className="border-t bg-paper">
      <div className="site-container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[14.5px] text-muted-foreground">{t.footer.tagline}</p>
        </div>
        <div>
          <h3 className="eyebrow mb-3">{t.footer.services}</h3>
          <Link to="/voiturier" className={linkCls}>
            {t.nav.valet}
          </Link>
          <Link to="/vtc" className={linkCls}>
            {t.nav.vtc}
          </Link>
          <Link to="/location" className={linkCls}>
            {t.nav.rental}
          </Link>
          <Link to="/abonnement" className={linkCls}>
            {t.nav.subscription}
          </Link>
        </div>
        <div>
          <h3 className="eyebrow mb-3">{t.footer.airport}</h3>
          <p className="py-1 text-[14.5px] text-muted-foreground">Nice Côte d'Azur</p>
          <p className="py-1 text-[14.5px] text-muted-foreground">{t.footer.terminal1}</p>
          <p className="py-1 text-[14.5px] text-muted-foreground">{t.footer.terminal2}</p>
        </div>
        <div>
          <h3 className="eyebrow mb-3">{t.footer.contact}</h3>
          <button
            type="button"
            className={linkCls}
            onClick={() => openWhatsApp(t.notices.whatsappMissing)}
          >
            {t.footer.whatsapp}
          </button>
          <button type="button" className={linkCls} onClick={soon}>
            {t.footer.write}
          </button>
        </div>
      </div>
      <div className="site-container flex flex-wrap items-center justify-between gap-4 border-t py-6 text-[13px] text-muted-foreground">
        <span>© 2026 Azur Voiturier. {t.footer.rights}</span>
        <div className="flex items-center gap-5">
          <button type="button" onClick={soon} className="hover:text-foreground">
            {t.footer.terms}
          </button>
          <button type="button" onClick={soon} className="hover:text-foreground">
            {t.footer.legal}
          </button>
          <LanguageSwitch />
        </div>
      </div>
    </footer>
  );
}
