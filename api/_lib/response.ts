import type { Context } from "hono"

export function success(c: Context, data: unknown, status = 200) {
  return c.json({ success: true, data }, status)
}

export function error(
  c: Context,
  code: string,
  message: string,
  status = 400
) {
  return c.json({ success: false, error: { code, message } }, status)
}
