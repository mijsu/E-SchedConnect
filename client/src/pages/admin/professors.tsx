import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, getDoc } from "firebase/firestore";
import { db, auth, secondaryAuth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, Copy, Check, Mail, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertProfessorSchema, type Professor, type InsertProfessor, type Subject, type Department } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

interface CredentialModal {
  email: string;
  password: string;
}

// Generate temporary password
const generateTempPassword = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function Professors() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<CredentialModal | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [deletingProfessor, setDeletingProfessor] = useState<Professor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: professors, isLoading } = useQuery({
    queryKey: ["/api/professors"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "professors"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Professor[];
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "subjects"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "departments"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Department[];
    },
  });

  const form = useForm<InsertProfessor>({
    resolver: zodResolver(insertProfessorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      departmentId: "",
      userId: "",
      subjectIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProfessor) => {
      // Verify admin is logged in
      if (!auth.currentUser) {
        throw new Error("Admin must be logged in to create professor");
      }
      
      // Generate temporary password
      const tempPassword = generateTempPassword();
      
      // Create Firebase Auth user using SECONDARY auth instance
      // This prevents logging out the admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, tempPassword);
      const uid = userCredential.user.uid;
      
      // Sign out from secondary auth immediately
      await secondaryAuth.signOut();
      
      // Create user profile in users collection for authentication
      const userProfile = {
        id: uid,
        email: data.email,
        displayName: `${data.firstName} ${data.lastName}`,
        role: "professor" as const,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "users", uid), userProfile);
      
      // Create professor document with the user ID
      const professorRef = await addDoc(collection(db, "professors"), {
        ...data,
        userId: uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Verify both were created
      if (!professorRef.id || !userProfile.id) {
        throw new Error("Failed to create professor and user profile");
      }
      
      // Return password for display
      return { email: data.email, password: tempPassword };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/professors"] });
      
      // Show credentials modal immediately
      setCredentials({
        email: result.email,
        password: result.password,
      });
      setIsCredentialDialogOpen(true);
      setIsDialogOpen(false);
      form.reset();
      
      toast({ 
        title: "Success", 
        description: "Professor account created. Please share the credentials with them." 
      });
    },
    onError: (error: any) => {
      if (error.code === "auth/email-already-in-use") {
        toast({ title: "Error", description: "Email already in use. Please use a different email address.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to create professor", variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertProfessor }) => {
      await updateDoc(doc(db, "professors", id), {
        ...data,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professors"] });
      toast({ title: "Success", description: "Professor updated successfully" });
      setIsDialogOpen(false);
      setEditingProfessor(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update professor", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get professor data to find userId
      const professorDoc = await getDoc(doc(db, "professors", id));
      const professorData = professorDoc.data() as Professor;
      
      // First, delete all schedules associated with this professor
      const schedulesQuery = query(collection(db, "schedules"), where("professorId", "==", id));
      const schedulesSnapshot = await getDocs(schedulesQuery);
      
      for (const scheduleDoc of schedulesSnapshot.docs) {
        await deleteDoc(doc(db, "schedules", scheduleDoc.id));
      }
      
      // Delete the professor document
      await deleteDoc(doc(db, "professors", id));
      
      // Delete the user profile from users collection if userId exists
      if (professorData?.userId) {
        await deleteDoc(doc(db, "users", professorData.userId));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Success", description: "Professor and associated schedules deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingProfessor(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete professor", variant: "destructive" });
    },
  });

  const handleOpenDialog = (professor?: Professor) => {
    if (professor) {
      setEditingProfessor(professor);
      form.reset({
        firstName: professor.firstName,
        lastName: professor.lastName,
        email: professor.email,
        departmentId: professor.departmentId,
        userId: professor.userId || "",
        subjectIds: professor.subjectIds || [],
      });
    } else {
      setEditingProfessor(null);
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        departmentId: "",
        userId: "",
        subjectIds: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertProfessor) => {
    if (editingProfessor) {
      updateMutation.mutate({ id: editingProfessor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (professor: Professor) => {
    setDeletingProfessor(professor);
    setIsDeleteDialogOpen(true);
  };

  const filteredProfessors = professors?.filter(p => {
    const dept = departments?.find(d => d.id === p.departmentId);
    return `${p.firstName} ${p.lastName} ${p.email} ${dept?.name || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDoneWithCredentials = () => {
    setIsCredentialDialogOpen(false);
    setCredentials(null);
    setCopiedField(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl" data-testid="text-page-title">Professors</h1>
          <p className="text-muted-foreground">Manage faculty members and their information</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-professor">
          <Plus className="h-4 w-4 mr-2" />
          Add Professor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>All Professors</CardTitle>
              <CardDescription>A list of all faculty members in the system</CardDescription>
            </div>
            <InputGroup className="w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search professors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </InputGroup>
          </div>
        </CardHeader>
        
        <div className="flex gap-2 px-6 py-3 border-b flex-wrap">
          {filteredProfessors && filteredProfessors.some(p => p.subjectIds && p.subjectIds.length > 0) && (
            <div className="text-xs text-muted-foreground">
              Tip: Click on a professor row to see assigned subjects
            </div>
          )}
        </div>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredProfessors && filteredProfessors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Subjects Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessors.map((professor) => {
                  const assignedSubjects = professor.subjectIds?.map(subjectId => 
                    subjects?.find(s => s.id === subjectId)
                  ).filter(Boolean) || [];
                  const assignedDepartment = departments?.find(d => d.id === professor.departmentId);
                  
                  return (
                    <TableRow key={professor.id} data-testid={`row-professor-${professor.id}`}>
                      <TableCell className="font-medium">
                        <HoverCard>
                          <HoverCardTrigger className="underline decoration-dotted cursor-help hover:decoration-solid">
                            {professor.firstName} {professor.lastName}
                          </HoverCardTrigger>
                          <HoverCardContent className="w-72">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${professor.email}`} className="text-sm text-primary hover:underline">
                                  {professor.email}
                                </a>
                              </div>
                              {assignedDepartment && (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{assignedDepartment.name} ({assignedDepartment.code})</span>
                                </div>
                              )}
                              {assignedSubjects.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Teaches</p>
                                  <div className="flex flex-wrap gap-1">
                                    {assignedSubjects.map(subject => (
                                      <span key={subject?.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                        {subject?.code}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>{professor.email}</TableCell>
                      <TableCell>{assignedDepartment?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {assignedSubjects.length > 0 ? (
                            assignedSubjects.map((subject) => (
                              <HoverCard key={subject?.id}>
                                <HoverCardTrigger asChild>
                                  <span 
                                    className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground cursor-help hover:bg-secondary/80"
                                    data-testid={`badge-subject-${subject?.id}`}
                                  >
                                    {subject?.code}
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-64">
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="font-semibold text-sm">{subject?.code}</h4>
                                      <p className="text-sm text-muted-foreground">{subject?.name}</p>
                                    </div>
                                    {subject?.description && (
                                      <p className="text-xs text-muted-foreground">{subject.description}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">{subject?.units} units</span>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">None assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(professor)}
                            data-testid={`button-edit-${professor.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(professor)}
                            data-testid={`button-delete-${professor.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>No professors yet</EmptyTitle>
                <EmptyDescription>
                  Get started by adding your first faculty member
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Professor
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-professor-form">
          <DialogHeader>
            <DialogTitle>{editingProfessor ? "Edit Professor" : "Add New Professor"}</DialogTitle>
            <DialogDescription>
              {editingProfessor ? "Update professor information" : "Add a new faculty member to the system"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} data-testid="input-firstName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} data-testid="input-lastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@university.edu" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments && departments.length > 0 ? (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id} data-testid={`option-dept-${dept.id}`}>
                              {dept.name}
                            </SelectItem>
                          ))
                        ) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjectIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Subjects</FormLabel>
                    <FormControl>
                      <div className="border rounded-md p-3 max-h-48">
                        <ScrollArea className="h-40">
                          <div className="space-y-2 pr-4">
                            {subjects && subjects.length > 0 ? (
                              [...subjects].sort((a, b) => a.code.localeCompare(b.code)).map((subject) => (
                                <div key={subject.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`subject-${subject.id}`}
                                    checked={field.value.includes(subject.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, subject.id]);
                                      } else {
                                        field.onChange(field.value.filter((id) => id !== subject.id));
                                      }
                                    }}
                                    data-testid={`checkbox-subject-${subject.id}`}
                                  />
                                  <label
                                    htmlFor={`subject-${subject.id}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {subject.code} - {subject.name}
                                  </label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No subjects available</p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deletingProfessor?.firstName} {deletingProfessor?.lastName} from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProfessor && deleteMutation.mutate(deletingProfessor.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCredentialDialogOpen} onOpenChange={setIsCredentialDialogOpen}>
        <DialogContent data-testid="dialog-credentials" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Professor Account Created Successfully</DialogTitle>
            <DialogDescription>
              Share these login credentials with the professor
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-primary/10 border-primary/20">
            <AlertDescription className="text-sm">
              <strong>Important:</strong> The professor must use these credentials for their first login and should change their password immediately after.
            </AlertDescription>
          </Alert>

          {credentials && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="text"
                    value={credentials.email}
                    readOnly
                    data-testid="input-cred-email"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.email, "email")}
                    data-testid="button-copy-email"
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
                <Label htmlFor="password">Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={credentials.password}
                    readOnly
                    data-testid="input-cred-password"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.password, "password")}
                    data-testid="button-copy-password"
                  >
                    {copiedField === "password" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                <p className="font-semibold">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Copy the email and password using the copy buttons</li>
                  <li>Send them to the professor via email or secure message</li>
                  <li>Professor logs in with these credentials</li>
                  <li>Professor should change their password after first login</li>
                </ol>
              </div>

              <DialogFooter>
                <Button onClick={handleDoneWithCredentials} data-testid="button-done-credentials" className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
