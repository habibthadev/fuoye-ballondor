import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const refreshTokenSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true,
  },
  tokenHash: { type: String, required: true },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
})

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export type IRefreshToken = InferSchemaType<typeof refreshTokenSchema> & {
  _id: mongoose.Types.ObjectId
}

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)
