import { FacultySidebar } from "@/components/faculty/FacultySidebar";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FacultySidebar>{children}</FacultySidebar>;
}
