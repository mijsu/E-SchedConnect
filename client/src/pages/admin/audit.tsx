import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, BookOpen, DoorOpen, Calendar, Settings, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuditLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditTrail() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/audit-logs"],
    queryFn: async () => {
      const q = query(
        collection(db, "auditLogs"),
        orderBy("timestamp", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
    },
  });

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Create</Badge>;
      case "update":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Update</Badge>;
      case "delete":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Delete</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "professor":
        return <Users className="h-4 w-4" />;
      case "subject":
        return <BookOpen className="h-4 w-4" />;
      case "room":
        return <DoorOpen className="h-4 w-4" />;
      case "schedule":
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-in">
      {/* Refined Header with Premium Spacing */}
      <div className="space-y-5 pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">SECURITY</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" data-testid="text-page-title">
            Audit Trail
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">System activity log for compliance and security audits</p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>System Activity Log</AlertTitle>
        <AlertDescription>
          All CRUD operations (Create, Read, Update, Delete) are logged for compliance and audit purposes. Displaying last 100 entries.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>Comprehensive record of all CRUD operations (last 100 entries)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.userEmail}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resourceType)}
                          <span className="capitalize">{log.resourceType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.resourceId.substring(0, 8)}...</TableCell>
                      <TableCell className="max-w-xs">
                        {log.changes ? (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-primary hover:underline">
                              View Changes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto max-h-32">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted-foreground">No details</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
