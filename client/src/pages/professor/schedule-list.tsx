import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function ScheduleList() {
  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Schedule List View</h1>
        <p className="text-muted-foreground">Comprehensive view of all your classes in a table format</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-blue-900 dark:text-blue-100">Coming Soon</CardTitle>
              <CardDescription className="text-blue-800 dark:text-blue-200 mt-2">
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
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>Searchable and filterable list of all your classes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>View enrollment count for each class</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>See room location information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>Access student roster details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>Sort and organize classes by various criteria</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
