import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, SendHorizonal, ArrowLeft, Zap } from 'lucide-react'
import { requestPasswordReset, confirmPasswordReset } from '@/services/authService'
import PasswordStrength from '@/components/PasswordStrength'
import { evaluatePasswordStrength } from '@/utils/validators'

// ── Step 1 schema ───────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type EmailForm = z.infer<typeof emailSchema>

// ── Step 2 schema ───────────────────────────────────────────────────
const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[0-9]/, 'At least one number')
      .regex(/[^a-zA-Z0-9]/, 'At least one special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
type ResetForm = z.infer<typeof resetSchema>

// ───────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get('token')

  // Determine which step to show
  const [step, setStep] = useState<'email' | 'sent' | 'reset' | 'done'>(
    resetToken ? 'reset' : 'email',
  )
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  const strength = evaluatePasswordStrength(passwordValue)

  // ── Step 1 form ──────────────────────────────────────────────────
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  const onRequestReset = async (data: EmailForm) => {
    setServerError(null)
    try {
      await requestPasswordReset(data.email)
      setStep('sent')
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  // ── Step 2 form ──────────────────────────────────────────────────
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const onConfirmReset = async (data: ResetForm) => {
    setServerError(null)
    if (!resetToken) return
    try {
      await confirmPasswordReset({ token: resetToken, new_password: data.password })
      setStep('done')
    } catch {
      setServerError('Reset link is invalid or expired. Please request a new one.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-xl shadow-glow">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">SubsManager</span>
        </div>

        <div className="auth-card">

          {/* ── STEP: Email entry ─────────────────────────────────── */}
          {step === 'email' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
              <p className="text-slate-400 text-sm mb-6">
                Enter your email and we'll send a reset link.
              </p>

              {serverError && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={emailForm.handleSubmit(onRequestReset)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="form-label">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      {...emailForm.register('email')}
                      className={`form-input pl-10 ${emailForm.formState.errors.email ? 'error' : ''}`}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="field-error">
                      <AlertCircle size={12} />{emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  id="reset-request-submit"
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className="btn-primary"
                >
                  {emailForm.formState.isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <SendHorizonal size={16} /> Send reset link
                    </span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── STEP: Email sent ──────────────────────────────────── */}
          {step === 'sent' && (
            <div className="text-center py-4 animate-fade-in">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-600/20 border border-primary-500/30 rounded-2xl mx-auto mb-5">
                <Mail size={28} className="text-primary-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Check your inbox</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                We've sent a password reset link to your email address. The link expires in 30 minutes.
              </p>
              <p className="text-slate-500 text-xs">
                Didn't receive it?{' '}
                <button
                  onClick={() => setStep('email')}
                  className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          )}

          {/* ── STEP: New password ───────────────────────────────── */}
          {step === 'reset' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
              <p className="text-slate-400 text-sm mb-6">Choose a strong password for your account.</p>

              {serverError && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={resetForm.handleSubmit(onConfirmReset)} noValidate className="space-y-4">
                {/* New password */}
                <div>
                  <label htmlFor="new-password" className="form-label">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      id="new-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...resetForm.register('password', {
                        onChange: (e) => setPasswordValue(e.target.value),
                      })}
                      className={`form-input pl-10 pr-11 ${resetForm.formState.errors.password ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.password && (
                    <p className="field-error"><AlertCircle size={12} />{resetForm.formState.errors.password.message}</p>
                  )}
                  {passwordValue && (
                    <PasswordStrength score={strength.score} label={strength.label} color={strength.color} />
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label htmlFor="confirm-new-password" className="form-label">Confirm new password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      id="confirm-new-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...resetForm.register('confirmPassword')}
                      className={`form-input pl-10 pr-11 ${resetForm.formState.errors.confirmPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="field-error"><AlertCircle size={12} />{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  id="reset-confirm-submit"
                  type="submit"
                  disabled={resetForm.formState.isSubmitting}
                  className="btn-primary"
                >
                  {resetForm.formState.isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Updating…
                    </span>
                  ) : 'Update password'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP: Done ───────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center py-4 animate-fade-in">
              <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl mx-auto mb-5">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Password updated!</h1>
              <p className="text-slate-400 text-sm mb-6">
                Your password has been reset successfully.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center justify-center gap-2 w-full">
                Sign in now
              </Link>
            </div>
          )}

          {/* Back to login */}
          {step !== 'done' && (
            <div className="mt-6 flex justify-center">
              <Link to="/login" className="btn-ghost flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
