/**
 * Shared types — User, Job, Application, etc.
 */

export type UserRole = "seeker" | "employer";

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
  businessName?: string;
  location: string;
  skills: string[];
  languages: string[];
  experience: string;
  freeJobsRemaining: number;
  paidJobsRemaining?: number;
  subscriptionPlan?: "none" | "monthly_unlimited";
  subscriptionExpiresAt?: string | null;
  aiFreeTokensRemaining?: number;
  aiPaidTokensRemaining?: number;
  canUseAi?: boolean;
  preferredLanguage: "en" | "bn";
  preferredSalary: { min: number; max: number };
  aiExtracted?: {
    skills: string[];
    experience: string;
    category: string;
    score: number;
  };
  careerGoal?: string;
  workType?: "" | "office" | "remote" | "hybrid" | "field";
  hireScore?: number;
  trustScore?: number;
  profileScore?: number;
  copilotAudit?: {
    strengths: string[];
    weaknesses: string[];
    hiringProbability: number;
    salaryPotential: string;
    lastAuditAt: string | null;
  };
  photoVerified?: boolean;
  phoneVerified?: boolean;
  idVerified?: boolean;
  aiOptimized?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JobCategory =
  | "sales"
  | "delivery"
  | "retail"
  | "hospitality"
  | "office_work"
  | "driver"
  | "warehouse"
  | "restaurant"
  | "security"
  | "other";

export interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  salaryMin: number;
  salaryMax: number;
  jobType: "full_time" | "part_time" | "contract" | "internship";
  experience: string;
  education?: string;
  skills: string[];
  status: "active" | "closed" | "draft";
  createdAt: string;
  updatedAt: string;
  employer?: { name: string; businessName?: string };
}

export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  status: "pending" | "shortlisted" | "rejected" | "hired";
  message?: string;
  createdAt: string;
  updatedAt: string;
  job?: Job;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage?: { content: string; createdAt: string };
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export interface PaymentCatalogItem {
  id: string;
  name: string;
  description?: string;
  amountPaise: number;
  type: "job_credits" | "ai_credits" | "subscription";
  metadata?: { credits?: number; days?: number };
}

export interface Entitlements {
  canPost: boolean;
  canUseAi: boolean;
  jobCreditsRemaining: number;
  aiCreditsRemaining?: number;
  subscriptionExpiresAt?: string | null;
}
