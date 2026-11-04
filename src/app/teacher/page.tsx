import type { Metadata } from "next";
import { TeacherMode } from "./TeacherMode";

export const metadata: Metadata = {
  title: "Teacher mode · Speaking English",
  robots: { index: false, follow: false },
};

export default function TeacherPage() {
  return <TeacherMode />;
}
