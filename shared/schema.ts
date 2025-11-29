import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Enums for role and status
export type UserRole = "admin" | "professor";
export type RequestStatus = "pending" | "approved" | "denied";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

// Department Schema
export const departmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  yearLevel: z.string().optional(), // Selected year level for filtering subjects
  subjectIds: z.array(z.string()).default([]), // Array of subject IDs offered by this department (across all year levels)
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertDepartmentSchema = departmentSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Department = z.infer<typeof departmentSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

// User Schema (Firebase Auth users with custom claims)
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(["admin", "professor"]),
  avatarUrl: z.string().optional(), // Profile image URL
  createdAt: z.number(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Professor Schema
export const professorSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  departmentId: z.string().min(1, "Department is required"), // Reference to department ID
  userId: z.string().optional(), // Link to Firebase Auth user
  subjectIds: z.array(z.string()).default([]), // Array of subject IDs assigned to this professor
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertProfessorSchema = professorSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Professor = z.infer<typeof professorSchema>;
export type InsertProfessor = z.infer<typeof insertProfessorSchema>;

// Subject Schema
export const subjectSchema = z.object({
  id: z.string(),
  code: z.string().min(1, "Subject code is required"),
  name: z.string().min(1, "Subject name is required"),
  description: z.string().optional(),
  units: z.number().min(1).max(6),
  yearLevel: z.string().optional(), // e.g., "1st Year", "2nd Year", "3rd Year", "4th Year" - subject can be taught to specific year level
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertSubjectSchema = subjectSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Subject = z.infer<typeof subjectSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

// Room Schema
export const roomSchema = z.object({
  id: z.string(),
  code: z.string().min(1, "Room code is required"),
  name: z.string().min(1, "Room name is required"),
  building: z.string().min(1, "Building is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  type: z.string().optional(), // e.g., "Laboratory", "Lecture Hall"
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertRoomSchema = roomSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Room = z.infer<typeof roomSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

// Section Schema
export const sectionSchema = z.object({
  id: z.string(),
  code: z.string().min(1, "Section code is required"),
  name: z.string().min(1, "Section name is required"),
  yearLevel: z.string().optional(), // e.g., "1st Year", "2nd Year", "3rd Year", "4th Year"
  capacity: z.number().min(1, "Capacity must be at least 1").optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertSectionSchema = sectionSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Section = z.infer<typeof sectionSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;

// Schedule Schema
export const scheduleSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  professorId: z.string(),
  roomId: z.string().optional(), // Optional for online classes
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  startTime: z.string(), // HH:mm format
  endTime: z.string(), // HH:mm format
  semester: z.string(), // e.g., "First Sem", "Second Sem"
  academicYear: z.string(), // e.g., "2024-2025"
  section: z.string().optional(), // Course and Section combined, e.g., "CS101-A"
  yearLevel: z.string().optional(), // e.g., "1st Year", "2nd Year", "3rd Year" - allows same professor to teach same subject to different levels
  classType: z.enum(["face-to-face", "online"]).default("face-to-face"), // Class delivery mode
  weekStartDate: z.number(), // Timestamp of Monday of the week this schedule starts
  notes: z.string().optional(), // Professor notes for this schedule
  isPinned: z.boolean().default(false), // Whether the schedule is pinned by the professor
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string(), // User ID who created
});

export const insertScheduleSchema = scheduleSchema.omit({ id: true, createdAt: true, updatedAt: true }).refine((data) => {
  // Room is required for face-to-face classes
  if (data.classType === "face-to-face" && !data.roomId) {
    return false;
  }
  return true;
}, {
  message: "Room is required for face-to-face classes",
  path: ["roomId"],
});

export type Schedule = z.infer<typeof scheduleSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

// Extended Schedule with populated data
export const scheduleWithDetailsSchema = scheduleSchema.extend({
  subject: subjectSchema.optional(),
  professor: professorSchema.optional(),
  room: roomSchema.optional(),
});
export type ScheduleWithDetails = z.infer<typeof scheduleWithDetailsSchema>;

// Adjustment Request Schema
export const adjustmentRequestSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  professorId: z.string(),
  requestedChanges: z.object({
    dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    roomId: z.string().optional(),
    classType: z.enum(["face-to-face", "online"]).optional(),
  }),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
  status: z.enum(["pending", "approved", "denied"]),
  reviewedBy: z.string().optional(),
  reviewedAt: z.number().optional(),
  reviewNotes: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertAdjustmentRequestSchema = adjustmentRequestSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewedAt: true,
}).extend({
  status: z.enum(["pending", "approved", "denied"]).default("pending"),
});

export type AdjustmentRequest = z.infer<typeof adjustmentRequestSchema>;
export type InsertAdjustmentRequest = z.infer<typeof insertAdjustmentRequestSchema>;

// Extended Adjustment Request with populated data
export const adjustmentRequestWithDetailsSchema = adjustmentRequestSchema.extend({
  schedule: scheduleWithDetailsSchema.optional(),
  professor: professorSchema.optional(),
});
export type AdjustmentRequestWithDetails = z.infer<typeof adjustmentRequestWithDetailsSchema>;

// Audit Log Schema
export const auditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  action: z.string(), // e.g., "create", "update", "delete"
  resourceType: z.string(), // e.g., "professor", "schedule", "subject"
  resourceId: z.string(),
  changes: z.record(z.any()).optional(), // JSON object of what changed
  timestamp: z.number(),
});

export const insertAuditLogSchema = auditLogSchema.omit({ id: true });
export type AuditLog = z.infer<typeof auditLogSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Notification Schema
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "success", "warning", "error"]),
  read: z.boolean(),
  relatedResourceType: z.string().optional(),
  relatedResourceId: z.string().optional(),
  createdAt: z.number(),
});

export const insertNotificationSchema = notificationSchema.omit({ id: true, createdAt: true, read: true });
export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Conflict Detection Result
export const scheduleConflictSchema = z.object({
  type: z.enum(["time_overlap", "professor_double_booked", "room_double_booked"]),
  message: z.string(),
  conflictingSchedule: scheduleWithDetailsSchema.optional(),
});
export type ScheduleConflict = z.infer<typeof scheduleConflictSchema>;

// Report Types
export const workloadReportItemSchema = z.object({
  professorId: z.string(),
  professorName: z.string(),
  totalHours: z.number(),
  totalSubjects: z.number(),
  schedules: z.array(scheduleWithDetailsSchema),
});
export type WorkloadReportItem = z.infer<typeof workloadReportItemSchema>;

export const roomUtilizationReportItemSchema = z.object({
  roomId: z.string(),
  roomName: z.string(),
  totalHours: z.number(),
  utilizationPercentage: z.number(),
  schedules: z.array(scheduleWithDetailsSchema),
});
export type RoomUtilizationReportItem = z.infer<typeof roomUtilizationReportItemSchema>;
