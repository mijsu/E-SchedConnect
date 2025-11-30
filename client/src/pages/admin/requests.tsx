import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, AlertCircle, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { AdjustmentRequest, Schedule, Professor } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function AdminRequests() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [reviewingRequest, setReviewingRequest] = useState<AdjustmentRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "denied">("approved");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/adjustment-requests"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "adjustmentRequests"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdjustmentRequest[];
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "schedules"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
    },
  });

  const { data: professors } = useQuery({
    queryKey: ["/api/professors"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "professors"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Professor[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "approved" | "denied"; notes: string }) => {
      await updateDoc(doc(db, "adjustmentRequests", id), {
        status,
        reviewedBy: userProfile?.id,
        reviewedAt: Date.now(),
        reviewNotes: notes,
        updatedAt: Date.now(),
      });

      // If approved, update the schedule
      if (status === "approved") {
        const request = requests?.find(r => r.id === id);
        if (request && request.scheduleId) {
          const updates: any = {};
          if (request.requestedChanges.dayOfWeek) {
            updates.dayOfWeek = request.requestedChanges.dayOfWeek;
          }
          if (request.requestedChanges.startTime) {
            updates.startTime = request.requestedChanges.startTime;
          }
          if (request.requestedChanges.endTime) {
            updates.endTime = request.requestedChanges.endTime;
          }
          if (request.requestedChanges.roomId) {
            updates.roomId = request.requestedChanges.roomId;
          }
          
          if (Object.keys(updates).length > 0) {
            updates.updatedAt = Date.now();
            await updateDoc(doc(db, "schedules", request.scheduleId), updates);
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/adjustment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ 
        title: "Success", 
        description: `Request ${variables.status === "approved" ? "approved" : "denied"} successfully`
      });
      setReviewingRequest(null);
      setReviewNotes("");
    },
  });

  const handleReview = (request: AdjustmentRequest, action: "approved" | "denied") => {
    setReviewingRequest(request);
    setReviewAction(action);
    setReviewNotes("");
  };

  const submitReview = () => {
    if (reviewingRequest) {
      reviewMutation.mutate({
        id: reviewingRequest.id,
        status: reviewAction,
        notes: reviewNotes,
      });
    }
  };

  const getScheduleDetails = (scheduleId: string) => {
    return schedules?.find(s => s.id === scheduleId);
  };

  const getProfessorDetails = (professorId: string) => {
    return professors?.find(p => p.id === professorId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "denied":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"><X className="h-3 w-3 mr-1" />Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const reviewedRequests = requests?.filter(r => r.status !== "pending") || [];

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-in">
      {/* Refined Header with Premium Spacing */}
      <div className="space-y-5 pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">MANAGEMENT</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" data-testid="text-page-title">
            Adjustment Requests
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">Review and approve schedule change requests from professors</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <>
          {pendingRequests.length > 0 && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Pending Requests</AlertTitle>
              <AlertDescription>
                You have {pendingRequests.length} schedule adjustment request(s) awaiting review.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">Pending Requests ({pendingRequests.length})</h2>
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending requests
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => {
                const schedule = getScheduleDetails(request.scheduleId);
                const professor = getProfessorDetails(request.professorId);
                
                return (
                  <Card key={request.id} data-testid={`card-request-${request.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle>
                            Request from {professor?.firstName} {professor?.lastName}
                          </CardTitle>
                          <CardDescription>
                            Submitted {new Date(request.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Current Schedule</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <p>Day: <span className="capitalize">{schedule?.dayOfWeek}</span></p>
                            <p>Time: {schedule?.startTime} - {schedule?.endTime}</p>
                            <p>Room: {schedule?.roomId}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Requested Changes</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            {request.requestedChanges.dayOfWeek && (
                              <p>Day: <span className="capitalize">{request.requestedChanges.dayOfWeek}</span></p>
                            )}
                            {request.requestedChanges.startTime && (
                              <p>Start Time: {request.requestedChanges.startTime}</p>
                            )}
                            {request.requestedChanges.endTime && (
                              <p>End Time: {request.requestedChanges.endTime}</p>
                            )}
                            {request.requestedChanges.roomId && (
                              <p>Room: {request.requestedChanges.roomId}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Reason</h4>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => handleReview(request, "denied")}
                          data-testid={`button-deny-${request.id}`}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Deny
                        </Button>
                        <Button
                          onClick={() => handleReview(request, "approved")}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="space-y-4">
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">Reviewed Requests ({reviewedRequests.length})</h2>
            {reviewedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No reviewed requests
                </CardContent>
              </Card>
            ) : (
              reviewedRequests.map((request) => {
                const professor = getProfessorDetails(request.professorId);
                
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            Request from {professor?.firstName} {professor?.lastName}
                          </CardTitle>
                          <CardDescription>
                            Reviewed {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : "N/A"}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Reason</h4>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                      {request.reviewNotes && (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">Review Notes</h4>
                          <p className="text-sm text-muted-foreground">{request.reviewNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      <Dialog open={!!reviewingRequest} onOpenChange={() => setReviewingRequest(null)}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" ? "Approve" : "Deny"} Request
            </DialogTitle>
            <DialogDescription>
              Add optional notes for this decision
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Review Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                data-testid="input-review-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingRequest(null)}>
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
