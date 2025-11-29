import { FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

interface TimePickerProps {
  value: string | undefined;
  onChange: (time: string) => void;
  label: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [hours, minutes] = value ? value.split(":").map(Number) : [8, 0];
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;

  const handleHourChange = (newHours12: string) => {
    const hour12 = parseInt(newHours12, 10);
    let hour24 = hour12;
    if (period === "PM" && hour12 !== 12) {
      hour24 = hour12 + 12;
    } else if (period === "AM" && hour12 === 12) {
      hour24 = 0;
    }
    onChange(`${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  };

  const handleMinuteChange = (newMinutes: string) => {
    onChange(`${String(hours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`);
  };

  const handlePeriodChange = (newPeriod: string) => {
    let hour24 = hours;
    if (newPeriod === "PM" && hours < 12 && hours !== 0) {
      hour24 = hours + 12;
    } else if (newPeriod === "AM" && hours >= 12) {
      hour24 = hours - 12;
    }
    onChange(`${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-2">
      <FormLabel className="text-xs sm:text-sm font-semibold">{label}</FormLabel>
      
      {/* Mobile-responsive grid */}
      <div className="grid grid-cols-3 sm:flex sm:items-end gap-1.5 sm:gap-2">
        {/* Hour Selector */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium block">Hour</label>
          <Select value={String(hours12)} onValueChange={handleHourChange}>
            <SelectTrigger data-testid={`select-hours-${label.toLowerCase()}`} className="text-xs sm:text-sm h-9 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Separator - hidden on mobile, shown on larger screens */}
        <div className="hidden sm:flex sm:items-end sm:pb-1 text-lg font-bold text-muted-foreground">:</div>

        {/* Minute Selector */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium block">Min</label>
          <Select value={String(minutes).padStart(2, "0")} onValueChange={handleMinuteChange}>
            <SelectTrigger data-testid={`select-minutes-${label.toLowerCase()}`} className="text-xs sm:text-sm h-9 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {[0, 15, 30, 45].map((m) => (
                <SelectItem key={m} value={String(m).padStart(2, "0")}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AM/PM Selector */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium block">Period</label>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger data-testid={`select-period-${label.toLowerCase()}`} className="text-xs sm:text-sm h-9 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time Display */}
      <div className="px-2 py-1.5 sm:px-3 sm:py-2 border border-border rounded-md text-center font-semibold text-xs sm:text-sm bg-muted text-muted-foreground">
        {formatTime12Hour(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`)}
      </div>
    </div>
  );
}
