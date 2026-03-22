/**
 * Next monthly draw scheduling.
 * Override with NEXT_PUBLIC_NEXT_DRAW_AT (ISO 8601) for demos or fixed dates.
 */

const DRAW_HOUR_UTC = 20

export function parseEnvNextDraw(): Date | null {
  const raw = process.env.NEXT_PUBLIC_NEXT_DRAW_AT?.trim()
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Advance month until the instant is strictly in the future. */
function bumpUntilFuture(d: Date): Date {
  const out = new Date(d.getTime())
  const now = Date.now()
  let guard = 0
  while (out.getTime() <= now && guard < 36) {
    out.setUTCMonth(out.getUTCMonth() + 1)
    guard += 1
  }
  return out
}

/**
 * Next draw instant: env override, else one calendar month after last published draw (same UTC day, 20:00 UTC),
 * else first day of next calendar month 20:00 UTC.
 */
export function computeNextDrawDate(latestPublishedDrawDateIso: string | null | undefined): Date {
  const env = parseEnvNextDraw()
  if (env) return bumpUntilFuture(env)

  if (latestPublishedDrawDateIso) {
    const last = new Date(latestPublishedDrawDateIso)
    if (!Number.isNaN(last.getTime())) {
      const next = new Date(
        Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, last.getUTCDate(), DRAW_HOUR_UTC, 0, 0)
      )
      return bumpUntilFuture(next)
    }
  }

  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, DRAW_HOUR_UTC, 0, 0))
  return bumpUntilFuture(next)
}

export function formatNextDrawLong(d: Date, locale?: string) {
  return d.toLocaleString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}
