<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { AnimatePresence, m } from 'motion-v'
import { API_BASE } from '../../config/api.js'
import AppInput from '../ui/AppInput.vue'
import AppCard from '../ui/AppCard.vue'

function calcFees(base: number) {
  const fee = Math.min(Math.round(base * 0.02), 2000)
  const vatOnFee = Math.round(fee * 0.075)
  return { fee, vatOnFee, totalCharged: base + fee + vatOnFee }
}

const router = useRouter()

const props = defineProps<{
  show: boolean
  nominee: { name: string; _id: string }
  pricePerVote?: number
}>()

const emit = defineEmits<{ close: [] }>()

const quantity = ref(1)
const voterName = ref('')
const voterEmail = ref('')
const submitting = ref(false)
const error = ref('')

const ppv = computed(() => props.pricePerVote || 200)
const baseAmount = computed(() => quantity.value * ppv.value)
const fees = computed(() => calcFees(baseAmount.value))

let flwScriptLoaded = false

function loadFlutterwaveScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as unknown as Record<string, unknown>).FlutterwaveCheckout) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.flutterwave.com/v3.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

async function submitVote() {
  error.value = ''
  submitting.value = true
  try {
    const res = await fetch(`${API_BASE}/api/votes/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomineeId: props.nominee._id,
        quantity: quantity.value,
        voterName: voterName.value,
        voterEmail: voterEmail.value,
        paymentMethod: 'flutterwave',
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to initiate vote')

    await openFlutterwaveModal(data.data)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    submitting.value = false
  }
}

async function openFlutterwaveModal(initData: { publicKey: string; txRef: string; amount: number; checkoutUrl?: string }) {
  const loaded = flwScriptLoaded || await loadFlutterwaveScript()
  flwScriptLoaded = true

  if (!loaded) {
    window.location.href = initData.checkoutUrl ?? ''
    return
  }

  const Flw = (window as unknown as Record<string, unknown>).FlutterwaveCheckout as (config: Record<string, unknown>) => void

  Flw({
    public_key: initData.publicKey,
    tx_ref: initData.txRef,
    amount: initData.amount,
    currency: 'NGN',
    customer: {
      email: voterEmail.value,
      name: voterName.value,
    },
    payment_options: 'card, ussd, banktransfer, mobilemoney, qr, account, credit, mpesa, barter, vouc',
    callback: async (response: { status: string; transaction_id: number; tx_ref: string }) => {
      if (response.status === 'successful' || response.status === 'completed') {
        try {
          await fetch(`${API_BASE}/api/votes/record-return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tx_ref: response.tx_ref,
              transaction_id: response.transaction_id,
            }),
          })
        } catch {}
        window.location.href = `/vote/success?tx_ref=${response.tx_ref}`
      }
    },
    onclose: () => {
      emit('close')
    },
  })
}
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <m.div
        v-if="show"
        key="vote-drawer"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.2 }"
        class="fixed inset-0 z-50"
      >
        <m.div
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.2 }"
          class="absolute inset-0 bg-ink/60 backdrop-blur-sm"
          @click="emit('close')"
        />
        <m.div
          :initial="{ x: '100%' }"
          :animate="{ x: 0 }"
          :exit="{ x: '100%' }"
          :transition="{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }"
          class="absolute bottom-0 right-0 top-0 w-full border-l border-border/50 bg-white md:max-w-lg"
        >
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between border-b border-border/50 px-5 py-4 md:px-6">
              <h2 class="text-lg font-800 text-ink">Cast Your Vote</h2>
              <button class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink" @click="emit('close')">
                <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-5 md:p-6">
              <div class="space-y-5">
                <div>
                  <p class="text-xs font-700 tracking-wider text-muted uppercase">Voting for</p>
                  <p class="mt-1 text-lg font-700 text-ink">{{ nominee.name }}</p>
                </div>
                <AppInput v-model="voterName" label="Your Name" placeholder="Enter your full name" />
                <AppInput v-model="voterEmail" label="Your Email" type="email" placeholder="Enter your email" />
                <div>
                  <label class="mb-1.5 block text-xs font-700 tracking-wider text-ink uppercase">Number of Votes (1-100)</label>
                  <div class="flex items-center gap-3">
                    <button class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border text-lg font-700 transition-colors hover:border-ink" @click="quantity = Math.max(1, quantity - 1)">&minus;</button>
                    <span class="w-12 text-center text-xl font-800 text-ink">{{ quantity }}</span>
                    <button class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border text-lg font-700 transition-colors hover:border-ink" @click="quantity = Math.min(100, quantity + 1)">+</button>
                  </div>
                </div>
                <AppCard class="!p-5">
                  <div class="space-y-2.5">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">Votes (₦{{ ppv }} each)</span>
                      <span class="font-600 text-ink">₦{{ baseAmount.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-xs text-muted">
                      <span>Transaction fee (2%)</span>
                      <span class="tabular-nums">₦{{ fees.fee.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-xs text-muted">
                      <span>VAT on fee (7.5%)</span>
                      <span class="tabular-nums">₦{{ fees.vatOnFee.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between border-t border-border/50 pt-2.5">
                      <span class="text-sm font-700 text-ink">Total charged</span>
                      <span class="text-lg font-800 text-blue tabular-nums">₦{{ fees.totalCharged.toLocaleString() }}</span>
                    </div>
                  </div>
                </AppCard>
                <div class="flex flex-wrap items-center gap-2 rounded-xl bg-surface px-4 py-3">
                  <span class="text-[10px] font-700 tracking-wider text-muted uppercase">Pay with</span>
                  <div class="flex flex-wrap gap-1.5">
                    <span class="rounded-md bg-white px-2 py-0.5 text-[10px] font-600 text-ink shadow-xs">Card</span>
                    <span class="rounded-md bg-white px-2 py-0.5 text-[10px] font-600 text-ink shadow-xs">USSD</span>
                    <span class="rounded-md bg-white px-2 py-0.5 text-[10px] font-600 text-ink shadow-xs">Transfer</span>
                    <span class="rounded-md bg-white px-2 py-0.5 text-[10px] font-600 text-ink shadow-xs">Mobile Money</span>
                    <span class="rounded-md bg-white px-2 py-0.5 text-[10px] font-600 text-ink shadow-xs">QR</span>
                  </div>
                </div>
                <p v-if="error" class="rounded-xl bg-rose/5 px-4 py-3 text-sm font-600 text-rose">{{ error }}</p>
                <button
                  class="w-full rounded-full bg-ink py-3.5 text-sm font-800 tracking-wider text-white transition-colors hover:bg-blue active:scale-[0.98] disabled:opacity-40"
                  :disabled="submitting"
                  @click="submitVote"
                >
                  <span v-if="submitting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span v-else>Pay ₦{{ fees.totalCharged.toLocaleString() }}</span>
                </button>
              </div>
            </div>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  </Teleport>
</template>
