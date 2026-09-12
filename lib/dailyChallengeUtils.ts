import { DAILY_CHALLENGE_POOL } from "./dailyChallengePool";

// Target timezone: Indian Standard Time (UTC+5:30)
const IST_OFFSET_MINUTES = 330;

/**
 * Returns current date/time components adjusted to IST.
 */
export function getIstDateParts(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + IST_OFFSET_MINUTES * 60000);
  return {
    year: istTime.getFullYear(),
    month: String(istTime.getMonth() + 1).padStart(2, "0"),
    day: String(istTime.getDate()).padStart(2, "0"),
    hour: istTime.getHours(),
    minute: istTime.getMinutes(),
    second: istTime.getSeconds(),
    dateObj: istTime,
  };
}

/**
 * Calculates the current 10:00 AM cycle string (YYYY-MM-DD).
 * A cycle starts at 10:00:00 AM IST and runs until 09:59:59 AM IST the next day.
 */
export function getCurrentCycleDate(date = new Date()): string {
  const ist = getIstDateParts(date);
  if (ist.hour >= 10) {
    return `${ist.year}-${ist.month}-${ist.day}`;
  }
  // Before 10:00 AM IST, the active cycle belongs to yesterday
  const yesterday = new Date(ist.dateObj.getTime() - 24 * 60 * 60 * 1000);
  const yYear = yesterday.getFullYear();
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
  const yDay = String(yesterday.getDate()).padStart(2, "0");
  return `${yYear}-${yMonth}-${yDay}`;
}

/**
 * Calculates the next upcoming 10:00 AM IST rotation timestamp.
 */
export function getNextCycleRotationTime(date = new Date()): Date {
  const ist = getIstDateParts(date);
  const targetYear = ist.year;
  const targetMonth = ist.dateObj.getMonth();
  let targetDay = ist.dateObj.getDate();

  // If already at or past 10:00 AM IST, next rotation is tomorrow at 10:00 AM IST
  if (ist.hour >= 10) {
    targetDay += 1;
  }

  // 10:00 AM IST in UTC is 04:30 AM UTC
  const utcDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 4, 30, 0, 0));
  return utcDate;
}

/**
 * Maps a cycle date string (YYYY-MM-DD) deterministically to an index [0 .. DAILY_CHALLENGE_POOL.length - 1].
 */
export function getQuestionIndexForCycle(cycleDate: string): number {
  const anchor = new Date("2026-01-01T00:00:00Z").getTime();
  const current = new Date(`${cycleDate}T00:00:00Z`).getTime();
  const diffDays = Math.floor((current - anchor) / (24 * 60 * 60 * 1000));
  const poolSize = DAILY_CHALLENGE_POOL.length || 100;
  return ((diffDays % poolSize) + poolSize) % poolSize;
}
