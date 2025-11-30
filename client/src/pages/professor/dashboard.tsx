import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Clock, BookOpen, ClipboardList, ChevronLeft, ChevronRight, MapPin, Pin, X } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Schedule, Professor, AdjustmentRequest, Subject, Room, DayOfWeek } from "@shared/schema";
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

export default function ProfessorDashboard() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pinnedSchedules, setPinnedSchedules] = useState<Record<string, boolean>>({});

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

  const { data: allSchedules, isLoading: loadingSchedules, refetch: refetchSchedules } = useQuery({
    queryKey: ["/api/schedules"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "schedules"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
    },
  });

  const schedules = useMemo(() => {
    if (!allSchedules || !professor) return [];
    return allSchedules.filter(s => s.professorId === professor.id);
  }, [allSchedules, professor]);

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ["/api/adjustment-requests/mine", professor?.id],
    queryFn: async () => {
      if (!professor) return [];
      const q = query(collection(db, "adjustmentRequests"), where("professorId", "==", professor.id));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdjustmentRequest[];
    },
    enabled: !!professor,
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

  const handlePinSchedule = async (schedule: Schedule) => {
    try {
      const scheduleRef = doc(db, "schedules", schedule.id);
      const newPinnedStatus = !pinnedSchedules[schedule.id];
      
      await updateDoc(scheduleRef, {
        isPinned: newPinnedStatus,
        updatedAt: Date.now(),
      });

      setPinnedSchedules(prev => ({ ...prev, [schedule.id]: newPinnedStatus }));
      refetchSchedules();
      
      toast({
        title: "Success",
        description: newPinnedStatus ? "Schedule pinned" : "Schedule unpinned",
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (schedules?.length) {
      const pinnedMap = schedules.reduce((acc, s) => ({ ...acc, [s.id]: s.isPinned || false }), {});
      setPinnedSchedules(pinnedMap);
    }
  }, [schedules]);

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

  // Stats
  const totalHours = schedules?.reduce((sum, schedule) => {
    const [startHour, startMin] = schedule.startTime.split(":").map(Number);
    const [endHour, endMin] = schedule.endTime.split(":").map(Number);
    const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
    return sum + hours;
  }, 0) || 0;

  const pendingRequests = requests?.filter(r => r.status === "pending").length || 0;

  const stats = [
    {
      title: "Total Classes",
      value: schedules?.length || 0,
      icon: Calendar,
      loading: loadingSchedules,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Teaching Hours/Week",
      value: totalHours.toFixed(1),
      icon: Clock,
      loading: loadingSchedules,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Unique Subjects",
      value: new Set(schedules?.map(s => s.subjectId)).size,
      icon: BookOpen,
      loading: loadingSchedules,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Pending Requests",
      value: pendingRequests,
      icon: ClipboardList,
      loading: loadingRequests,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  if (!professor) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Welcome, {userProfile?.displayName}</h1>
        <p className="text-muted-foreground text-lg">View and manage your teaching schedule</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover-elevate shadow-sm" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xs md:text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl md:text-3xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Calendar */}
      {loadingSchedules ? (
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
                <div key={day} className="text-center font-semibold text-xs sm:text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-1">
              {daysInMonth.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="min-h-16 sm:min-h-20 bg-muted/30 rounded-lg" />;
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
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-16 max-h-[88px] sm:min-h-20 sm:max-h-[88px] rounded-lg border p-1.5 sm:p-2 text-left transition-all cursor-pointer hover-elevate flex flex-col overflow-hidden ${
                      isToday 
                        ? "bg-primary/10 border-primary/40" 
                        : "bg-card hover:bg-accent/50"
                    }`}
                    data-testid={`button-calendar-date-${dateStr}`}
                  >
                    <div className={`text-xs sm:text-sm font-semibold mb-1 ${isToday ? "text-primary" : ""}`}>
                      {dateStr}
                    </div>
                    <div className="space-y-0.5 overflow-y-auto flex-1 scrollbar-hide">
                      {daySchedules.length === 0 ? (
                        <div className="text-xs text-muted-foreground">No classes</div>
                      ) : (
                        <>
                          {daySchedules.map(schedule => {
                            const subject = getSubject(schedule.subjectId);
                            return (
                              <div
                                key={schedule.id}
                                className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-0.5 sm:p-1 cursor-pointer hover:shadow-md transition-shadow text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenModal(schedule);
                                }}
                                data-testid={`card-schedule-date-${schedule.id}`}
                              >
                                <div className="font-semibold line-clamp-1 text-blue-900 dark:text-blue-100 text-xs">
                                  {subject?.code}
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <div className="text-blue-700 dark:text-blue-300 line-clamp-1 text-xs">
                                    {formatTime12Hour(schedule.startTime)}
                                  </div>
                                  {schedule.isPinned && (
                                    <Pin className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Details Modal */}
      {selectedDate && (() => {
        const dayOfWeek = DAY_MAP[selectedDate.getDay()];
        const daySchedules = getSchedulesByDay(dayOfWeek);
        return (
          <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
            <DialogContent className="max-w-full sm:max-w-2xl w-11/12 sm:w-auto sm:min-w-[28rem]">
              <DialogHeader className="space-y-1 sm:space-y-2">
                <DialogTitle className="text-lg sm:text-2xl">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </DialogTitle>
                <DialogDescription className="text-sm">All your classes for this day</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {loadingSchedules ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : daySchedules.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {daySchedules.map((schedule) => {
                      const subject = getSubject(schedule.subjectId);
                      const room = getRoom(schedule.roomId);
                      const isPinned = pinnedSchedules[schedule.id] || false;
                      return (
                        <div
                          key={schedule.id}
                          className="flex items-start justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover-elevate bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950 dark:to-transparent transition-all"
                          data-testid={`card-day-schedule-${schedule.id}`}
                        >
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                            handleOpenModal(schedule);
                            setSelectedDate(null);
                          }}>
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                              <h3 className="font-semibold text-sm sm:text-base">{subject?.code}</h3>
                              <Badge variant={schedule.classType === "online" ? "secondary" : "default"} className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                                {schedule.classType === "online" ? "Online class" : "Face-to-Face class"}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">{subject?.name}</p>
                            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">{formatTime12Hour(schedule.startTime)} - {formatTime12Hour(schedule.endTime)}</span>
                              </div>
                              {schedule.classType === "face-to-face" && room && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                  <span>{room.code} - {room.name}</span>
                                </div>
                              )}
                              {schedule.section && (
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                  <span>Section {schedule.section}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={isPinned ? "default" : "outline"}
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinSchedule(schedule);
                            }}
                            className="shrink-0"
                            data-testid={`button-pin-schedule-${schedule.id}`}
                          >
                            <Pin className={`h-3 w-3 sm:h-4 sm:w-4 ${isPinned ? "fill-current" : ""}`} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No classes scheduled for this day</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Teaching Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Statistics</CardTitle>
          <CardDescription>This week's workload</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Classes</span>
              <span className="font-bold text-lg">{schedules?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Weekly Hours</span>
              <span className="font-bold text-lg">{totalHours.toFixed(1)} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unique Subjects</span>
              <span className="font-bold text-lg">{new Set(schedules?.map(s => s.subjectId)).size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Requests</span>
              <Badge variant={pendingRequests > 0 ? "secondary" : "outline"} className="font-bold">
                {pendingRequests}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your adjustment requests</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {requests && requests.length > 0 ? (
            <div className="space-y-2">
              {requests.slice(0, 3).map((req) => (
                <div key={req.id} className="text-sm flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground truncate flex-1">Request submitted</span>
                  <Badge 
                    variant={req.status === "approved" ? "default" : req.status === "pending" ? "secondary" : "destructive"} 
                    className="capitalize shrink-0 ml-2"
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No requests yet</p>
          )}
        </CardContent>
      </Card>

      {/* Schedule Detail Modal */}
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
        />
      )}
    </div>
  );
}
