import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Copy, Check } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { signIn, userProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for stored credentials on mount
  useEffect(() => {
    // Check sessionStorage first (from recent professor creation)
    let stored = sessionStorage.getItem("tempProfessorCreds");
    
    // Fall back to localStorage
    if (!stored) {
      stored = localStorage.getItem("tempProfessorCredentials");
    }
    
    if (stored) {
      try {
        const creds = JSON.parse(stored);
        setPendingCredentials(creds);
        setShowCredentialsModal(true);
      } catch (e) {
        console.error("Failed to parse stored credentials");
      }
    }
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDismissCredentials = () => {
    localStorage.removeItem("tempProfessorCredentials");
    sessionStorage.removeItem("tempProfessorCreds");
    setPendingCredentials(null);
    setShowCredentialsModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profile = await signIn(email, password);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      const role = profile?.role || "professor";
      setLocation(role === "admin" ? "/admin" : "/professor");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
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
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Elegant class scheduling for modern universities</p>
          </div>
        </div>

        {/* Login Card: Premium Minimal */}
        <Card className="card-minimal border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-7 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="text-lg font-semibold">Sign in to your account</CardTitle>
          </CardHeader>

          <CardContent className="pt-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" data-testid="alert-error" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}

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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  className="input-premium"
                />
              </div>

              {/* Button: Refined, Premium */}
              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white transition-colors duration-150"
                disabled={loading}
                data-testid="button-login"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : "Sign In"}
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

              {/* Register Link */}
              <div className="text-center text-xs">
                <p className="text-gray-600 dark:text-gray-400">
                  New user?{" "}
                  <button
                    type="button"
                    onClick={() => setLocation("/register")}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors duration-150"
                    data-testid="link-register"
                  >
                    Create account
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

      {/* New Professor Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent data-testid="dialog-new-professor-credentials">
          <DialogHeader>
            <DialogTitle>New Professor Account Created</DialogTitle>
            <DialogDescription>
              Share these login credentials with the new professor
            </DialogDescription>
          </DialogHeader>

          {pendingCredentials && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  The professor account has been created. Share these credentials with them so they can log in for the first time.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prof-email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="prof-email"
                    type="text"
                    value={pendingCredentials.email}
                    readOnly
                    data-testid="input-prof-email"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(pendingCredentials.email, "email")}
                  >
                    {copiedField === "email" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prof-password">Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="prof-password"
                    type="text"
                    value={pendingCredentials.password}
                    readOnly
                    data-testid="input-prof-password"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(pendingCredentials.password, "password")}
                  >
                    {copiedField === "password" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p className="font-semibold">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Professor must use these credentials for their first login</li>
                  <li>They should change their password immediately after login</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleDismissCredentials} data-testid="button-dismiss-credentials">
              Got It - I've Saved These Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
