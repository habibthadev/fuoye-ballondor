import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    iconName: { type: String, required: true },
    coverImage: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, required: true, index: true },
    pricePerVote: { type: Number, default: 100 },
  },
  { timestamps: true }
)

export type ICategory = InferSchemaType<typeof categorySchema> & { _id: mongoose.Types.ObjectId }

export const Category = mongoose.model('Category', categorySchema)
