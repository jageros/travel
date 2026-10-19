/** @param {{checkedAt?: string, expiresAt?: string, dynamic?: boolean}} fact
 * @param {{status?: string}|undefined} health
 * @param {Date} [now] */
export function factStatus(fact, health, now = new Date()) {
  if (!fact.checkedAt || Number.isNaN(Date.parse(fact.checkedAt))) return 'unverified';
  if (Date.parse(fact.checkedAt) > now.getTime()) return 'unverified';
  if (!health) return 'unverified';
  if (health.status !== 'unchanged') return 'needs-review';
  if (fact.dynamic && !fact.expiresAt) return 'expired';
  if (fact.expiresAt && (Number.isNaN(Date.parse(fact.expiresAt)) || now.getTime() >= Date.parse(`${fact.expiresAt}T00:00:00Z`))) return 'expired';
  return 'current';
}
