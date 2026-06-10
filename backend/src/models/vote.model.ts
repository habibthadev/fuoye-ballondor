import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const voteSchema = new Schema(
  {
    nomineeId: {
      type: Schema.Types.ObjectId,
      ref: 'Nominee',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    voterName: { type: String, required: true, trim: true },
    voterEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    quantity: { type: Number, required: true, min: 1, max: 100 },
    pricePerVote: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    vatOnFee: { type: Number, default: 0 },
    totalCharged: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['flutterwave'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'confirmed', 'rejected', 'failed', 'disputed'],
      default: 'pending',
      index: true,
    },
    flwTxId: { type: Number, default: null },
    confirmedAt: { type: Date, default: null },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
)

voteSchema.index({ paymentStatus: 1, paymentMethod: 1 })
voteSchema.index({ paymentStatus: 1, flwTxId: 1, createdAt: -1 })
voteSchema.index({ createdAt: -1 })

export type IVote = InferSchemaType<typeof voteSchema> & { _id: mongoose.Types.ObjectId }

export const Vote = mongoose.model('Vote', voteSchema)
