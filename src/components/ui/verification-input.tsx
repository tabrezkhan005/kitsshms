"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "./input"
import { Label } from "./label"

interface VerificationInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
  label?: string
}

export function VerificationInput({
  length = 6,
  onComplete,
  disabled = false,
  label = "Verification Code"
}: VerificationInputProps) {
  const [code, setCode] = useState<string[]>(new Array(length).fill(""))
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  const handleChange = (index: number, value: string) => {
    if (disabled) return

    const newCode = [...code]

    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1)
    }

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return
    }

    newCode[index] = value
    setCode(newCode)

    // Move to next input if value is entered
    if (value && index < length - 1) {
      setFocusedIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }

    // Check if code is complete
    if (newCode.every(digit => digit !== "")) {
      onComplete(newCode.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === "Backspace") {
      if (code[index]) {
        // Clear current input
        const newCode = [...code]
        newCode[index] = ""
        setCode(newCode)
      } else if (index > 0) {
        // Move to previous input
        setFocusedIndex(index - 1)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      setFocusedIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      setFocusedIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain")
    const numbers = pastedData.replace(/\D/g, "").slice(0, length)

    if (numbers.length === length) {
      const newCode = numbers.split("")
      setCode(newCode)
      onComplete(numbers)
    }
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>
      <div className="flex gap-2 justify-center">
        {code.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-12 h-12 text-center text-lg font-semibold ${
              focusedIndex === index
                ? "border-primary ring-2 ring-primary/20"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="•"
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Enter the 6-digit code sent to your email
      </p>
    </div>
  )
}
