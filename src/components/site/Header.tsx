import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useI18n, LANGS } from "@/lib/i18n";
import { isEmail } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { Field, invalidClass } from "./form";

function useNavItems() {
  const { t } = useI18n();
  return [
    { to: "/voiturier", label: t.nav.valet },
    { to: "/vtc", label: t.nav.vtc },
    { to: "/location", label: t.nav.rental },
    { to: "/abonnement", label: t.nav.subscription },
  ] as const;
}

export function LanguageSwitch({ className }: { className?: string | undefined }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className={cn("flex items-center text-[13px] font-semibold", className)}
      role="group"
      aria-label={t.nav.language}
    >
      {LANGS.map((l, i) => (
        <span key={l.id} className="flex items-center">
          {i > 0 && <span className="mx-1.5 text-border">|</span>}
          <button
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={lang === l.id}
            title={l.label}
            className={cn(
              "uppercase tracking-wider transition-colors",
              lang === l.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.id}
          </button>
        </span>
      ))}
    </div>
  );
}

function AccountSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError(t.common.errors.email);
    setError("");
    onOpenChange(false);
    toast(t.account.sent(email));
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md p-8 sm:max-w-md">
        <SheetTitle className="mt-6 font-display text-3xl font-normal">
          {t.account.title}
        </SheetTitle>
        <SheetDescription className="mt-2 text-[15px]">{t.account.text}</SheetDescription>
        <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-4">
          <Field label={t.common.email} htmlFor="acc-mail" error={error}>
            <Input
              id="acc-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.common.emailPh}
              className={error ? invalidClass : undefined}
            />
          </Field>
          <Button type="submit" size="lg">
            {t.account.send}
          </Button>
        </form>
        <ul className="mt-8 space-y-2 border-t pt-6 text-sm text-muted-foreground">
          {t.account.perks.map((p) => (
            <li key={p}>— {p}</li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const { t } = useI18n();
  const items = useNavItems();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="site-container flex h-16 items-center gap-8 md:h-[72px]">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="relative py-1 text-[14.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className:
                  "!text-foreground after:absolute after:inset-x-0 after:-bottom-[23px] after:h-[2px] after:bg-sun",
              }}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-5">
          <LanguageSwitch className="hidden sm:flex" />
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="hidden text-[14.5px] font-medium text-muted-foreground hover:text-foreground md:block"
          >
            {t.nav.account}
          </button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/voiturier">{t.nav.book}</Link>
          </Button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md border lg:hidden"
            aria-label={t.nav.menu}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent className="flex w-full max-w-sm flex-col p-8">
          <SheetTitle className="sr-only">{t.nav.menu}</SheetTitle>
          <SheetDescription className="sr-only">Azur Voiturier</SheetDescription>
          <nav className="mt-10 flex flex-col">
            {[{ to: "/", label: t.nav.home } as const, ...items].map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setMenuOpen(false)}
                className="border-b py-4 font-display text-2xl"
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-azur-deep" }}
              >
                {i.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="mt-6 text-left text-[15px] font-medium"
            onClick={() => {
              setMenuOpen(false);
              setAccountOpen(true);
            }}
          >
            {t.nav.account}
          </button>
          <LanguageSwitch className="mt-auto text-sm" />
        </SheetContent>
      </Sheet>
      <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
    </header>
  );
}
