import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User, LogOut } from "lucide-react";

export function ProfileDropdown() {
  const { userProfile, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login" as any);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const profilePath = userProfile?.role === "admin" ? "/profile" : "/professor/profile";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 cursor-pointer hover-elevate"
            data-testid="button-profile-dropdown"
          >
            <span className="hidden sm:inline text-base font-semibold">
              {userProfile?.displayName}
            </span>
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} />
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(userProfile?.displayName || "?")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Profile Section */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold truncate">{userProfile?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
          </div>

          <DropdownMenuSeparator />

          {/* Profile Link */}
          <DropdownMenuItem onClick={() => navigate(profilePath as any)} data-testid="dropdown-item-profile">
            <User className="h-4 w-4 mr-2" />
            <span>Account Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            onClick={() => setIsLogoutDialogOpen(true)}
            className="text-red-600 dark:text-red-400 cursor-pointer"
            data-testid="dropdown-item-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel data-testid="button-cancel-logout">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-logout"
            >
              Sign Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
