import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Users, DoorOpen, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Schedule, Professor, Room, Subject, Department } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const { data: professors } = useQuery({
    queryKey: ["/api/professors"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "professors"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Professor[];
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "schedules"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["/api/rooms"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "rooms"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Room[];
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "subjects"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "departments"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Department[];
    },
  });

  const calculateWorkload = () => {
    if (!professors || !schedules) return [];

    return professors.map(prof => {
      const profSchedules = schedules.filter(s => s.professorId === prof.id);
      const totalHours = profSchedules.reduce((sum, schedule) => {
        const [startHour, startMin] = schedule.startTime.split(":").map(Number);
        const [endHour, endMin] = schedule.endTime.split(":").map(Number);
        const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
        return sum + hours;
      }, 0);

      return {
        professor: prof,
        totalHours,
        totalClasses: profSchedules.length,
        uniqueSubjects: new Set(profSchedules.map(s => s.subjectId)).size,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  };

  const calculateRoomUtilization = () => {
    if (!rooms || !schedules) return [];

    const TOTAL_WEEKLY_HOURS = 5 * 12; // 5 days, 12 hours per day (avg)

    return rooms.map(room => {
      const roomSchedules = schedules.filter(s => s.roomId === room.id);
      const totalHours = roomSchedules.reduce((sum, schedule) => {
        const [startHour, startMin] = schedule.startTime.split(":").map(Number);
        const [endHour, endMin] = schedule.endTime.split(":").map(Number);
        const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
        return sum + hours;
      }, 0);

      const utilizationPercentage = (totalHours / TOTAL_WEEKLY_HOURS) * 100;

      return {
        room,
        totalHours,
        utilizationPercentage: Math.min(utilizationPercentage, 100),
        totalClasses: roomSchedules.length,
      };
    }).sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
  };

  const exportTimetablePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Class Timetable", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    if (!schedules || schedules.length === 0) {
      doc.text("No schedules available", 14, 40);
      doc.save("timetable.pdf");
      return;
    }

    const tableData = schedules.map(schedule => {
      const subject = subjects?.find(s => s.id === schedule.subjectId);
      const professor = professors?.find(p => p.id === schedule.professorId);
      const room = rooms?.find(r => r.id === schedule.roomId);

      return [
        subject?.code || "N/A",
        subject?.name || "N/A",
        `${professor?.firstName} ${professor?.lastName}` || "N/A",
        room?.code || "N/A",
        schedule.dayOfWeek,
        `${schedule.startTime} - ${schedule.endTime}`,
        schedule.section || "-",
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [["Code", "Subject", "Professor", "Room", "Day", "Time", "Section"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });

    doc.save("timetable.pdf");
  };

  const exportWorkloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Professor Workload Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    const workloadData = calculateWorkload();

    const tableData = workloadData.map(item => {
      const dept = departments?.find(d => d.id === item.professor.departmentId);
      return [
        `${item.professor.firstName} ${item.professor.lastName}`,
        dept?.name || "N/A",
        item.totalClasses.toString(),
        item.totalHours.toFixed(1),
        item.uniqueSubjects.toString(),
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [["Professor", "Department", "Classes", "Hours/Week", "Subjects"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("workload-report.pdf");
  };

  const exportUtilizationPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Room Utilization Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    const utilizationData = calculateRoomUtilization();

    const tableData = utilizationData.map(item => [
      item.room.code,
      item.room.name,
      item.room.building,
      item.totalClasses.toString(),
      item.totalHours.toFixed(1),
      `${item.utilizationPercentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Code", "Room", "Building", "Classes", "Hours/Week", "Utilization"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("room-utilization-report.pdf");
  };

  const workloadData = calculateWorkload();
  const utilizationData = calculateRoomUtilization();
  const isLoading = !professors || !schedules || !rooms || !subjects;

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-in">
      {/* Refined Header with Premium Spacing */}
      <div className="space-y-5 pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">ANALYTICS</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" data-testid="text-page-title">
            Reports
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">Generate scheduling analytics and export professional reports</p>
      </div>

      <Tabs defaultValue="workload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workload">Instructor Workload</TabsTrigger>
          <TabsTrigger value="utilization">Room Utilization</TabsTrigger>
          <TabsTrigger value="timetable">Complete Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Professor Workload Report</CardTitle>
                  <CardDescription>Teaching hours and subject distribution</CardDescription>
                </div>
                <Button onClick={exportWorkloadPDF} data-testid="button-export-workload">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Professor</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Classes</TableHead>
                      <TableHead>Hours/Week</TableHead>
                      <TableHead>Unique Subjects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloadData.length > 0 ? (
                      workloadData.map((item) => {
                        const dept = departments?.find(d => d.id === item.professor.departmentId);
                        return (
                          <TableRow key={item.professor.id}>
                            <TableCell className="font-medium">
                              {item.professor.firstName} {item.professor.lastName}
                            </TableCell>
                            <TableCell>{dept?.name || "N/A"}</TableCell>
                            <TableCell>{item.totalClasses}</TableCell>
                            <TableCell>{item.totalHours.toFixed(1)}</TableCell>
                            <TableCell>{item.uniqueSubjects}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Room Utilization Report</CardTitle>
                  <CardDescription>Room occupancy and availability analysis</CardDescription>
                </div>
                <Button onClick={exportUtilizationPDF} data-testid="button-export-utilization">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead>Total Classes</TableHead>
                      <TableHead>Hours/Week</TableHead>
                      <TableHead>Utilization %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilizationData.length > 0 ? (
                      utilizationData.map((item) => (
                        <TableRow key={item.room.id}>
                          <TableCell className="font-medium">{item.room.code}</TableCell>
                          <TableCell>{item.room.name}</TableCell>
                          <TableCell>{item.room.building}</TableCell>
                          <TableCell>{item.totalClasses}</TableCell>
                          <TableCell>{item.totalHours.toFixed(1)}</TableCell>
                          <TableCell>{item.utilizationPercentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Complete Timetable</CardTitle>
                  <CardDescription>All class schedules in one view</CardDescription>
                </div>
                <Button onClick={exportTimetablePDF} data-testid="button-export-timetable">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules && schedules.length > 0 ? (
                      schedules.map((schedule) => {
                        const subject = subjects?.find(s => s.id === schedule.subjectId);
                        const professor = professors?.find(p => p.id === schedule.professorId);
                        const room = rooms?.find(r => r.id === schedule.roomId);

                        return (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{subject?.code}</TableCell>
                            <TableCell>{subject?.name}</TableCell>
                            <TableCell>
                              {professor?.firstName} {professor?.lastName}
                            </TableCell>
                            <TableCell>{room?.code}</TableCell>
                            <TableCell className="capitalize">{schedule.dayOfWeek}</TableCell>
                            <TableCell>
                              {schedule.startTime} - {schedule.endTime}
                            </TableCell>
                            <TableCell>{schedule.section || "—"}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No schedules available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
