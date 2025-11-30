import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Users, BookOpen, DoorOpen, Calendar, Link2, Zap, BarChart3, AlertCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { type ChartConfig } from "@/components/ui/chart";

export default function AdminDashboard() {
  const { userProfile, signOut } = useAuth();
  const [, navigate] = useLocation();
  const { data: professors, isLoading: loadingProfessors } = useQuery({
    queryKey: ["/api/professors"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "professors"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "subjects"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ["/api/rooms"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "rooms"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ["/api/schedules"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "schedules"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const { data: adjustmentRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ["/api/adjustment-requests"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "adjustmentRequests"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  const pendingRequests = adjustmentRequests?.filter((r: any) => r.status === "pending").length || 0;

  // Chart data computations
  const professorScheduleData = professors?.map((prof: any) => ({
    name: `${prof.firstName} ${prof.lastName}` || "Unknown",
    schedules: schedules?.filter((s: any) => s.professorId === prof.id).length || 0,
  })) || [];

  const roomUtilizationData = rooms?.map((room: any) => ({
    name: room.code || room.name || "Unknown",
    usage: schedules?.filter((s: any) => s.roomId === room.id).length || 0,
  })).filter((room: any) => room.usage > 0) || [];

  const classTypeData = [
    {
      name: "Face to Face",
      count: schedules?.filter((s: any) => s.classType === "face-to-face").length || 0,
    },
    {
      name: "Online",
      count: schedules?.filter((s: any) => s.classType === "online").length || 0,
    },
  ];

  const professorChartConfig = {
    schedules: {
      label: "Schedules",
      color: "var(--color-professor)",
    },
  } satisfies ChartConfig;

  const roomChartConfig = {
    usage: {
      label: "Usage Count",
      color: "var(--color-room)",
    },
  } satisfies ChartConfig;

  const classTypeChartConfig = {
    "face-to-face": {
      label: "Face to Face",
      color: "var(--color-face-to-face)",
    },
    online: {
      label: "Online",
      color: "var(--color-online)",
    },
  } satisfies ChartConfig;

  const stats = [
    {
      title: "Total Professors",
      value: professors?.length || 0,
      icon: Users,
      loading: loadingProfessors,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Subjects",
      value: subjects?.length || 0,
      icon: BookOpen,
      loading: loadingSubjects,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Rooms",
      value: rooms?.length || 0,
      icon: DoorOpen,
      loading: loadingRooms,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Total Schedules",
      value: schedules?.length || 0,
      icon: Calendar,
      loading: loadingSchedules,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 lg:space-y-10 animate-fade-in">
      {/* Refined Header with Premium Spacing */}
      <div className="space-y-3 md:space-y-4 pb-4 md:pb-6 lg:pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">ADMIN DASHBOARD</p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight" data-testid="text-page-title">
            Welcome back, {userProfile?.displayName}
          </h1>
        </div>
        <p className="text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">Manage your institution's complete scheduling ecosystem</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-2 md:gap-3 lg:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const gradients = [
            "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20",
            "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
            "from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20",
            "from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20",
          ];
          return (
            <Card key={stat.title} className={`hover-elevate shadow-md lg:shadow-lg transition-all bg-gradient-to-br ${gradients[index]}`} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 lg:pb-3">
                <CardTitle className="text-xs md:text-sm lg:text-base font-semibold line-clamp-2">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 md:p-2 lg:p-2.5 rounded-lg flex-shrink-0 ${stat.color.replace('text-', 'bg-').replace('-600', '-100').replace('-400', '-900/20')} dark:${stat.color.replace('text-', 'bg-').replace('-400', '-500/30')}`}>
                  <Icon className={`h-3 w-3 md:h-4 md:w-4 lg:h-6 lg:w-6 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pb-1 md:pb-2 lg:pb-3">
                {stat.loading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <div className="text-xl md:text-2xl lg:text-4xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-3 md:gap-4 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* System Status Card */}
        <Card className="md:col-span-1 lg:col-span-1 hover-elevate shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 pb-3 md:pb-4 lg:pb-5 rounded-t-md">
            <CardTitle className="text-base md:text-lg lg:text-xl font-bold text-white">System Status</CardTitle>
            <CardDescription className="text-xs md:text-sm lg:text-base text-green-50">Quick overview of key metrics</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 md:pt-4 lg:pt-8">
            <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-5">
              <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/30 text-center">
                <span className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Pending Requests</span>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 dark:text-red-400">{pendingRequests}</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 text-center">
                <span className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Faculty Members</span>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400">{professors?.length || 0}</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30 text-center">
                <span className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Course Catalog</span>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-600 dark:text-emerald-400">{subjects?.length || 0}</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/30 text-center">
                <span className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Available Rooms</span>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400">{rooms?.length || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="md:col-span-1 lg:col-span-2 hover-elevate shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 pb-3 md:pb-4 lg:pb-5 rounded-t-md">
            <CardTitle className="text-base md:text-lg lg:text-xl font-bold text-white">Quick Actions</CardTitle>
            <CardDescription className="text-xs md:text-sm lg:text-base text-green-50">Common management tasks</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 md:pt-4 lg:pt-8">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
              <button onClick={() => navigate("/admin/professors")} className="p-2 md:p-3 lg:p-5 rounded-lg bg-blue-100 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 hover-elevate active-elevate-2 cursor-pointer text-left transition-all" data-testid="button-quick-action-professors">
                <div className="flex items-start gap-2 md:gap-3 lg:gap-4">
                  <Users className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs md:text-sm lg:text-base">Professors</p>
                    <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-0.5 md:mt-1">Manage faculty</p>
                  </div>
                </div>
              </button>
              <button onClick={() => navigate("/admin/subjects")} className="p-2 md:p-3 lg:p-5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 hover-elevate active-elevate-2 cursor-pointer text-left transition-all" data-testid="button-quick-action-subjects">
                <div className="flex items-start gap-2 md:gap-3 lg:gap-4">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs md:text-sm lg:text-base">Subjects</p>
                    <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-0.5 md:mt-1">Maintain catalog</p>
                  </div>
                </div>
              </button>
              <button onClick={() => navigate("/admin/rooms")} className="p-2 md:p-3 lg:p-5 rounded-lg bg-purple-100 dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 hover-elevate active-elevate-2 cursor-pointer text-left transition-all" data-testid="button-quick-action-rooms">
                <div className="flex items-start gap-2 md:gap-3 lg:gap-4">
                  <DoorOpen className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs md:text-sm lg:text-base">Rooms</p>
                    <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-0.5 md:mt-1">Track rooms</p>
                  </div>
                </div>
              </button>
              <button onClick={() => navigate("/admin/sections")} className="p-2 md:p-3 lg:p-5 rounded-lg bg-pink-100 dark:bg-pink-900/60 border border-pink-300 dark:border-pink-700 hover-elevate active-elevate-2 cursor-pointer text-left transition-all" data-testid="button-quick-action-sections">
                <div className="flex items-start gap-2 md:gap-3 lg:gap-4">
                  <Users className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-pink-600 dark:text-pink-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs md:text-sm lg:text-base">Sections</p>
                    <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-0.5 md:mt-1">Manage sections</p>
                  </div>
                </div>
              </button>
              <button onClick={() => navigate("/admin/schedules")} className="p-2 md:p-3 lg:p-5 rounded-lg bg-orange-100 dark:bg-orange-900/60 border border-orange-300 dark:border-orange-700 hover-elevate active-elevate-2 cursor-pointer text-left transition-all" data-testid="button-quick-action-schedules">
                <div className="flex items-start gap-2 md:gap-3 lg:gap-4">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs md:text-sm lg:text-base">Schedules</p>
                    <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-0.5 md:mt-1">Manage</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <div className="grid gap-3 md:gap-4 lg:gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        <Card className="hover-elevate shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-cyan-600 to-blue-700 dark:from-cyan-700 dark:to-blue-800 pb-3 md:pb-4 lg:pb-5 rounded-t-md">
            <div className="flex items-center justify-between gap-2 md:gap-3">
              <div className="min-w-0">
                <CardTitle className="text-sm md:text-base lg:text-lg font-bold text-white">Assignments</CardTitle>
                <CardDescription className="text-[10px] md:text-xs lg:text-sm text-cyan-50">Active connections</CardDescription>
              </div>
              <Link2 className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="pt-3 md:pt-4 lg:pt-6">
            <p className="text-xl md:text-2xl lg:text-4xl font-bold text-cyan-600 dark:text-cyan-400">{schedules?.length || 0}</p>
            <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-1 md:mt-2 lg:mt-3">Scheduled classes</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-rose-600 to-red-700 dark:from-rose-700 dark:to-red-800 pb-3 md:pb-4 lg:pb-5 rounded-t-md">
            <div className="flex items-center justify-between gap-2 md:gap-3">
              <div className="min-w-0">
                <CardTitle className="text-sm md:text-base lg:text-lg font-bold text-white">Pending</CardTitle>
                <CardDescription className="text-[10px] md:text-xs lg:text-sm text-rose-50">Need attention</CardDescription>
              </div>
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="pt-3 md:pt-4 lg:pt-6">
            <p className="text-xl md:text-2xl lg:text-4xl font-bold text-rose-600 dark:text-rose-400">{pendingRequests}</p>
            <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-1 md:mt-2 lg:mt-3">Requests pending</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-amber-600 to-orange-700 dark:from-amber-700 dark:to-orange-800 pb-3 md:pb-4 lg:pb-5 rounded-t-md">
            <div className="flex items-center justify-between gap-2 md:gap-3">
              <div className="min-w-0">
                <CardTitle className="text-sm md:text-base lg:text-lg font-bold text-white">Utilization</CardTitle>
                <CardDescription className="text-[10px] md:text-xs lg:text-sm text-amber-50">System capacity</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="pt-3 md:pt-4 lg:pt-6">
            <p className="text-xl md:text-2xl lg:text-4xl font-bold text-amber-600 dark:text-amber-400">{Math.round((schedules?.length || 0) / Math.max(professors?.length || 1, 1))}</p>
            <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-1 md:mt-2 lg:mt-3">Classes per professor</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-3 md:gap-4 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Professor Workload Chart */}
        <Card className="md:col-span-1 lg:col-span-1 shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 pb-3 md:pb-4 lg:pb-5 rounded-t-md">
            <CardTitle className="text-base md:text-lg lg:text-xl font-bold text-white">Professor Workload</CardTitle>
            <CardDescription className="text-xs md:text-sm lg:text-base text-green-50">Classes assigned per professor</CardDescription>
          </CardHeader>
          <CardContent className="h-32 md:h-40 lg:h-64">
            {professorScheduleData.length > 0 ? (
              <ChartContainer config={professorChartConfig} className="h-full">
                <BarChart
                  accessibilityLayer
                  data={professorScheduleData}
                  layout="vertical"
                  margin={{
                    left: 80,
                  }}
                >
                  <XAxis type="number" dataKey="schedules" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + "..." : value}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="schedules" fill="var(--color-professor)" radius={5} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="text-muted-foreground">
              Total professors: {professorScheduleData.length}
            </div>
          </CardFooter>
        </Card>

        {/* Room Utilization Chart */}
        <Card className="shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 pb-4 lg:pb-5 rounded-t-md">
            <CardTitle className="text-lg lg:text-xl font-bold text-white">Room Utilization</CardTitle>
            <CardDescription className="text-sm lg:text-base text-green-50">Usage distribution by room</CardDescription>
          </CardHeader>
          <CardContent className="h-32 md:h-48 lg:h-64">
            {roomUtilizationData.length > 0 ? (
              <ChartContainer config={roomChartConfig} className="h-full">
                <BarChart
                  accessibilityLayer
                  data={roomUtilizationData}
                  layout="vertical"
                  margin={{
                    left: 60,
                  }}
                >
                  <XAxis type="number" dataKey="usage" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + "..." : value}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="usage" fill="var(--color-room)" radius={5} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="text-muted-foreground">
              Rooms in use: {roomUtilizationData.length}
            </div>
          </CardFooter>
        </Card>

        {/* Class Type Distribution */}
        <Card className="shadow-md lg:shadow-lg overflow-hidden transition-all">
          <CardHeader className="bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 pb-4 lg:pb-5 rounded-t-md">
            <CardTitle className="text-lg lg:text-xl font-bold text-white">Class Type Distribution</CardTitle>
            <CardDescription className="text-sm lg:text-base text-green-50">Face-to-face vs online classes</CardDescription>
          </CardHeader>
          <CardContent className="h-32 md:h-48 lg:h-64">
            {classTypeData.some(d => d.count > 0) ? (
              <ChartContainer config={classTypeChartConfig} className="h-full">
                <BarChart
                  accessibilityLayer
                  data={classTypeData}
                  layout="vertical"
                  margin={{
                    left: 100,
                  }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="count" fill="var(--color-face-to-face)" radius={5} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="text-muted-foreground">
              Total schedules: {classTypeData.reduce((sum, d) => sum + d.count, 0)}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
