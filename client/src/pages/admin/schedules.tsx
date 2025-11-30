import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Calendar, AlertCircle, ChevronLeft, ChevronRight, Clock, Users, BookOpen, MapPin, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertScheduleSchema, type Schedule, type InsertSchedule, type Professor, type Subject, type Room, type Section, type DayOfWeek } from "@shared/schema";
import { TimePicker } from "@/components/time-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, startOfWeek as startOfWeekFn, subWeeks, addWeeks, isBefore, isAfter, isSameDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00"
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const SEMESTERS = ["First Sem", "Second Sem"];

interface ConflictCheck {
  hasConflict: boolean;
  conflicts: string[];
}

// Calendar localizer setup
const locales = {
  "en-US": enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Schedule;
}

// Helper to get Monday of current week
const getCurrentWeekMonday = () => {
  const today = new Date();
  const monday = startOfWeekFn(today, { weekStartsOn: 1 });
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

// Helper to convert 24-hour format to 12-hour format with AM/PM
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

// Day Selector Component
const DaySelector = ({ value, onChange }: { value: string; onChange: (day: string) => void }) => {
  const dayLabels = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onChange(day)}
          className={`py-2 px-1 rounded-lg font-semibold text-sm transition-all ${
            value === day
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted hover-elevate text-muted-foreground border border-border"
          }`}
          data-testid={`button-day-${day}`}
        >
          {dayLabels[day as DayOfWeek]}
        </button>
      ))}
    </div>
  );
};


