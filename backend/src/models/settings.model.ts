import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const settingsSchema = new Schema(
  {
    votingActive: { type: Boolean, default: false },
    flutterwaveEnabled: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
)

export type ISettings = InferSchemaType<typeof settingsSchema> & { _id: mongoose.Types.ObjectId }

export const Settings = mongoose.model('Settings', settingsSchema)
