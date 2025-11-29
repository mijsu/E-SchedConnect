import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Register() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"professor" | "admin">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!displayName || !email || !password || !role) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName, role as "professor" | "admin");
      
      toast({
        title: "Account created",
        description: "Your account has been successfully created!",
      });
      
      setLocation(role === "admin" ? "/admin" : "/professor");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent dark:bg-gray-950 p-4">
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Hero Section: Refined, Elegant, Premium */}
        <div className="mb-16 space-y-8 text-center">
          {/* Icon: Minimal, Sophisticated */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-lg bg-green-500 flex items-center justify-center shadow">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
          
          {/* Typography: Refined Hierarchy */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">E-Sched Connect</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Create your account to get started</p>
          </div>
        </div>

        {/* Register Card: Premium Minimal */}
        <Card className="card-minimal border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-7 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="text-lg font-semibold">Create your account</CardTitle>
          </CardHeader>

          <CardContent className="pt-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" data-testid="alert-error" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  data-testid="input-name"
                  className="input-premium"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                  className="input-premium"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  className="input-premium"
                />
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <Label htmlFor="role">Account type</Label>
                <Select value={role} onValueChange={(value) => setRole(value as "professor" | "admin")}>
                  <SelectTrigger data-testid="select-role" className="input-premium">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Button: Refined, Premium */}
              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white transition-colors duration-150"
                disabled={loading}
                data-testid="button-register"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </div>
                ) : "Create Account"}
              </Button>

              {/* Divider */}
              <div className="relative py-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-500 text-xs">or</span>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center text-xs">
                <p className="text-gray-600 dark:text-gray-400">
                  Have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setLocation("/login")}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors duration-150"
                    data-testid="link-login"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer: Minimal, elegant */}
        <div className="mt-10 text-center text-xs text-gray-500 dark:text-gray-500">
          <p>Secure authentication with Firebase</p>
        </div>
      </div>
    </div>
  );
}
