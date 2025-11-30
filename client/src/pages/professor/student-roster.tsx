import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function StudentRoster() {
  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Student Roster & Attendance</h1>
        <p className="text-muted-foreground">Track student attendance, grades, and manage class rosters</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-purple-900 dark:text-purple-100">Coming Soon</CardTitle>
              <CardDescription className="text-purple-800 dark:text-purple-200 mt-2">
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
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span>View complete student roster for each class</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span>Track student attendance records</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span>Record and manage student grades</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span>Generate attendance reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span>Export student data and records</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
