import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3", className)} aria-label="Azur Voiturier">
      <span className="brand-mark w-9 text-azur-deep" aria-hidden="true" />
      <span className="text-[15px] tracking-[0.18em] text-foreground">
        <b className="font-bold">AZUR</b> <span className="font-normal">VOITURIER</span>
      </span>
    </Link>
  );
}
