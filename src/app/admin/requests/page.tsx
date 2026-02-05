import { Suspense } from "react";
import AdminRequests from "@/components/admin/AdminRequests";

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminRequests />
    </Suspense>
  );
}
