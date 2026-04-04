import type { StrengthLevel } from '@/utils/validators'

interface PasswordStrengthProps {
  score: StrengthLevel
  label: string
  color: string
}

export default function PasswordStrength({ score, label, color }: PasswordStrengthProps) {
  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex gap-1.5">
        {([0, 1, 2, 3] as const).map((idx) => (
          <div
            key={idx}
            className="strength-bar"
            style={{
              backgroundColor: idx < score ? color : '#334155',
            }}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color }}>
        {score > 0 ? label : 'Enter a password'}
      </p>
    </div>
  )
}
