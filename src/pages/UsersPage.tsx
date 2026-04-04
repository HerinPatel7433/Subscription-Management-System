import { useState, useEffect, useCallback } from 'react'
import { Plus, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/Modal'
import { Toast, useToast } from '@/components/Toast'
import { getUsers, createUser, type User } from '@/services/subscriptionService'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['admin', 'internal', 'portal'], { required_error: 'Role is required' }),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number')
    .regex(/[^a-zA-Z0-9]/, 'At least one special character'),
})

type FormData = z.infer<typeof schema>

export default function UsersPage() {
  const { toasts, toast, dismiss } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getUsers()
      setUsers(res.data)
    } catch {
      toast('error', 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => {
    reset({})
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await createUser(data)
      toast('success', `User ${data.name} created successfully`)
      setModalOpen(false)
      fetchAll()
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } }
      toast('error', apiErr?.response?.data?.message || 'Failed to create user')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
            <Users size={18} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Users</h1>
            <p className="text-xs text-slate-500">Manage internal and portal users</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-glow"
        >
          <Plus size={15} /> New User
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium uppercase tracking-wider
                      ${u.role === 'admin' ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' :
                        u.role === 'internal' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-slate-600/40 text-slate-300 border-slate-500/40'}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create User" width="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} {...register('name')} placeholder="Full Name" />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="form-label">Email</label>
            <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} {...register('email')} placeholder="email@company.com" />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <label className="form-label">Password</label>
            <input type="password" className={`form-input ${errors.password ? 'error' : ''}`} {...register('password')} placeholder="••••••••" />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
            <p className="text-[10px] text-slate-500 mt-1">Requires 8+ chars, uppercase, number, & special character.</p>
          </div>

          <div>
            <label className="form-label">Role</label>
            <select className={`form-input ${errors.role ? 'error' : ''}`} {...register('role')}>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="internal">Internal</option>
              <option value="portal">Portal</option>
            </select>
            {errors.role && <p className="field-error">{errors.role.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-2.5">
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
