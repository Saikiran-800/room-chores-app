export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "AS_NEEDED";
export type AssignmentStatus = "PENDING" | "COMPLETED" | "MISSED";

export interface Roommate {
  id: string;
  name: string;
  active: boolean;
  capacityPercent: number;
  skills: string[];
}

export interface Chore {
  code: string;
  name: string;
  category: string;
  points: number;
  estimatedMinutes: number;
  frequency: Frequency;
  requiredSkill: string | null;
  location: string | null;
  parentCode: string | null;
  enabled: boolean;
}

export interface Assignment {
  id: string;
  chore: Chore;
  roommate: Roommate;
  dueDate: string;
  status: AssignmentStatus;
  pointsAwarded: number;
  completedAt: string | null;
  note: string | null;
}

export interface RoommateFairness {
  roommateId: string;
  name: string;
  earned: number;
  assigned: number;
  missed: number;
  target: number;
  delta: number;
}

export interface FairnessReport {
  month: string;
  totalWorkload: number;
  roommates: RoommateFairness[];
}

export interface GenerateResult {
  date: string;
  created: Assignment[];
  skipped: string[];
}

export const SKILLS = ["COOKING", "BASIC_PREP"] as const;
export const FREQUENCIES: Frequency[] = ["DAILY", "WEEKLY", "MONTHLY", "AS_NEEDED"];
