import { 
  Calendar,
  Users,
  BookOpen,
  DoorOpen,
  LayoutDashboard,
  FileText,
  ClipboardList,
  LogOut,
  Bell,
  Settings,
  Activity
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  role: "admin" | "professor";
}

export function AppSidebar({ role }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const { userProfile, signOut } = useAuth();

  const adminItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Professors", url: "/admin/professors", icon: Users },
    { title: "Departments", url: "/admin/departments", icon: Users },
    { title: "Subjects", url: "/admin/subjects", icon: BookOpen },
    { title: "Rooms", url: "/admin/rooms", icon: DoorOpen },
    { title: "Schedules", url: "/admin/schedules", icon: Calendar },
    { title: "Adjustment Requests", url: "/admin/requests", icon: ClipboardList },
    { title: "Reports", url: "/admin/reports", icon: FileText },
    { title: "Audit Trail", url: "/admin/audit", icon: Activity },
  ];

  const professorItems = [
    { title: "Dashboard", url: "/professor", icon: LayoutDashboard },
    { title: "My Schedule", url: "/professor/schedule", icon: Calendar },
    { title: "Adjustment Requests", url: "/professor/requests", icon: ClipboardList },
  ];

  const items = role === "admin" ? adminItems : professorItems;

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold px-4 py-4">
            E-Sched Connect
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userProfile?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}