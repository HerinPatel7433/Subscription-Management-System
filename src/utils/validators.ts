// ── Password strength ────────────────────────────────────────────────
export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export interface PasswordStrengthResult {
  score: StrengthLevel  // 0 = very weak … 4 = very strong
  label: string
  color: string
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0
  if (password.length >= 8)  score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const capped = Math.min(score, 4) as StrengthLevel

  const map: Record<StrengthLevel, { label: string; color: string }> = {
    0: { label: 'Very Weak',  color: '#ef4444' },
    1: { label: 'Weak',       color: '#f97316' },
    2: { label: 'Fair',       color: '#eab308' },
    3: { label: 'Strong',     color: '#22c55e' },
    4: { label: 'Very Strong', color: '#06b6d4' },
  }

  return { score: capped, ...map[capped] }
}

// ── Email validation ─────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Password rules ───────────────────────────────────────────────────
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
}

export function getPasswordErrors(password: string): string[] {
  const errors: string[] = []
  if (password.length < PASSWORD_RULES.minLength)
    errors.push(`At least ${PASSWORD_RULES.minLength} characters`)
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password))
    errors.push('At least one uppercase letter')
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password))
    errors.push('At least one number')
  if (PASSWORD_RULES.requireSpecial && !/[^a-zA-Z0-9]/.test(password))
    errors.push('At least one special character')
  return errors
}
