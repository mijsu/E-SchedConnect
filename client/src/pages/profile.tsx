import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, LogOut, ChevronLeft, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@shared/schema";

interface NavigationHint {
  _hint?: string;
}

export default function Profile() {
  const { userProfile, signOut } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackClick = () => {
    // Navigate to appropriate dashboard based on role
    if (userProfile?.role === "professor") {
      navigate("/professor" as any);
    } else if (userProfile?.role === "admin") {
      navigate("/admin" as any);
    } else {
      navigate("/" as any);
    }
  };
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [email, setEmail] = useState(userProfile?.email || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || "");

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleSaveChanges = async () => {
    if (!userProfile?.id) return;

    try {
      setIsSaving(true);
      const userRef = doc(db, "users", userProfile.id);
      await updateDoc(userRef, {
        displayName,
        email,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.id) return;

    // Validate file size (500KB max for base64 storage)
    if (file.size > 500 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 500KB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;

        try {
          // Update user profile with base64 avatar
          const userRef = doc(db, "users", userProfile.id);
          await updateDoc(userRef, {
            avatarUrl: base64String,
          });

          setAvatarUrl(base64String);

          toast({
            title: "Success",
            description: "Profile image uploaded successfully",
          });
        } catch (error) {
          console.error("Error updating profile:", error);
          toast({
            title: "Error",
            description: "Failed to update profile image",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login" as any);
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="mb-6 hidden md:inline-flex"
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground text-lg mt-2">Manage your profile and account preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="hover-elevate mb-6">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardTitle className="text-lg">Profile Picture</CardTitle>
            <CardDescription>Upload and manage your profile image</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex items-center gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid="button-upload-image"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Change Photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
                data-testid="input-image-upload"
              />
              <p className="text-xs text-muted-foreground text-center">JPG, PNG or GIF. Max 500KB.</p>
            </div>

            {/* Role and Email Info */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Role</p>
                <Badge className="capitalize">{userProfile.role}</Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Account Created</p>
                <p className="font-medium">{new Date(userProfile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="hover-elevate mb-6">
          <CardHeader className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-profile"
                >
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    data-testid="input-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address used for your account
                  </p>
                </div>

                <Separator />

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(userProfile.displayName);
                      setEmail(userProfile.email);
                    }}
                    disabled={isSaving}
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving || !displayName.trim() || !email.trim()}
                    data-testid="button-save-changes"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Display Name</p>
                  <p className="font-medium text-lg">{displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Email Address</p>
                  <p className="font-medium text-lg">{email}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="bg-red-50 dark:bg-red-950">
            <CardTitle className="text-lg text-red-700 dark:text-red-400">Session Management</CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">
              Manage your login session
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign out of your account on this device
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogout}
                data-testid="button-sign-out"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
