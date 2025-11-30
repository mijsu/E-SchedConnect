import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Clock, Calendar, MapPin, BookOpen, ArrowRight, Edit2, FormInput } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { insertAdjustmentRequestSchema, type AdjustmentRequest, type InsertAdjustmentRequest, type Schedule, type Professor, type Room, type Subject, type DayOfWeek } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { TimePicker } from "@/components/time-picker";

const DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00"
];

const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

// Day Selector Component
const DaySelector = ({ value, onChange }: { value: string | undefined; onChange: (day: string) => void }) => {
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


export default function ProfessorRequests() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();
  const { userProfile } = useAuth();

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

  const { data: schedules } = useQuery({
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

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/adjustment-requests/mine", professor?.id],
    queryFn: async () => {
      if (!professor) return [];
      const q = query(collection(db, "adjustmentRequests"), where("professorId", "==", professor.id));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdjustmentRequest[];
    },
    enabled: !!professor,
  });

  const form = useForm<InsertAdjustmentRequest>({
    resolver: zodResolver(insertAdjustmentRequestSchema),
    defaultValues: {
      scheduleId: "",
      professorId: professor?.id || "",
      requestedChanges: {},
      reason: "",
      status: "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAdjustmentRequest) => {
      await addDoc(collection(db, "adjustmentRequests"), {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adjustment-requests/mine"] });
      toast({ title: "Success", description: "Adjustment request submitted successfully" });
      setIsDialogOpen(false);
      setSelectedSchedule(null);
      form.reset();
    },
  });

  const handleOpenDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    form.reset({
      scheduleId: schedule.id,
      professorId: professor?.id || "",
      requestedChanges: {},
      reason: "",
      status: "pending",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertAdjustmentRequest) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "denied":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"><X className="h-3 w-3 mr-1" />Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!professor) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Adjustment Requests</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No professor profile found. Please contact the administrator.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Schedule Adjustments</h1>
        <p className="text-muted-foreground text-lg">Submit and manage your class schedule change requests</p>
      </div>

      {/* Available Classes for Request */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Your Classes</h2>
          <p className="text-muted-foreground">Select a class to request a schedule change</p>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {schedules && schedules.length > 0 ? (
            schedules.map((schedule) => {
              const subject = subjects?.find(s => s.id === schedule.subjectId);
              const room = rooms?.find(r => r.id === schedule.roomId);
              return (
                <Card
                  key={schedule.id}
                  className="hover-elevate transition-all cursor-pointer overflow-hidden"
                  onClick={() => handleOpenDialog(schedule)}
                  data-testid={`card-schedule-${schedule.id}`}
                >
                  <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-1">{subject?.code}</CardTitle>
                        <CardDescription className="text-base font-medium text-foreground">
                          {subject?.name}
                        </CardDescription>
                      </div>
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize font-medium">{schedule.dayOfWeek}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatTime12Hour(schedule.startTime)} - {formatTime12Hour(schedule.endTime)}</span>
                      </div>
                      {schedule.classType === "face-to-face" && room && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{room.code}</span>
                        </div>
                      )}
                      {schedule.classType === "online" && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">Online</Badge>
                        </div>
                      )}
                      {schedule.section && (
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Section {schedule.section}</span>
                        </div>
                      )}
                    </div>
                    <Button className="w-full mt-4" variant="default" size="sm" data-testid={`button-request-${schedule.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Change
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center">
              <p className="text-muted-foreground">No classes assigned</p>
            </div>
          )}
        </div>
      </div>

      {/* Request History */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Request History</h2>
          <p className="text-muted-foreground">Track the status of your adjustment requests</p>
        </div>
        <Card>
          <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => {
                const schedule = schedules?.find(s => s.id === request.scheduleId);
                const subject = subjects?.find(s => s.id === schedule?.subjectId);
                const room = rooms?.find(r => r.id === schedule?.roomId);
                
                return (
                  <div
                    key={request.id}
                    className="border border-border rounded-lg p-4 hover-elevate transition-all"
                    data-testid={`card-request-${request.id}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-base">{subject?.code} - {subject?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(request.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Current vs Requested Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-muted/30 p-4 rounded-lg">
                      {/* Current Schedule */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Current</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize font-medium">{schedule?.dayOfWeek}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatTime12Hour(schedule?.startTime || '00:00')} - {formatTime12Hour(schedule?.endTime || '01:00')}</span>
                          </div>
                          {schedule?.classType === "face-to-face" && room && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{room.code}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center md:flex-col">
                        <ArrowRight className="h-5 w-5 text-muted-foreground md:rotate-90" />
                      </div>

                      {/* Requested Changes */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Requested</p>
                        <div className="space-y-2">
                          {request.requestedChanges.dayOfWeek ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="text-sm capitalize font-medium text-primary">{request.requestedChanges.dayOfWeek}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">—</span>
                            </div>
                          )}
                          {request.requestedChanges.startTime || request.requestedChanges.endTime ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-primary">
                                {formatTime12Hour(request.requestedChanges.startTime || schedule?.startTime || '00:00')} - {formatTime12Hour(request.requestedChanges.endTime || schedule?.endTime || '01:00')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">—</span>
                            </div>
                          )}
                          {request.requestedChanges.roomId ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-primary">{rooms?.find(r => r.id === request.requestedChanges.roomId)?.code}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">—</span>
                            </div>
                          )}
                          {request.requestedChanges.classType ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={request.requestedChanges.classType === "online" ? "secondary" : "default"} className="text-xs text-primary">
                                {request.requestedChanges.classType === "online" ? "Online" : "Face-to-Face"}
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Reason and Notes */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm text-foreground">{request.reason}</p>
                      </div>

                      {request.reviewNotes && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Admin Notes</p>
                          <p className="text-sm text-foreground">{request.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No requests submitted yet
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide" data-testid="dialog-request-form">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-2xl">Request Schedule Change</DialogTitle>
            <DialogDescription>
              Specify what you'd like to change and provide a reason for your request
            </DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <>
              {/* Current Schedule Display */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Current Schedule</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Day</p>
                    <p className="font-semibold text-sm capitalize">{selectedSchedule.dayOfWeek}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Time</p>
                    <p className="font-semibold text-sm">{formatTime12Hour(selectedSchedule.startTime)} - {formatTime12Hour(selectedSchedule.endTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <p className="text-xs text-muted-foreground">Delivery Mode:</p>
                  <Badge variant={selectedSchedule.classType === "online" ? "secondary" : "default"} className="text-xs">
                    {selectedSchedule.classType === "online" ? "Online" : "Face-to-Face"}
                  </Badge>
                </div>
              </div>
            </>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Requested Changes Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm uppercase tracking-wide">Proposed Changes</h4>
                  <p className="text-xs text-muted-foreground">Leave blank to keep current value</p>
                </div>

                {/* Day Selector */}
                <FormField
                  control={form.control}
                  name="requestedChanges.dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold mb-3 block">Select Day</FormLabel>
                      <FormControl>
                        <DaySelector value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestedChanges.startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TimePicker value={field.value} onChange={field.onChange} label="Start Time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestedChanges.endTime"
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

                {/* Room Selector */}
                <FormField
                  control={form.control}
                  name="requestedChanges.roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Room (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-room">
                            <SelectValue placeholder="Keep current" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rooms?.map(room => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.code} - {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery Mode Selector */}
                <FormField
                  control={form.control}
                  name="requestedChanges.classType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Delivery Mode (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-delivery-mode">
                            <SelectValue placeholder="Keep current" />
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
              </div>

              {/* Reason Section */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <FormLabel className="font-bold text-sm uppercase tracking-wide">Reason for Request</FormLabel>
                  <p className="text-xs text-muted-foreground">Please provide details about why you need this change</p>
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Personal commitment, transportation issue, facility availability..."
                          {...field}
                          data-testid="input-reason"
                          className="min-h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Footer */}
              <DialogFooter className="gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
