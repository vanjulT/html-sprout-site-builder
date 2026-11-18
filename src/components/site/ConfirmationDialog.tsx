import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export type Confirmation = {
  title: string;
  text: string;
  reference?: string | undefined;
  lines: [string, string][];
  extra?: ReactNode | undefined;
};

export function ConfirmationDialog({
  data,
  onClose,
}: {
  data: Confirmation | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-md">
        {data && (
          <div className="pt-2">
            <span className="grid size-12 place-items-center rounded-full bg-sun-soft text-foreground">
              <Check className="size-6" strokeWidth={2.5} />
            </span>
            <DialogTitle className="mt-5 font-display text-3xl font-normal">
              {data.title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-[15px]">{data.text}</DialogDescription>
            {data.reference && (
              <p className="mt-4 inline-block rounded-sm border px-2.5 py-1 font-mono text-sm tracking-wider">
                {data.reference}
              </p>
            )}
            <div className="mt-5 rounded-md bg-paper px-4 py-1">
              {data.lines.map(([a, b]) => (
                <div
                  key={a}
                  className="flex justify-between gap-4 border-b border-dashed py-2.5 text-sm last:border-b-0"
                >
                  <span className="text-muted-foreground">{a}</span>
                  <span className="text-right font-semibold">{b}</span>
                </div>
              ))}
            </div>
            {data.extra}
            <Button className="mt-6 w-full" size="lg" onClick={onClose}>
              {t.common.close}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
