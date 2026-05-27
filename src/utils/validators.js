export function isValidEmail(email) {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function required(value) {
  if (value === null || value === undefined) return false
  return String(value).trim().length > 0
}

export function isPositiveInt(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 0
}
