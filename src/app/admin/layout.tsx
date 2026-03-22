import { requireAdmin } from '@/lib/auth/require-admin'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <AdminShell fullName={admin.fullName} email={admin.email}>
      {children}
    </AdminShell>
  )
}
