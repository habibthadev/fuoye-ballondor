import type { IAdmin } from './models/admin.model.js'

export type AdminPayload = {
  sub: string
  role: IAdmin['role']
}

export type AppEnv = {
  Variables: {
    validatedData: unknown
    admin: AdminPayload
  }
}
