import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function ClassResources() {
  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Class Resources</h1>
        <p className="text-muted-foreground">Organize and manage course materials and resources</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-green-900 dark:text-green-100">Coming Soon</CardTitle>
              <CardDescription className="text-green-800 dark:text-green-200 mt-2">
                This feature is currently under development and will be available soon.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-slate-950 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">What's Coming:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                <span>Upload and organize lecture notes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                <span>Share course materials with students</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                <span>Manage assignments and due dates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                <span>Organize resources by topics or weeks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                <span>Create and manage course announcements</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
