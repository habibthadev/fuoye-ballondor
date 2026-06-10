import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const nomineeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    department: { type: String, required: true, trim: true },
    faculty: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    voteCount: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

nomineeSchema.index({ categoryId: 1, voteCount: -1 })

export type INominee = InferSchemaType<typeof nomineeSchema> & { _id: mongoose.Types.ObjectId }

export const Nominee = mongoose.model('Nominee', nomineeSchema)
