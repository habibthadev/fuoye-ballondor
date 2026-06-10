import { createMiddleware } from 'hono/factory'
import type { ZodSchema, ZodError } from 'zod'

type ValidationTarget = 'json' | 'query' | 'param'

function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    const key = path || '_root'
    if (!formatted[key]) {
      formatted[key] = []
    }
    formatted[key]!.push(issue.message)
  }
  return formatted
}

export function validate(schema: ZodSchema, target: ValidationTarget = 'json') {
  return createMiddleware(async (c, next) => {
    let data: unknown

    switch (target) {
      case 'json':
        data = await c.req.json().catch(() => undefined)
        break
      case 'query':
        data = c.req.query()
        break
      case 'param':
        data = c.req.param()
        break
    }

    const result = schema.safeParse(data)
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', issues: formatZodError(result.error) },
        400
      )
    }

    c.set('validatedData', result.data)
    await next()
  })
}