export default function Schedules() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictCheck>({ hasConflict: false, conflicts: [] });
  const [calendarView, setCalendarView] = useState<typeof Views.MONTH>("month");
  const [selectedWeekStart, setSelectedWeekStart] = useState<number>(getCurrentWeekMonday());
  const [viewMode, setViewMode] = useState<"current" | "history">("current");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [filterYearLevel, setFilterYearLevel] = useState<string | null>(null);
  const [filterClassType, setFilterClassType] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const { data: professors } = useQuery({
    queryKey: ["/api/professors"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "professors"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Professor[];
    },
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

  const { data: sections } = useQuery({
    queryKey: ["/api/sections"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "sections"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Section[];
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["/api/schedules"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "schedules"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
    },
  });

  const form = useForm<InsertSchedule>({
    resolver: zodResolver(insertScheduleSchema),
    defaultValues: {
      subjectId: "",
      professorId: "",
      roomId: "",
      dayOfWeek: "monday",
      startTime: "08:00",
      endTime: "09:00",
      semester: "First Sem",
      academicYear: "2024-2025",
      section: "",
      classType: "face-to-face",
      yearLevel: "",
      weekStartDate: getCurrentWeekMonday(),
      createdBy: userProfile?.id || "",
    },
  });

  // Watch form values for real-time conflict checking
  const watchedFormValues = form.watch();

  useEffect(() => {
    if (isDialogOpen && schedules) {
      const conflictCheck = checkConflicts(watchedFormValues, editingSchedule?.id);
      setConflicts(conflictCheck);
    }
  }, [watchedFormValues, isDialogOpen, schedules, editingSchedule?.id]);

  // Filter schedules by week
  const currentWeekSchedules = useMemo(() => {
    if (!schedules) return [];
    const weekEnd = selectedWeekStart + (7 * 24 * 60 * 60 * 1000);
    return schedules.filter(s => s.weekStartDate >= selectedWeekStart && s.weekStartDate < weekEnd);
  }, [schedules, selectedWeekStart]);

  // Get past schedules for history
  const pastSchedules = useMemo(() => {
    if (!schedules) return [];
    const currentMonday = getCurrentWeekMonday();
    return schedules.filter(s => s.weekStartDate < currentMonday);
  }, [schedules]);

  const checkConflicts = (data: InsertSchedule, excludeId?: string): ConflictCheck => {
    if (!schedules) return { hasConflict: false, conflicts: [] };

    const conflictMessages: string[] = [];
    // Check conflicts with schedules from the same week
    const relevantSchedules = schedules.filter(s => 
      s.id !== excludeId && 
      s.weekStartDate === data.weekStartDate
    );

    // Helper function to check time overlap with 1-minute precision
    const hasTimeOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
      const [aStart] = startA.split(":").map(Number);
      const [aEnd] = endA.split(":").map(Number);
      const [bStart] = startB.split(":").map(Number);
      const [bEnd] = endB.split(":").map(Number);

      // Convert to minutes for precise comparison
      const aStartMin = aStart * 60 + parseInt(startA.split(":")[1]);
      const aEndMin = aEnd * 60 + parseInt(endA.split(":")[1]);
      const bStartMin = bStart * 60 + parseInt(startB.split(":")[1]);
      const bEndMin = bEnd * 60 + parseInt(endB.split(":")[1]);

      // Check for any overlap (including edge cases)
      return !(aEndMin <= bStartMin || bEndMin <= aStartMin);
    };

    // Check for same day and overlapping time
    const daySchedules = relevantSchedules.filter(s => s.dayOfWeek === data.dayOfWeek);
    const checkedConflicts = new Set<string>(); // Avoid duplicate messages

    for (const existing of daySchedules) {
      const overlapExists = hasTimeOverlap(
        existing.startTime,
        existing.endTime,
        data.startTime,
        data.endTime
      );

      if (overlapExists) {
        // Same professor conflict (applies to all class types: online and face-to-face)
        if (existing.professorId === data.professorId) {
          const conflictKey = `prof-${data.professorId}`;
          if (!checkedConflicts.has(conflictKey)) {
            const prof = professors?.find(p => p.id === data.professorId);
            const existingType = existing.classType === "face-to-face" ? "face-to-face class" : "online class";
            conflictMessages.push(
              `Professor ${prof?.firstName} ${prof?.lastName} is already teaching a ${existingType} on ${data.dayOfWeek} from ${existing.startTime} to ${existing.endTime}`
            );
            checkedConflicts.add(conflictKey);
          }
        }

        // Same room conflict (only for face-to-face classes, online classes don't use rooms)
        if (data.classType === "face-to-face" && existing.roomId === data.roomId && data.roomId) {
          const conflictKey = `room-${data.roomId}`;
          if (!checkedConflicts.has(conflictKey)) {
            const room = rooms?.find(r => r.id === data.roomId);
            conflictMessages.push(
              `Room ${room?.code} is already booked on ${data.dayOfWeek} from ${existing.startTime} to ${existing.endTime}`
            );
            checkedConflicts.add(conflictKey);
          }
        }

        // Same section conflict (same section can't have overlapping classes at same time)
        if ((existing.section?.trim() || "") === (data.section?.trim() || "") && data.section?.trim() && existing.classType === data.classType) {
          const conflictKey = `section-${data.section?.trim()}-${data.classType}`;
          if (!checkedConflicts.has(conflictKey)) {
            const existingSubject = subjects?.find(s => s.id === existing.subjectId);
            const dataSubject = subjects?.find(s => s.id === data.subjectId);
            const classTypeLabel = data.classType === "face-to-face" ? "face-to-face class" : "online class";
            conflictMessages.push(
              `Section ${data.section} already has a ${classTypeLabel} (${existingSubject?.code}) on ${data.dayOfWeek} from ${existing.startTime} to ${existing.endTime}`
            );
            checkedConflicts.add(conflictKey);
          }
        }
      }
    }

    return {
      hasConflict: conflictMessages.length > 0,
      conflicts: conflictMessages,
    };
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertSchedule) => {
      const conflictCheck = checkConflicts(data);
      if (conflictCheck.hasConflict) {
        throw new Error(conflictCheck.conflicts.join("; "));
      }

      await addDoc(collection(db, "schedules"), {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Success", description: "Schedule created successfully" });
      setIsDialogOpen(false);
      setConflicts({ hasConflict: false, conflicts: [] });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Conflict Detected", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertSchedule }) => {
      const conflictCheck = checkConflicts(data, id);
      if (conflictCheck.hasConflict) {
        throw new Error(conflictCheck.conflicts.join("; "));
      }

      await updateDoc(doc(db, "schedules", id), {
        ...data,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Success", description: "Schedule updated successfully" });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      setConflicts({ hasConflict: false, conflicts: [] });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Conflict Detected", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "schedules", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Success", description: "Schedule deleted successfully" });
    },
  });

  const handleOpenDialog = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      form.reset({
        subjectId: schedule.subjectId,
        professorId: schedule.professorId,
        roomId: schedule.roomId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        semester: schedule.semester,
        academicYear: schedule.academicYear,
        section: schedule.section || "",
        classType: schedule.classType || "face-to-face",
        yearLevel: schedule.yearLevel || "",
        weekStartDate: schedule.weekStartDate,
        createdBy: schedule.createdBy,
      });
    } else {
      setEditingSchedule(null);
      form.reset({
        subjectId: "",
        professorId: "",
        roomId: "",
        dayOfWeek: "monday",
        startTime: "08:00",
        endTime: "09:00",
        semester: "Fall 2024",
        academicYear: "2024-2025",
        section: "",
        classType: "face-to-face",
        yearLevel: "",
        weekStartDate: selectedWeekStart,
        createdBy: userProfile?.id || "",
      });
    }
    setConflicts({ hasConflict: false, conflicts: [] });
    setIsDialogOpen(true);
  };

  const handleDelete = (schedule: Schedule) => {
    setDeletingSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingSchedule) {
      deleteMutation.mutate(deletingSchedule.id);
      setIsDeleteDialogOpen(false);
      setDeletingSchedule(null);
    }
  };

  const handleSubmit = (data: InsertSchedule) => {
    const conflictCheck = checkConflicts(data, editingSchedule?.id);
    setConflicts(conflictCheck);

    if (!conflictCheck.hasConflict) {
      if (editingSchedule) {
        updateMutation.mutate({ id: editingSchedule.id, data });
      } else {
        createMutation.mutate(data);
      }
    }
  };

  const getScheduleDetails = (schedule: Schedule) => {
    const professor = professors?.find(p => p.id === schedule.professorId);
    const subject = subjects?.find(s => s.id === schedule.subjectId);
    const room = rooms?.find(r => r.id === schedule.roomId);
    return { professor, subject, room };
  };

  // Calendar View Helper
  const getSchedulesForDayAndTime = (day: DayOfWeek, time: string) => {
    return schedules?.filter(s => {
      if (s.dayOfWeek !== day) return false;
      return s.startTime <= time && s.endTime > time;
    }) || [];
  };

  // Get schedules for a selected date
  const getSchedulesForDate = (date: Date) => {
    const dayIndex = date.getDay();
    const dayMap: { [key: number]: DayOfWeek } = {
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
      0: "sunday",
    };
    const dayOfWeek = dayMap[dayIndex];
    return schedules?.filter(s => s.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];
  };

  // Check if a date has any schedules
  const dateHasSchedules = (date: Date) => {
    return getSchedulesForDate(date).length > 0;
  };

  // Convert schedules to calendar events - group by day
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!schedules) return [];
    
    const today = new Date();
    const dayMap: { [key: string]: number } = {
      "monday": 1,
      "tuesday": 2,
      "wednesday": 3,
      "thursday": 4,
      "friday": 5,
      "saturday": 6,
      "sunday": 0,
    };
    
    // Group schedules by day
    const eventsByDay: { [key: string]: Schedule[] } = {};
    schedules.forEach(schedule => {
      if (!eventsByDay[schedule.dayOfWeek]) {
        eventsByDay[schedule.dayOfWeek] = [];
      }
      eventsByDay[schedule.dayOfWeek].push(schedule);
    });
    
    // Create one event per day
    const events: CalendarEvent[] = [];
    Object.entries(eventsByDay).forEach(([dayOfWeek, daySchedules]) => {
      const currentDay = today.getDay();
      const targetDay = dayMap[dayOfWeek];
      const daysOffset = targetDay - currentDay;
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + daysOffset);
      
      // Find earliest start time and latest end time for the day
      let earliestStart = "23:59";
      let latestEnd = "00:00";
      
      daySchedules.forEach(s => {
        if (s.startTime < earliestStart) earliestStart = s.startTime;
        if (s.endTime > latestEnd) latestEnd = s.endTime;
      });
      
      const [startHour, startMin] = earliestStart.split(":").map(Number);
      const [endHour, endMin] = latestEnd.split(":").map(Number);
      
      const start = new Date(eventDate);
      start.setHours(startHour, startMin, 0, 0);
      
      const end = new Date(eventDate);
      end.setHours(endHour, endMin, 0, 0);
      
      events.push({
        id: `day-${dayOfWeek}`,
        title: "Occupied",
        start,
        end,
        resource: daySchedules[0],
      });
    });
    
    return events;
  }, [schedules]);

  // Custom event style getter for better visual presentation
  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: "hsl(var(--primary))",
        borderRadius: "0.375rem",
        opacity: 0.9,
        color: "hsl(var(--primary-foreground))",
        border: "none",
        display: "block",
      },
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl" data-testid="text-page-title">Schedules</h1>
          <p className="text-muted-foreground">Create and manage class schedules</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-schedule">
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      <Tabs defaultValue="advanced-calendar" className="space-y-4">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1 bg-muted rounded-md">
          <TabsTrigger value="advanced-calendar" className="flex-1 min-w-[120px] text-xs sm:text-sm md:text-base px-2 sm:px-3">Advanced Calendar</TabsTrigger>
          <TabsTrigger value="table" className="flex-1 min-w-[110px] text-xs sm:text-sm md:text-base px-2 sm:px-3">Current Week</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 min-w-[80px] text-xs sm:text-sm md:text-base px-2 sm:px-3">History</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 min-w-[100px] text-xs sm:text-sm md:text-base px-2 sm:px-3">Weekly Grid</TabsTrigger>
        </TabsList>

        <TabsContent value="advanced-calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl md:text-3xl">Schedule Calendar</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Professional calendar view of all class schedules</CardDescription>
                </div>
                <div className="flex flex-wrap gap-1 md:gap-2">
                  <Button
                    variant={calendarView === Views.MONTH ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarView(Views.MONTH)}
                    data-testid="button-view-month"
                    className="text-xs md:text-sm"
                  >
                    Month
                  </Button>
                  <Button
                    variant={calendarView === Views.WEEK ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarView(Views.WEEK)}
                    data-testid="button-view-week"
                    className="text-xs md:text-sm"
                  >
                    Week
                  </Button>
                  <Button
                    variant={calendarView === Views.DAY ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarView(Views.DAY)}
                    data-testid="button-view-day"
                    className="text-xs md:text-sm"
                  >
                    Day
                  </Button>
                  <Button
                    variant={calendarView === Views.AGENDA ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarView(Views.AGENDA)}
                    data-testid="button-view-agenda"
                    className="text-xs md:text-sm"
                  >
                    Agenda
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rbc-calendar-wrapper h-[550px] sm:h-[650px] md:h-[800px]">
                <BigCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  view={calendarView}
                  onView={setCalendarView}
                  popup
                  selectable
                  onSelectEvent={(event: CalendarEvent) => {
                    const dayOfWeekKey = event.id.split("-")[1];
                    setSelectedDay(dayOfWeekKey);
                    setIsDayViewOpen(true);
                  }}
                  eventPropGetter={eventStyleGetter}
                  style={{ height: "100%" }}
                  data-testid="calendar-advanced"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Current Week Schedules</CardTitle>
                  <CardDescription>Schedules for {format(new Date(selectedWeekStart), 'MMM d, yyyy')}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWeekStart(selectedWeekStart - 7 * 24 * 60 * 60 * 1000)}
                    data-testid="button-prev-week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isSameDay(new Date(selectedWeekStart), new Date(getCurrentWeekMonday())) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWeekStart(getCurrentWeekMonday())}
                    data-testid="button-current-week"
                  >
                    Current
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWeekStart(selectedWeekStart + 7 * 24 * 60 * 60 * 1000)}
                    data-testid="button-next-week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={`skeleton-current-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Class Type</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules && schedules.length > 0 ? (
                      schedules.map((schedule) => {
                        const { professor, subject, room } = getScheduleDetails(schedule);
                        return (
                          <TableRow key={schedule.id} data-testid={`row-schedule-${schedule.id}`}>
                            <TableCell className="font-medium">{subject?.code} - {subject?.name}</TableCell>
                            <TableCell>{professor?.firstName} {professor?.lastName}</TableCell>
                            <TableCell>{schedule.classType === "online" ? "—" : room?.code}</TableCell>
                            <TableCell className="capitalize">{schedule.dayOfWeek}</TableCell>
                            <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                            <TableCell>
                              <Badge variant={schedule.classType === "online" ? "secondary" : "default"} className="capitalize">
                                {schedule.classType === "online" ? "Online" : "Face-to-Face"}
                              </Badge>
                            </TableCell>
                            <TableCell>{schedule.section || "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialog(schedule)}
                                  data-testid={`button-edit-${schedule.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(schedule)}
                                  data-testid={`button-delete-${schedule.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No schedules found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule History</CardTitle>
              <CardDescription>Past schedules from previous weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastSchedules && pastSchedules.length > 0 ? (
                    pastSchedules.map((schedule) => {
                      const { professor, subject, room } = getScheduleDetails(schedule);
                      return (
                        <TableRow key={schedule.id} data-testid={`row-history-${schedule.id}`}>
                          <TableCell className="font-medium">{subject?.code} - {subject?.name}</TableCell>
                          <TableCell>{professor?.firstName} {professor?.lastName}</TableCell>
                          <TableCell>{schedule.classType === "online" ? "—" : room?.code}</TableCell>
                          <TableCell className="capitalize">{schedule.dayOfWeek}</TableCell>
                          <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                          <TableCell>{format(new Date(schedule.weekStartDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(schedule)}
                              data-testid={`button-delete-${schedule.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No past schedules
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Calendar</CardTitle>
              <CardDescription>Visual representation of all class schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-8 gap-px bg-border">
                    <div className="bg-card p-2 font-medium text-sm">Time</div>
                    {DAYS.map(day => (
                      <div key={day} className="bg-card p-2 font-medium text-sm capitalize text-center">
                        {day}
                      </div>
                    ))}
                    
                    {TIME_SLOTS.filter((_, i) => i % 2 === 0).map(time => (
                      <>
                        <div key={time} className="bg-card p-2 text-xs text-muted-foreground border-t">
                          {time}
                        </div>
                        {DAYS.map(day => {
                          const daySchedules = getSchedulesForDayAndTime(day, time);
                          return (
                            <div key={`${day}-${time}`} className="bg-background p-1 border-t min-h-[60px]">
                              {daySchedules.map(schedule => {
                                const { subject, room } = getScheduleDetails(schedule);
                                return (
                                  <Badge
                                    key={schedule.id}
                                    variant="secondary"
                                    className="text-xs mb-1 block truncate"
                                  >
                                    {subject?.code} {room?.code}
                                  </Badge>
                                );
                              })}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-sm md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide p-4 sm:p-6 md:p-8" data-testid="dialog-schedule-form">
          <DialogHeader className="mb-3 sm:mb-4">
            <DialogTitle className="text-xl sm:text-2xl">{editingSchedule ? "Edit Schedule" : "Create New Schedule"}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {editingSchedule ? "Update class schedule details" : "Add a new class to the schedule"}
            </DialogDescription>
          </DialogHeader>

          {conflicts.hasConflict && (
            <Alert variant="destructive" className="mb-4 sm:mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Scheduling Conflicts Detected:</strong>
                <ul className="list-disc list-inside mt-2">
                  {conflicts.conflicts.map((conflict, i) => (
                    <li key={i}>{conflict}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. Class Type */}
                <FormField
                  control={form.control}
                  name="classType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-classType">
                            <SelectValue placeholder="Select class type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="face-to-face">Face-to-Face</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 2. Professor */}
                <FormField
                  control={form.control}
                  name="professorId"
                  render={({ field }) => {
                    const professorOptions: ComboboxOption[] = (professors || []).map(prof => ({
                      value: prof.id,
                      label: `${prof.firstName} ${prof.lastName}`
                    }));
                    return (
                      <FormItem>
                        <FormLabel>Professor</FormLabel>
                        <FormControl>
                          <Combobox
                            options={professorOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select professor..."
                            searchPlaceholder="Search professors..."
                            data_testid="combobox-professor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* 3. Year Level */}
                <FormField
                  control={form.control}
                  name="yearLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-yearLevel">
                            <SelectValue placeholder="Select year level (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {YEAR_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 4. Course/Section */}
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course/Section</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-section">
                            <SelectValue placeholder="Select section (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {sections?.map(section => (
                            <SelectItem key={section.id} value={section.code}>{section.code} - {section.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 5. Semester */}
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-semester">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEMESTERS.map((sem) => (
                            <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 6. Subject */}
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => {
                    const selectedYearLevel = form.watch("yearLevel");
                    const filteredSubjects = selectedYearLevel
                      ? subjects?.filter(s => s.yearLevel === selectedYearLevel) || []
                      : subjects || [];
                    const subjectOptions: ComboboxOption[] = (filteredSubjects || []).map(subject => ({
                      value: subject.id,
                      label: `${subject.code} - ${subject.name}`
                    }));
                    
                    return (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Combobox
                            options={subjectOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={selectedYearLevel ? "Select subject..." : "Select year level first"}
                            searchPlaceholder="Search subjects..."
                            disabled={!selectedYearLevel}
                            data_testid="combobox-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* 7. Room (conditionally shown for face-to-face) */}
                {form.watch("classType") === "face-to-face" && (
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => {
                      const roomOptions: ComboboxOption[] = (rooms || []).map(room => ({
                        value: room.id,
                        label: `${room.code} - ${room.name}`
                      }));
                      return (
                        <FormItem>
                          <FormLabel>Room</FormLabel>
                          <FormControl>
                            <Combobox
                              options={roomOptions}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select room..."
                              searchPlaceholder="Search rooms..."
                              data_testid="combobox-room"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                {/* 8. Day of Week - Modern Visual Selector */}
              </div>

              {/* Day Selector Full Width */}
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem className="mt-6 pt-2">
                    <FormLabel className="text-base font-semibold mb-4 block">Select Day of Week</FormLabel>
                    <FormControl>
                      <DaySelector value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Pickers */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} label="Start Time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Time */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} label="End Time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending || conflicts.hasConflict}
                  data-testid="button-submit"
                  className="w-full sm:w-auto"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Day View Modal - Shows all professors' schedules for selected day */}
      <Dialog open={isDayViewOpen} onOpenChange={(open) => {
        setIsDayViewOpen(open);
        if (!open) {
          setFilterYearLevel(null);
          setFilterClassType(null);
          setFilterCourse(null);
        }
      }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-sm md:max-w-2xl lg:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col bg-background border border-border/50">
          {/* Premium Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/40 px-6 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {selectedDay && selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Schedule
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm ml-11">
              {selectedDay && schedules?.filter(s => s.dayOfWeek === selectedDay).length > 0 
                ? `${schedules?.filter(s => s.dayOfWeek === selectedDay).length} class${schedules?.filter(s => s.dayOfWeek === selectedDay).length !== 1 ? 'es' : ''} scheduled today`
                : "No classes scheduled on this day"}
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {selectedDay && schedules?.filter(s => s.dayOfWeek === selectedDay).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 h-full">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">No classes scheduled</p>
                <p className="text-muted-foreground/60 text-sm mt-1">This day is completely free</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Premium Filters */}
                {(() => {
                  const daySchedules = selectedDay ? schedules?.filter(s => s.dayOfWeek === selectedDay) || [] : [];
                  const classTypes = Array.from(new Set(daySchedules.map(s => s.classType).filter(Boolean))) as string[];
                  const yearLevels = Array.from(new Set(daySchedules.map(s => s.yearLevel).filter(Boolean))) as string[];
                  const courses = Array.from(new Set(daySchedules.map(s => s.section).filter(Boolean).filter((s: string) => s.trim() !== ""))) as string[];

                  // Calculate filtered count
                  const filteredCount = daySchedules.filter(s => 
                    (filterClassType === null || s.classType === filterClassType) &&
                    (filterYearLevel === null || s.yearLevel === filterYearLevel) &&
                    (filterCourse === null || s.section === filterCourse)
                  ).length;

                  return (
                    <div className="space-y-4">
                      {/* Dropdowns Row */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* Class Type Dropdown */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class Type</label>
                          <Select value={filterClassType || "all"} onValueChange={(val) => setFilterClassType(val === "all" ? null : val)}>
                            <SelectTrigger data-testid="select-class-type" className="text-sm">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {classTypes.map(type => {
                                const displayType = type === "face-to-face" ? "Face to Face" : "Online";
                                return (
                                  <SelectItem key={type} value={type} data-testid={`option-type-${type}`}>
                                    {displayType}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Year Level Dropdown */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year Level</label>
                          <Select value={filterYearLevel || "all"} onValueChange={(val) => setFilterYearLevel(val === "all" ? null : val)}>
                            <SelectTrigger data-testid="select-year-level" className="text-sm">
                              <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              {yearLevels.map(level => {
                                return (
                                  <SelectItem key={level} value={level} data-testid={`option-level-${level}`}>
                                    {level}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Course Dropdown */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course/Section</label>
                          <Select value={filterCourse || "all"} onValueChange={(val) => setFilterCourse(val === "all" ? null : val)}>
                            <SelectTrigger data-testid="select-course" className="text-sm">
                              <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Courses</SelectItem>
                              {courses.map(course => {
                                return (
                                  <SelectItem key={course} value={course} data-testid={`option-course-${course}`}>
                                    {course}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Results Summary */}
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="text-sm font-semibold text-foreground">
                          Showing {filteredCount} of {daySchedules.length} classes
                        </span>
                        {(filterClassType || filterYearLevel || filterCourse) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFilterClassType(null);
                              setFilterYearLevel(null);
                              setFilterCourse(null);
                            }}
                            data-testid="button-reset-filters"
                            className="text-xs"
                          >
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Premium Schedules Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selectedDay && schedules?.filter(s => s.dayOfWeek === selectedDay)
                    .filter(s => (filterClassType === null || s.classType === filterClassType) &&
                                 (filterYearLevel === null || s.yearLevel === filterYearLevel) &&
                                 (filterCourse === null || s.section === filterCourse))
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((schedule, idx) => {
                      const professor = professors?.find(p => p.id === schedule.professorId);
                      const subject = subjects?.find(s => s.id === schedule.subjectId);
                      const room = rooms?.find(r => r.id === schedule.roomId);

                      return (
                        <div key={schedule.id} className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 hover-elevate transition-all duration-300">
                          {/* Gradient accent bar */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                          
                          <div className="p-3 space-y-3">
                            {/* Header with professor info */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <div className="p-1.5 bg-primary/15 rounded-lg">
                                    <Users className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <p className="text-base font-bold leading-tight text-foreground" data-testid="text-professor-name">
                                    {professor?.firstName} {professor?.lastName}
                                  </p>
                                </div>
                                <div className="ml-8 space-y-0.5">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-subject-code">
                                    {subject?.code}
                                  </p>
                                  <p className="text-xs text-foreground font-medium">{subject?.name}</p>
                                </div>
                              </div>
                              {/* Action buttons */}
                              <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    setIsDayViewOpen(false);
                                    handleOpenDialog(schedule);
                                  }}
                                  data-testid="button-edit-schedule"
                                  className="h-8 w-8 rounded-lg"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleDelete(schedule)}
                                  data-testid="button-delete-schedule"
                                  className="h-8 w-8 rounded-lg hover:border-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Details - Compact Layout */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                              {/* Time */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-primary/70" />
                                  <span className="text-xs font-semibold text-muted-foreground uppercase">Time</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground" data-testid="text-schedule-time">
                                    {formatTime12Hour(schedule.startTime)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">to {formatTime12Hour(schedule.endTime)}</p>
                                </div>
                              </div>

                              {/* Type */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Award className="h-3 w-3 text-primary/70" />
                                  <span className="text-xs font-semibold text-muted-foreground uppercase">Type</span>
                                </div>
                                <Badge 
                                  variant={schedule.classType === "face-to-face" ? "default" : "secondary"}
                                  className="text-xs font-semibold"
                                  data-testid="text-class-type"
                                >
                                  {schedule.classType === "face-to-face" ? "Face to Face" : "Online"}
                                </Badge>
                              </div>

                              {/* Room - if face to face */}
                              {schedule.classType === "face-to-face" && room && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-primary/70" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Room</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-foreground" data-testid="text-room-code">
                                      {room.code}
                                    </p>
                                    <p className="text-xs text-muted-foreground" data-testid="text-room-name">
                                      {room.name}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Section */}
                              {schedule.section && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3 text-primary/70" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Section</span>
                                  </div>
                                  <p className="text-xs font-bold text-foreground" data-testid="text-schedule-section">
                                    {schedule.section}
                                  </p>
                                </div>
                              )}

                              {/* Year Level */}
                              {schedule.yearLevel && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Award className="h-3 w-3 text-primary/70" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Level</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs font-semibold w-fit" data-testid="text-year-level">
                                    {schedule.yearLevel}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-confirm-delete-schedule">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
              {deletingSchedule && (
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {subjects?.find(s => s.id === deletingSchedule.subjectId)?.code} - {professors?.find(p => p.id === deletingSchedule.professorId)?.firstName} {professors?.find(p => p.id === deletingSchedule.professorId)?.lastName}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
