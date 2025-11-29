import { useAuth } from "@/lib/auth-context";
import { useLocation, Redirect } from "wouter";
import type { UserRole } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();
  const [location] = useLocation();

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

  if (!currentUser || !userProfile) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Redirect to={userProfile.role === "admin" ? "/admin" : "/professor"} />;
  }

  return <>{children}</>;
}
