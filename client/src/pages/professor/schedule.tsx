import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, BookOpen, ChevronLeft, ChevronRight, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Schedule, Professor, Subject, Room, DayOfWeek } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleDetailModal } from "@/components/schedule-detail-modal";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MAP: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday"
};

const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

export default function ProfessorSchedule() {
  const { userProfile } = useAuth();
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: professor } = useQuery({
    queryKey: ["/api/professors/me"],
    queryFn: async () => {
      const q = query(collection(db, "professors"), where("userId", "==", userProfile?.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Professor;
      }
      return null;
    },
    enabled: !!userProfile,
  });

  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ["/api/schedules/mine", professor?.id],
    queryFn: async () => {
      if (!professor) return [];
      const q = query(collection(db, "schedules"), where("professorId", "==", professor.id));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
    },
    enabled: !!professor,
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "subjects"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["/api/rooms"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "rooms"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Room[];
    },
  });

  const getSchedulesByDay = (dayOfWeek: DayOfWeek) => {
    return schedules?.filter(s => s.dayOfWeek === dayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];
  };

  const getSubject = (id: string) => subjects?.find(s => s.id === id);
  const getRoom = (id: string) => rooms?.find(r => r.id === id);

  const handleOpenModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  // Get calendar days for current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = getDaysInMonth();

  if (!professor) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No professor profile found. Please contact the administrator to link your account.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">My Schedule</h1>
        <p className="text-muted-foreground text-lg">Your complete class schedule for the semester - click any class to view details</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{monthName}</CardTitle>
              <CardDescription>Click on a class to view details</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_SHORT.map(day => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="min-h-24 bg-muted/30 rounded-lg" />;
                }

                const dayOfWeek = DAY_MAP[date.getDay()];
                const daySchedules = getSchedulesByDay(dayOfWeek);
                const dateStr = date.getDate();
                const isToday = 
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();

                return (
                  <div 
                    key={date.toISOString()} 
                    className={`min-h-24 rounded-lg border p-2 ${
                      isToday 
                        ? "bg-primary/10 border-primary/40" 
                        : "bg-card hover:bg-accent/50"
                    } transition-colors`}
                  >
                    <div className={`text-sm font-semibold mb-2 ${isToday ? "text-primary" : ""}`}>
                      {dateStr}
                    </div>
                    <div className="space-y-1">
                      {daySchedules.length === 0 ? (
                        <div className="text-xs text-muted-foreground">No classes</div>
                      ) : (
                        daySchedules.map(schedule => {
                          const subject = getSubject(schedule.subjectId);
                          return (
                            <div
                              key={schedule.id}
                              onClick={() => handleOpenModal(schedule)}
                              className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-1.5 cursor-pointer hover:shadow-md transition-shadow"
                              data-testid={`card-schedule-date-${schedule.id}`}
                            >
                              <div className="text-xs font-semibold line-clamp-1 text-blue-900 dark:text-blue-100">
                                {subject?.code}
                              </div>
                              <div className="text-xs text-blue-700 dark:text-blue-300">
                                {formatTime12Hour(schedule.startTime)}
                              </div>
                              {schedule.isPinned && (
                                <Pin className="h-3 w-3 text-amber-500 fill-amber-500 mt-1" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          subject={getSubject(selectedSchedule.subjectId)}
          room={selectedSchedule.roomId ? getRoom(selectedSchedule.roomId) : undefined}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSchedule(null);
          }}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
}
