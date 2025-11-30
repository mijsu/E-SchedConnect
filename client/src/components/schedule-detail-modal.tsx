import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import type { Schedule, Subject, Room } from "@shared/schema";

interface ScheduleDetailModalProps {
  schedule: Schedule | null;
  subject: Subject | undefined;
  room: Room | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

export function ScheduleDetailModal({
  schedule,
  subject,
  room,
  isOpen,
  onClose,
}: ScheduleDetailModalProps) {

  if (!schedule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-2xl w-11/12 sm:w-auto">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-xl sm:text-2xl">{subject?.code}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">{subject?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto scrollbar-hide max-h-[70vh] sm:max-h-none">
          {/* Type and Level Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={schedule.classType === "online" ? "secondary" : "default"} className="text-sm">
              {schedule.classType === "online" ? "Online class" : "Face-to-Face"}
            </Badge>
            {schedule.section && <Badge variant="outline" className="text-sm">Section {schedule.section}</Badge>}
            {schedule.yearLevel && <Badge variant="outline" className="text-sm">{schedule.yearLevel}</Badge>}
          </div>

          {/* Key Details Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2 p-4 rounded-md border border-border bg-card hover-elevate">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Time</p>
              </div>
              <p className="font-semibold text-base sm:text-lg ml-6">
                {formatTime12Hour(schedule.startTime)} - {formatTime12Hour(schedule.endTime)}
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-md border border-border bg-card hover-elevate">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Day</p>
              </div>
              <p className="font-semibold text-base sm:text-lg ml-6 capitalize">{schedule.dayOfWeek}</p>
            </div>

            <div className="space-y-2 p-4 rounded-md border border-border bg-card hover-elevate">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Units</p>
              </div>
              <p className="font-semibold text-base sm:text-lg ml-6">{subject?.units} units</p>
            </div>

            {schedule.classType === "face-to-face" && room && (
              <div className="space-y-2 p-4 rounded-md border border-border bg-card hover-elevate">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Location</p>
                </div>
                <p className="font-semibold text-base sm:text-lg ml-6">{room.code}</p>
              </div>
            )}
          </div>

          {/* Location Details for Face-to-Face */}
          {schedule.classType === "face-to-face" && room && (
            <div className="space-y-3 p-4 rounded-md border border-border bg-card">
              <p className="text-sm font-semibold">Room Information</p>
              <div className="grid gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Room Name:</span>
                  <span className="font-medium">{room.name}</span>
                </div>
                {room.building && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Building:</span>
                    <span className="font-medium">{room.building}</span>
                  </div>
                )}
                {room.capacity && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{room.capacity} students</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
