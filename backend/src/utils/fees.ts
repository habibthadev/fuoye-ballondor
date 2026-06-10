const FLW_PCT = 0.02
const FLW_CAP = 2000
const VAT_PCT = 0.075

export function calculateFees(baseAmount: number) {
  const fee = Math.min(Math.round(baseAmount * FLW_PCT), FLW_CAP)
  const vatOnFee = Math.round(fee * VAT_PCT)
  const totalCharged = baseAmount + fee + vatOnFee
  return { fee, vatOnFee, totalCharged }
}
