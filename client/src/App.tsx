import { Switch, Route, Redirect, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { ThemeProvider, useTheme } from "./lib/theme-context";
import { ProtectedRoute } from "./components/protected-route";
import { ThemeToggle } from "./components/theme-toggle";
import { ProfileDropdown } from "./components/profile-dropdown";
import { Menu, X, BarChart3, FileText, HelpCircle } from "lucide-react";
import logoImage from "@assets/eschedlogo.png";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/admin/dashboard";
import Professors from "@/pages/admin/professors";
import Departments from "@/pages/admin/departments";
import Subjects from "@/pages/admin/subjects";
import Rooms from "@/pages/admin/rooms";
import Sections from "@/pages/admin/sections";
import Schedules from "@/pages/admin/schedules";
import AdminRequests from "@/pages/admin/requests";
import Reports from "@/pages/admin/reports";
import AuditTrail from "@/pages/admin/audit";
import ProfessorDashboard from "@/pages/professor/dashboard";
import ProfessorSchedule from "@/pages/professor/schedule";
import ProfessorRequests from "@/pages/professor/requests";
import ScheduleList from "@/pages/professor/schedule-list";
import Profile from "@/pages/profile";
import { AppFooter } from "@/components/app-footer";

function RootRedirect() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Redirect to="/login" />;
  }

  return <Redirect to={userProfile.role === "admin" ? "/admin" : "/professor"} />;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, signOut } = useAuth();
  const [pathname, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Departments", href: "/admin/departments" },
    { label: "Adjustment Requests", href: "/admin/requests" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Audit Trail", href: "/admin/audit" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Top Navigation Bar */}
      <header className="topbar-gradient border-b border-success/30 sticky top-0 z-40">
        <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-0">
          {/* Left side - Logo/Title */}
          <button 
            onClick={() => navigate("/admin")}
            className="hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
            data-testid="button-logo-dashboard"
          >
            <img 
              src={logoImage} 
              alt="E-Sched Connect Logo" 
              className="h-12 sm:h-16 md:h-20 lg:h-28 w-auto -my-1 sm:-my-2 md:-my-3 lg:-my-4"
            />
          </button>

          {/* Center - Navigation */}
          <nav className="hidden md:flex gap-0.5 flex-1 justify-center mx-1 lg:mx-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 md:px-3 lg:px-5 py-2 rounded-md text-xs md:text-sm lg:text-base font-medium transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/80 hover:bg-hover/60 hover-elevate"
                }`}
                data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Profile + Theme + Menu */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 ml-auto flex-shrink-0">
            <div className="hidden lg:flex items-center gap-2 md:gap-3">
              <ProfileDropdown />
            </div>
            <ThemeToggle />
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white shadow-md min-h-9 min-w-9"
                data-testid="button-mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - For phones and tablets */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-success/30 bg-success/95 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-white/25 text-white font-semibold shadow-md"
                    : "text-white/90 hover:bg-white/15 active-elevate-2"
                }`}
                data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/20 pt-3 mt-3 space-y-2">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md text-sm font-medium transition-colors text-foreground hover:bg-accent hover-elevate"
                data-testid="link-mobile-profile"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors text-red-600 dark:text-red-400 hover:bg-accent hover-elevate"
                data-testid="button-mobile-logout"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 bg-transparent">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, signOut } = useAuth();
  const [pathname, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/professor", icon: "grid" },
    { label: "Schedule List", href: "/professor/schedule-list", icon: "list" },
    { label: "Requests", href: "/professor/requests", icon: "clipboard" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Top Navigation Bar */}
      <header className="topbar-gradient border-b border-success/30 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-0">
          {/* Left side - Logo/Title */}
          <button 
            onClick={() => navigate("/professor")}
            className="hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
            data-testid="button-logo-dashboard"
          >
            <img 
              src={logoImage} 
              alt="E-Sched Connect Logo" 
              className="h-16 sm:h-20 md:h-20 lg:h-28 w-auto -my-2 sm:-my-3 md:-my-3 lg:-my-4"
            />
          </button>

          {/* Center - Navigation */}
          <nav className="hidden md:flex gap-1 flex-1 justify-center mx-2 lg:mx-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 md:px-5 py-3 rounded-md text-sm md:text-base font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/80 hover:bg-hover/60 hover-elevate"
                }`}
                data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Profile + Theme + Menu */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4 lg:flex-shrink-0 ml-auto">
            <div className="hidden lg:flex items-center gap-3 md:gap-4">
              <ProfileDropdown />
            </div>
            <ThemeToggle />
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white shadow-md"
                data-testid="button-mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - For phones and tablets */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-success/30 bg-success/95 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-white/25 text-white font-semibold shadow-md"
                    : "text-white/90 hover:bg-white/15 active-elevate-2"
                }`}
                data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/20 pt-3 mt-3 space-y-2">
              <Link
                href="/professor/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md text-sm font-medium transition-colors text-foreground hover:bg-accent hover-elevate"
                data-testid="link-mobile-profile"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors text-red-600 dark:text-red-400 hover:bg-accent hover-elevate"
                data-testid="button-mobile-logout"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 bg-transparent">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function BackgroundUpdater() {
  const [pathname] = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const html = document.documentElement;
    
    // Determine which background to use based on route
    const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/professor');
    const backgroundImage = isDashboard ? '/ptcbg1.png' : '/ptcbg2.jpg';
    
    if (theme === 'light') {
      // Light mode - apply appropriate background image
      const bgImageValue = `linear-gradient(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08)), url('${backgroundImage}')`;
      html.style.backgroundImage = bgImageValue;
    } else {
      // Dark mode - no background image
      html.style.backgroundImage = 'none';
    }
  }, [pathname, theme]);

  return null;
}

function Router() {
  return (
    <>
      <BackgroundUpdater />
      <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Profile />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/professors">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Professors />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/departments">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Departments />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/subjects">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Subjects />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/rooms">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Rooms />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/sections">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Sections />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/schedules">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Schedules />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/requests">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <AdminRequests />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/reports">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <Reports />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/audit">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout>
            <AuditTrail />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      {/* Professor routes */}
      <Route path="/professor">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorLayout>
            <ProfessorDashboard />
          </ProfessorLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/professor/schedule">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorLayout>
            <ProfessorSchedule />
          </ProfessorLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/professor/schedule-list">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorLayout>
            <ScheduleList />
          </ProfessorLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/professor/requests">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorLayout>
            <ProfessorRequests />
          </ProfessorLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/professor/profile">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorLayout>
            <Profile />
          </ProfessorLayout>
        </ProtectedRoute>
      </Route>

      {/* Root redirect */}
      <Route path="/" component={RootRedirect} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  useEffect(() => {
    // Ensure body and root are transparent to show html background
    const body = document.body;
    const root = document.getElementById('root');
    
    body.style.backgroundColor = 'transparent';
    body.style.backgroundImage = 'none';
    
    if (root) {
      root.style.backgroundColor = 'transparent';
      root.style.backgroundImage = 'none';
    }

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const html = document.documentElement;
      if (isDark) {
        html.style.backgroundImage = 'none';
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;