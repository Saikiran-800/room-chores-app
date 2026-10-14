import type { Chore, Roommate } from "~/lib/types";

/** Mirrors the backend rule: COOKING implies BASIC_PREP. */
export function isEligible(roommate: Roommate, chore: Chore): boolean {
  if (!roommate.active) return false;
  const skill = chore.requiredSkill;
  if (!skill) return true;
  if (roommate.skills.includes(skill)) return true;
  return skill === "BASIC_PREP" && roommate.skills.includes("COOKING");
}
