import { Suspense } from "react";
import AdminDirectBookings from "@/components/admin/AdminDirectBookings";

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDirectBookings />
    </Suspense>
  );
}
