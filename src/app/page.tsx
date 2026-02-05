import { Hero } from "@/components/hero-1"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Landing Page Hero Section */}
      <Hero
        title="Seminar Hall Management System"
        subtitle="Welcome to KITS SHMS - Efficiently manage and book seminar halls."
        ctaLabel="Login"
        ctaHref="/login"
      />
    </main>
  )
}
