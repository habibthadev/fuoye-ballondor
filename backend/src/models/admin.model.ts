import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin', 'moderator'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type IAdmin = InferSchemaType<typeof adminSchema> & { _id: mongoose.Types.ObjectId }

export const Admin = mongoose.model('Admin', adminSchema)
