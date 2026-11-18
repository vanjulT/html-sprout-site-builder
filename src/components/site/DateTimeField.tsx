import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { enGB, fr as frLocale } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  TIME_SLOTS,
  addMinutes,
  earliestBookable,
  formatLong,
  latestBookable,
  startOfDay,
  timeOf,
  withTime,
} from "@/lib/datetime";
import { DAY_MS, SLOT_MINUTES } from "@/lib/pricing";

type Props = {
  id: string;
  value: Date | null;
  onChange: (d: Date) => void;
  /** Start of a range: end dates must come at least one slot after it. */
  after?: Date | null | undefined;
  invalid?: boolean | undefined;
};

function firstSlot(day: Date, floor: Date, preferred: string | null) {
  if (preferred && withTime(day, preferred) >= floor) return preferred;
  return TIME_SLOTS.find((t) => withTime(day, t) >= floor) ?? null;
}

export function DateTimeField({ id, value, onChange, after, invalid }: Props) {
  const { t, lang } = useI18n();
  const locale = t.locale;
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(() => new Date());
  const timesRef = useRef<HTMLDivElement>(null);

  // Recomputed whenever the picker opens so "now" stays current.
  const floor = useMemo(() => {
    const base = earliestBookable();
    if (after) {
      const a = addMinutes(after, SLOT_MINUTES);
      return a > base ? a : base;
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, after]);
  const latest = useMemo(() => latestBookable(), []);

  useEffect(() => {
    if (!open) return;
    const ok = value && value >= floor;
    setDay(ok ? startOfDay(value) : null);
    setTime(ok ? timeOf(value) : null);
    setMonth(ok ? value : floor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const el = timesRef.current?.querySelector<HTMLElement>("[data-selected]");
    if (el && timesRef.current) timesRef.current.scrollTop = el.offsetTop - 48;
  }, [day, open]);

  const pickDay = (d: Date) => {
    setDay(d);
    setMonth(d);
    setTime((prev) => firstSlot(d, floor, prev ?? (value ? timeOf(value) : "08:00")));
  };

  const quick: { label: string; date: Date }[] = after
    ? [
        { label: t.dt.plusDay, date: new Date(after.getTime() + DAY_MS) },
        { label: t.dt.plusThree, date: new Date(after.getTime() + 3 * DAY_MS) },
        { label: t.dt.plusWeek, date: new Date(after.getTime() + 7 * DAY_MS) },
      ]
    : (
        [
          [t.dt.today, 0],
          [t.dt.tomorrow, 1],
          [t.dt.inWeek, 7],
        ] as const
      ).map(([label, n]) => {
        const d = startOfDay(new Date());
        d.setDate(d.getDate() + n);
        return { label, date: d };
      });

  const selected = day && time ? withTime(day, time) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-14 w-full items-center gap-3 rounded-md border border-input bg-card px-3 text-left transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            open && "border-ring",
            invalid && "border-destructive",
          )}
        >
          <CalendarDays className="size-[18px] shrink-0 text-muted-foreground" />
          {value ? (
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold">{formatLong(value, locale)}</span>
              <span className="block text-[13px] text-muted-foreground">{timeOf(value)}</span>
            </span>
          ) : (
            <span className="leading-tight">
              <span className="block text-[15px] text-muted-foreground">{t.dt.choose}</span>
              <span className="block text-[13px] text-muted-foreground/80">{t.dt.hint}</span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(340px,calc(100vw-24px))] rounded-lg p-0">
        <div className="flex flex-wrap gap-1.5 border-b p-3">
          {quick.map((q) => {
            const d = q.date;
            const disabled = after ? d < floor : withTime(d, "23:30") < floor;
            return (
              <button
                key={q.label}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (after) {
                    setDay(startOfDay(d));
                    setMonth(d);
                    setTime(firstSlot(startOfDay(d), floor, timeOf(d)));
                  } else pickDay(d);
                }}
                className="rounded-sm border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
              >
                {q.label}
              </button>
            );
          })}
        </div>
        <Calendar
          mode="single"
          locale={lang === "fr" ? frLocale : enGB}
          weekStartsOn={1}
          month={month}
          onMonthChange={setMonth}
          selected={day ?? undefined}
          onSelect={(d) => d && pickDay(d)}
          disabled={[{ before: startOfDay(floor) }, { after: latest }]}
          startMonth={floor}
          endMonth={latest}
          className="mx-auto w-full [--cell-size:2.4rem]"
        />
        <div className="border-t p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.dt.time}
            {!day && (
              <span className="ml-1 normal-case tracking-normal">· {t.dt.pickDayFirst}</span>
            )}
          </p>
          {day && (
            <div
              ref={timesRef}
              className="relative grid max-h-32 grid-cols-4 gap-1.5 overflow-y-auto pr-1"
            >
              {TIME_SLOTS.map((slot) => {
                const disabled = withTime(day, slot) < floor;
                const isSel = time === slot && !disabled;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    data-selected={isSel ? "" : undefined}
                    onClick={() => setTime(slot)}
                    className={cn(
                      "rounded-sm border py-1.5 text-[13px] font-semibold tabular-nums transition-colors disabled:opacity-30",
                      isSel
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-foreground/40",
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 border-t p-3">
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-muted-foreground">
            {selected ? (
              <b className="text-foreground">
                {formatLong(selected, locale)} · {time}
              </b>
            ) : (
              t.dt.earliest(`${formatLong(floor, locale)} · ${timeOf(floor)}`)
            )}
          </p>
          <Button
            type="button"
            size="sm"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onChange(selected);
              setOpen(false);
            }}
          >
            {t.dt.confirm}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * When a range start moves past (or too close to) its end, shift the end
 * by the previous duration (or one day). Returns null when no change is needed.
 */
export function adjustedEnd(oldStart: Date | null, newStart: Date, end: Date | null): Date | null {
  if (end && end >= addMinutes(newStart, SLOT_MINUTES)) return null;
  const dur = end && oldStart && end > oldStart ? end.getTime() - oldStart.getTime() : DAY_MS;
  return new Date(newStart.getTime() + dur);
}
