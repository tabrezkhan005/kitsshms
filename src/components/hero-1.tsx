"use client"

import { Button } from "@/components/ui/button"
import { getTimeBasedGreeting } from "@/lib/utils"
import Image from "next/image"

interface HeroProps {
  title: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}

export function Hero({
  title,
  subtitle,
  ctaLabel = "Login",
  ctaHref = "/login",
}: HeroProps) {
  // Get time-based greeting
  const greeting = getTimeBasedGreeting()

  return (
    <section
      id="hero"
      className="relative mx-auto w-full pt-40 px-6 text-center md:px-8
      min-h-[calc(100vh-40px)] overflow-hidden
      bg-[linear-gradient(to_bottom,#fff,#ffffff_50%,#e8e8e8_88%)]
      dark:bg-[linear-gradient(to_bottom,#000,#0000_30%,#898e8e_78%,#ffffff_99%_50%)]
      rounded-b-xl"
    >
      {/* Grid BG */}
      <div
        className="absolute -z-10 inset-0 opacity-80 h-[600px] w-full
        bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem]
        [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
      />

      {/* Radial Accent */}
      <div
        className="absolute left-1/2 top-[calc(100%-90px)] lg:top-[calc(100%-150px)]
        h-[500px] w-[700px] md:h-[500px] md:w-[1100px] lg:h-[750px] lg:w-[140%]
        -translate-x-1/2 rounded-[100%] border-[#B48CDE] bg-white dark:bg-black
        bg-[radial-gradient(closest-side,#fff_82%,#000000)]
        dark:bg-[radial-gradient(closest-side,#000_82%,#ffffff)]
        animate-fade-up"
      />

      {/* KITS Logo */}
      <div className="relative z-10 mb-8 flex justify-center">
        <div className="relative w-48 h-24 md:w-64 md:h-32 lg:w-80 lg:h-40">
          <Image
            src="/logo/kitslogo-bg.png"
            alt="KITS Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Dynamic Greeting */}
      <div className="relative z-10 mb-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-200 animate-fade-in">
          {greeting}
        </h2>
      </div>

      {/* Title */}
      <h1
        className="animate-fade-in -translate-y-4 text-balance
        bg-gradient-to-br from-black from-30% to-black/40
        bg-clip-text py-6 text-5xl font-semibold leading-none tracking-tighter
        text-transparent opacity-0 sm:text-6xl md:text-7xl lg:text-8xl
        dark:from-white dark:to-white/40 font-heading"
      >
        {title}
      </h1>

      {/* Subtitle */}
      <p
        className="animate-fade-in mb-12 -translate-y-4 text-balance
        text-lg tracking-tight text-gray-600 dark:text-gray-400
        opacity-0 md:text-xl font-body"
      >
        {subtitle}
      </p>

      {/* CTA */}
      {ctaLabel && (
        <div className="flex justify-center">
          <Button
            asChild
            className="mt-[-20px] w-fit md:w-52 z-20 font-body tracking-tighter text-center text-lg"
          >
            <a href={ctaHref}>{ctaLabel}</a>
          </Button>
        </div>
      )}

      {/* Credits Section */}
      <div className="relative z-10 mt-16 pb-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-body">
            Crafted with ❤️ by{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Tabrez Khan
            </span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-1">
            Department of CSM
          </p>
        </div>
      </div>

      {/* Bottom Fade */}
      <div
        className="animate-fade-up relative mt-32 opacity-0 [perspective:2000px]
        after:absolute after:inset-0 after:z-50
        after:[background:linear-gradient(to_top,hsl(var(--background))_10%,transparent)]"
      />
    </section>
  )
}
