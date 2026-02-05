"use client"

import { useState } from "react"
import { Button } from "@/components/ui/logbutton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VerificationInput } from "@/components/ui/verification-input"
import { ImageSlider } from "@/components/image-slider"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { authenticateUser, verifyLoginCode, resendVerificationCode, type User } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [sessionToken, setSessionToken] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isFallback, setIsFallback] = useState(false)

  // Placeholder images for the slider - replace with actual images later
  const placeholderImages: string[] = [
    // These will be replaced with actual images when provided
    // For now, the ImageSlider component will use its default placeholders
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setEmailError("")
    setVerificationCode("")
    setIsFallback(false)

    try {
      const response = await authenticateUser(formData.username, formData.password)

      if (response.success && response.requiresVerification) {
        setSessionToken(response.sessionToken!)
        setUser(response.user!)
        setShowVerification(true)
        setCodeSent(response.codeSent || false)

        // Handle case where email delivery failed and code is included in response
        if (!response.codeSent && response.verificationCode) {
          setVerificationCode(response.verificationCode)
          setEmailError(response.emailError || "Email delivery failed")
          setIsFallback(response.fallback || false)
        }

        setIsLoading(false)
      } else if (response.success) {
        // Handle successful login without verification (if needed)
        console.log("Login successful:", response.user)
        redirectToDashboard(response.user!)
      } else {
        setError(response.message)
        setIsLoading(false)
      }
    } catch {
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleVerification = async (code: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await verifyLoginCode(sessionToken, code)

      if (response.success) {
        console.log("Verification successful:", response.user)
        // Store user data in localStorage for session management
        localStorage.setItem('user', JSON.stringify(response.user))
        localStorage.setItem('isAuthenticated', 'true')
        // Redirect to appropriate dashboard based on user role
        redirectToDashboard(response.user!)
      } else {
        setError(response.message)
        setIsLoading(false)
      }
    } catch {
      setError("Verification failed")
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setResendMessage("")
    setError("")
    setEmailError("")
    setVerificationCode("")
    setIsFallback(false)

    try {
      const response = await resendVerificationCode(sessionToken)

      if (response.success) {
        setResendMessage(response.message)
        setCodeSent(response.codeSent || false)

        // Handle case where email delivery failed and code is included in response
        if (!response.codeSent && response.verificationCode) {
          setVerificationCode(response.verificationCode)
          setEmailError(response.emailError || "Email delivery failed")
          setIsFallback(response.fallback || false)
        }
      } else {
        setError(response.message)
      }
    } catch {
      setError("Failed to resend code")
    } finally {
      setResendLoading(false)
    }
  }

  const redirectToDashboard = (user: User) => {
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        router.push('/admin/dashboard')
        break
      case 'faculty':
        router.push('/faculty/dashboard')
        break
      case 'clubs':
        router.push('/club/dashboard')
        break
      default:
        console.log("Unknown role")
        setError("Invalid user role")
    }
  }

  const handleBackToLogin = () => {
    setShowVerification(false)
    setSessionToken("")
    setUser(null)
    setError("")
    setCodeSent(false)
    setResendMessage("")
    setVerificationCode("")
    setEmailError("")
    setIsFallback(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Slider */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <ImageSlider
          images={placeholderImages}
          interval={4000}
          className="h-full"
        />
        {/* Overlay with text */}
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="relative w-32 h-16">
              <Image
                src="/logo/kitslogo-bg.png"
                alt="KITS Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showVerification ? (
              // Login Form
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Form Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 font-body">
                    Sign in to your account to continue
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username or Email
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username or email"
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-medium"
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Signing in...
                        </motion.div>
                      ) : (
                        <motion.span
                          key="login"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Sign In
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </form>
              </motion.div>
            ) : (
              // Verification Form
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Form Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                    Two-Step Verification
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 font-body">
                    Enter the verification code sent to your email
                  </p>
                  {user && (
                    <p className="text-sm text-gray-500 mt-2">
                      Code sent to: {user.email}
                    </p>
                  )}
                </div>

                {/* Success/Error Messages */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {resendMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">{resendMessage}</p>
                  </div>
                )}

                {/* Email Status */}
                {codeSent ? (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-600 text-sm">
                      ✅ Verification code sent to your email
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-600 text-sm">
                      ⚠️ Email delivery failed. Check console for verification code.
                    </p>
                  </div>
                )}

                {/* Show verification code if email failed or fallback */}
                {verificationCode && (
                  <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700 text-sm font-medium mb-2">
                      {isFallback
                        ? "Verification Code (Email delivery skipped - using console fallback):"
                        : "Verification Code (Email delivery failed):"
                      }
                    </p>
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-center">
                      <span className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                        {verificationCode}
                      </span>
                    </div>
                    {emailError && (
                      <p className="text-xs text-gray-500 mt-2">
                        Error: {emailError}
                      </p>
                    )}
                    {isFallback && (
                      <p className="text-xs text-blue-600 mt-2">
                        💡 This code is also logged to the server console for debugging.
                      </p>
                    )}
                  </div>
                )}

                {/* Verification Input */}
                <div className="space-y-6">
                  <VerificationInput
                    onComplete={handleVerification}
                    disabled={isLoading}
                  />

                  {/* Resend Code Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={resendLoading || isLoading}
                    className="w-full"
                  >
                    <AnimatePresence mode="wait">
                      {resendLoading ? (
                        <motion.div
                          key="resend-loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                          Resending...
                        </motion.div>
                      ) : (
                        <motion.span
                          key="resend"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Resend Code
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>

                  {/* Back Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToLogin}
                    disabled={isLoading || resendLoading}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 text-center">
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
        </motion.div>
      </div>
    </div>
  )
}
