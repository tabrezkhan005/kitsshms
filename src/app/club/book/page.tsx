import { Suspense } from "react";
import ClubBookingForm from "@/components/club/ClubBookingForm";

export default function ClubBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClubBookingForm />
    </Suspense>
  );
}
