import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { storageConfigured } from "./teacherStore";

// Teacher mode is locked with one shared passcode, set as TEACHER_PASSCODE
// in the Vercel project. There are no accounts: knowing the passcode is
// what makes you the teacher. Changing the passcode signs everyone out.

const COOKIE = "teacher";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const passcode = () => process.env.TEACHER_PASSCODE?.trim() || null;

// The cookie holds a value derived from the passcode, never the passcode itself.
function token(code: string) {
  return createHmac("sha256", code).update("speaking-english-teacher-mode").digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function teacherModeConfigured() {
  return {
    passcode: passcode() !== null,
    storage: storageConfigured(),
  };
}

export function passcodeMatches(attempt: string) {
  const code = passcode();
  return code !== null && same(attempt.trim(), code);
}

export async function signIn() {
  const code = passcode();
  if (!code) return;
  (await cookies()).set(COOKIE, token(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export async function isTeacher() {
  const code = passcode();
  const value = (await cookies()).get(COOKIE)?.value;
  return code !== null && value !== undefined && same(value, token(code));
}
