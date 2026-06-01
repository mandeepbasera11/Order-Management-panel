import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [internal, setInternal] = useState<DateRange | undefined>(value);
  const date = value ?? internal;
  const setDate = (r: DateRange | undefined) => {
    setInternal(r);
    onChange?.(r);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "MMM d, yyyy")} - {format(date.to, "MMM d, yyyy")}
              </>
            ) : (
              format(date.from, "MMM d, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[760px] p-0" align="start">
  <div className="flex">
    {/* Quick Select */}
    <div className="w-44 border-r p-4">
      <h4 className="mb-4 text-sm font-medium text-muted-foreground">
        Quick Select
      </h4>

      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            const today = new Date();
            setDate({ from: today, to: today });
          }}
        >
          Today
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            setDate({
              from: yesterday,
              to: yesterday,
            });
          }}
        >
          Yesterday
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            const today = new Date();

            const start = new Date();
            start.setDate(today.getDate() - 6);

            setDate({
              from: start,
              to: today,
            });
          }}
        >
          Last 7 Days
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            const today = new Date();

            const start = new Date();
            start.setDate(today.getDate() - 29);

            setDate({
              from: start,
              to: today,
            });
          }}
        >
          Last 30 Days
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            const today = new Date();

            setDate({
              from: new Date(
                today.getFullYear(),
                today.getMonth(),
                1
              ),
              to: today,
            });
          }}
        >
          This Month
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            const today = new Date();

            const firstDayLastMonth = new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              1
            );

            const lastDayLastMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              0
            );

            setDate({
              from: firstDayLastMonth,
              to: lastDayLastMonth,
            });
          }}
        >
          Last Month
        </Button>
      </div>
    </div>

    {/* Calendar Section */}
    <div className="flex-1 p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-muted-foreground">
            Start Date
          </label>

          <input
            readOnly
            value={
              date?.from
                ? format(date.from, "MM/dd/yyyy")
                : ""
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">
            End Date
          </label>

          <input
            readOnly
            value={
              date?.to
                ? format(date.to, "MM/dd/yyyy")
                : ""
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          className="p-3 pointer-events-auto"
        />
      </div>

      <div className="mt-4 text-center text-sm font-medium">
        {date?.from &&
          date?.to &&
          `${format(
            date.from,
            "MMM d"
          )} - ${format(date.to, "MMM d, yyyy")}`}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <Button
          variant="ghost"
          onClick={() => setDate(undefined)}
        >
          Reset to Default
        </Button>

        <Button>
          Apply
        </Button>
      </div>
    </div>
  </div>
      </PopoverContent>
    </Popover>
  );
}
