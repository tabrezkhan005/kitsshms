import { Suspense } from "react";
import FacultyBookingForm from "@/components/faculty/FacultyBookingForm";

export default function FacultyBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FacultyBookingForm />
    </Suspense>
  );
}
