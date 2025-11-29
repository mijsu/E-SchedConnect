import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertDepartmentSchema, type Department, type InsertDepartment, type Subject } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function Departments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateSubjectDialogOpen, setIsCreateSubjectDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("");
  const { toast } = useToast();

  // Form for creating new subjects
  const subjectForm = useForm({
    defaultValues: {
      code: "",
      name: "",
      units: "3",
      description: "",
      yearLevel: "",
    },
  });

  const { data: departments, isLoading } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "departments"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Department[];
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "subjects"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
    },
  });

  const form = useForm<InsertDepartment>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      code: "",
      subjectIds: [],
      yearLevel: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDepartment) => {
      await addDoc(collection(db, "departments"), {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Success", description: "Department created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create department", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertDepartment }) => {
      await updateDoc(doc(db, "departments", id), {
        ...data,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Success", description: "Department updated successfully" });
      setIsDialogOpen(false);
      setEditingDepartment(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update department", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "departments", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Success", description: "Department deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingDepartment(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete department", variant: "destructive" });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const subjectRef = await addDoc(collection(db, "subjects"), {
        code: data.code,
        name: data.name,
        units: parseInt(data.units),
        description: data.description || "",
        yearLevel: data.yearLevel || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return subjectRef.id;
    },
    onSuccess: async (newSubjectId) => {
      // Refetch subjects to get the newly created subject
      await queryClient.refetchQueries({ queryKey: ["/api/subjects"] });
      // Automatically add the new subject to the department
      const currentSubjects = form.getValues("subjectIds");
      const currentYearLevel = form.getValues("yearLevel");
      const updatedSubjects = [...currentSubjects, newSubjectId];
      form.setValue("subjectIds", updatedSubjects);
      
      // If editing an existing department, save the new subject to Firestore immediately
      if (editingDepartment) {
        await updateDoc(doc(db, "departments", editingDepartment.id), {
          subjectIds: updatedSubjects,
          updatedAt: Date.now(),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      }
      
      setIsCreateSubjectDialogOpen(false);
      subjectForm.reset({
        code: "",
        name: "",
        units: "3",
        description: "",
        yearLevel: currentYearLevel,
      });
      toast({ title: "Success", description: "Subject created and added to department" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create subject", variant: "destructive" });
    },
  });

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      form.reset({
        name: department.name,
        code: department.code,
        subjectIds: department.subjectIds || [],
        yearLevel: "", // Keep empty - user must select year level
      });
    } else {
      setEditingDepartment(null);
      form.reset({
        name: "",
        code: "",
        subjectIds: [],
        yearLevel: "",
      });
    }
    setSelectedYearLevel("");
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertDepartment) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (department: Department) => {
    setDeletingDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubject = (subjectId: string) => {
    const currentSubjects = form.getValues("subjectIds");
    if (!currentSubjects.includes(subjectId)) {
      form.setValue("subjectIds", [...currentSubjects, subjectId]);
    } else {
      toast({ title: "Info", description: "Subject already added to this department" });
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    const currentSubjects = form.getValues("subjectIds");
    form.setValue("subjectIds", currentSubjects.filter(id => id !== subjectId));
  };

  const handleCreateSubject = (data: any) => {
    createSubjectMutation.mutate({
      ...data,
      yearLevel: selectedYearLevelValue,
    });
  };

  const currentSubjectIds = form.watch("subjectIds");
  const selectedYearLevelValue = form.watch("yearLevel");
  const addedSubjects = currentSubjectIds
    .map(id => subjects?.find(s => s.id === id))
    .filter(Boolean) as Subject[];

  const filteredDepartments = departments?.filter(d =>
    `${d.name} ${d.code}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-in">
      {/* Refined Header with Premium Spacing */}
      <div className="space-y-5 pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">ORGANIZATION</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" data-testid="text-page-title">
            Departments
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">Manage academic departments and their subjects</p>
      </div>

      {/* Action Button */}
      <Button onClick={() => handleOpenDialog()} data-testid="button-add-department" className="w-full md:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-700 dark:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900 text-white shadow-lg hover:shadow-2xl transition-all duration-300 btn-premium">
        <Plus className="h-4 w-4 mr-2" />
        Add Department
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>All Departments</CardTitle>
              <CardDescription>A list of all departments in your institution</CardDescription>
            </div>
            <InputGroup className="w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </InputGroup>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments && filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department) => {
                    return (
                    <TableRow key={department.id} data-testid={`row-department-${department.id}`}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{department.code}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(department)}
                            data-testid={`button-edit-${department.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(department)}
                            data-testid={`button-delete-${department.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No departments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-department-form" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</DialogTitle>
            <DialogDescription>
              {editingDepartment ? "Update department information and subjects" : "Create a new academic department with subjects"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Department Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Computer Science" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Code</FormLabel>
                      <FormControl>
                        <Input placeholder="CS" {...field} data-testid="input-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Subjects Management */}
              <div className="space-y-3 border-t pt-4">
                <div>
                  <FormLabel>Subjects by Year Level</FormLabel>
                </div>

                {/* Year Level Selector */}
                <FormField
                  control={form.control}
                  name="yearLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Year Level</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedYearLevel(value);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-year-level">
                            <SelectValue placeholder="Select year level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {YEAR_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Display Subjects for Selected Year */}
                {selectedYearLevel && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Subjects for {selectedYearLevel}</p>
                      <Button
                        type="button"
                        onClick={() => setIsCreateSubjectDialogOpen(true)}
                        data-testid="button-create-subject"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Subject
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto border rounded-md p-3">
                      {addedSubjects.length > 0 ? (
                        addedSubjects
                          .filter(s => s.yearLevel === selectedYearLevel)
                          .map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center justify-between p-2 bg-secondary/50 rounded-md"
                              data-testid={`subject-option-${subject.id}`}
                            >
                              <div>
                                <p className="font-medium text-sm">{subject.code}</p>
                                <p className="text-xs text-muted-foreground">{subject.name}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSubject(subject.id)}
                                data-testid={`button-remove-subject-${subject.id}`}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No subjects for this year level</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Department"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateSubjectDialogOpen} onOpenChange={setIsCreateSubjectDialogOpen}>
        <DialogContent data-testid="dialog-create-subject">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Add a new subject to your institution's catalog. It will be automatically added to this department.
            </DialogDescription>
          </DialogHeader>
          <Form {...subjectForm}>
            <form onSubmit={subjectForm.handleSubmit(handleCreateSubject)} className="space-y-4">
              <FormField
                control={subjectForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Code</FormLabel>
                    <FormControl>
                      <Input placeholder="CS101" {...field} data-testid="input-subject-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Computer Science" {...field} data-testid="input-subject-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subjectForm.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Units/Credits</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="6" placeholder="3" {...field} data-testid="input-subject-units" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Subject description..." {...field} data-testid="input-subject-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateSubjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubjectMutation.isPending} data-testid="button-submit-subject">
                  {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
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
              This will permanently delete {deletingDepartment?.name} from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDepartment && deleteMutation.mutate(deletingDepartment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
