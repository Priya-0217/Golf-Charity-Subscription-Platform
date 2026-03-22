'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Trophy,
  CheckCircle,
  Heart,
  Users,
  Menu,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/draws', label: 'Draws', icon: Trophy },
  { href: '/admin/winners', label: 'Winners', icon: CheckCircle },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export function AdminShell({
  children,
  fullName,
  email,
}: {
  children: React.ReactNode
  fullName: string | null
  email: string | undefined
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
            isActive(href, exact)
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          )}
        >
          <Icon className="h-5 w-5 shrink-0 opacity-90" />
          {label}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-green-400">GolfImpact</p>
            <p className="text-sm font-bold text-white">Admin portal</p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto border-t border-white/10 p-4">
          <p className="truncate text-xs font-medium text-slate-400">{fullName || 'Admin'}</p>
          <p className="truncate text-[11px] text-slate-500">{email}</p>
          <Link
            href="/dashboard"
            className="mt-3 flex items-center gap-2 text-xs font-bold text-green-400 hover:text-green-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Member dashboard
          </Link>
          <form action={logout} className="mt-3">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex min-h-screen flex-1 flex-col md:min-h-0">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            <span className="font-black text-gray-900">Admin</span>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="border-b border-gray-200 bg-slate-950 md:hidden">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-white/10 p-4">
              <form action={logout}>
                <Button type="submit" size="sm" variant="secondary" className="w-full">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        )}

        <main className="flex-1 bg-gray-50 text-gray-900">{children}</main>
      </div>
    </div>
  )
}
