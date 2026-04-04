import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { signupUser } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import PasswordStrength from '@/components/PasswordStrength'
import { evaluatePasswordStrength, getPasswordErrors } from '@/utils/validators'

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[a-z]/, 'At least one lowercase letter')
      .regex(/[^a-zA-Z0-9]/, 'At least one special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const strength = evaluatePasswordStrength(passwordValue)
  const pwErrors = getPasswordErrors(passwordValue)

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await signupUser({ name: data.name, email: data.email, password: data.password })
      setUser(res.user)
      navigate(res.user.role === 'admin' ? '/dashboard' : '/my-subscriptions', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        axiosErr?.response?.data?.message ??
        axiosErr?.message ??
        'Registration failed. Please try again later.'
      setServerError(msg)
    }
  }



  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-xl shadow-glow">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">SubsManager</span>
        </div>

        <div className="auth-card">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-6">Get started in seconds</p>

          {serverError && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm animate-shake">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="signup-name" className="form-label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  {...register('name')}
                  className={`form-input pl-10 ${errors.name ? 'error' : ''}`}
                />
              </div>
              {errors.name && <p className="field-error"><AlertCircle size={12} />{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="form-label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={`form-input pl-10 ${errors.email ? 'error' : ''}`}
                />
              </div>
              {errors.email && <p className="field-error"><AlertCircle size={12} />{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="form-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('password', {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                  className={`form-input pl-10 pr-11 ${errors.password ? 'error' : ''}`}
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
              {errors.password && <p className="field-error"><AlertCircle size={12} />{errors.password.message}</p>}

              {/* Strength indicator */}
              {passwordValue && (
                <PasswordStrength score={strength.score} label={strength.label} color={strength.color} />
              )}

              {/* Rules checklist */}
              {passwordValue && pwErrors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {['At least 8 characters', 'At least one uppercase letter', 'At least one lowercase letter', 'At least one special character'].map((rule) => {
                    const met = !pwErrors.includes(rule)
                    return (
                      <li key={rule} className={`flex items-center gap-1.5 text-[11px] ${met ? 'text-green-400' : 'text-slate-500'}`}>
                        <CheckCircle size={11} className={met ? 'text-green-400' : 'text-slate-600'} />
                        {rule}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="form-label">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`form-input pl-10 pr-11 ${errors.confirmPassword ? 'error' : ''}`}
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
              {errors.confirmPassword && (
                <p className="field-error"><AlertCircle size={12} />{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
