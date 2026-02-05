
import { Suspense } from "react";
import AdminCalendar from "@/components/admin/AdminCalendar";

export default function AdminCalendarPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <AdminCalendar />
    </Suspense>
  );
}
