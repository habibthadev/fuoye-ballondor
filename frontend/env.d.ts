/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module '@hugeicons/vue' {
  import type { DefineComponent } from 'vue'
  export const HugeiconsIcon: DefineComponent<object, object, unknown>
  export const Trophy01Icon: DefineComponent<object, object, unknown>
  export const Star01Icon: DefineComponent<object, object, unknown>
  export const Shield01Icon: DefineComponent<object, object, unknown>
  export const Lightbulb01Icon: DefineComponent<object, object, unknown>
  export const Target01Icon: DefineComponent<object, object, unknown>
  export const Home01Icon: DefineComponent<object, object, unknown>
  export const UserGroupIcon: DefineComponent<object, object, unknown>
  export const ChartBarIcon: DefineComponent<object, object, unknown>
  export const Settings01Icon: DefineComponent<object, object, unknown>
  export const CheckmarkCircle01Icon: DefineComponent<object, object, unknown>
  export const CancelCircleIcon: DefineComponent<object, object, unknown>
  export const Cancel01Icon: DefineComponent<object, object, unknown>
  export const Upload01Icon: DefineComponent<object, object, unknown>
  export const Share01Icon: DefineComponent<object, object, unknown>
  export const VoteIcon: DefineComponent<object, object, unknown>
  export const HandPointingIcon: DefineComponent<object, object, unknown>
  export const BankIcon: DefineComponent<object, object, unknown>
  export const CreditCardIcon: DefineComponent<object, object, unknown>
  export const ReceiptIcon: DefineComponent<object, object, unknown>
  export const Dashboard01Icon: DefineComponent<object, object, unknown>
  export const UserMultipleIcon: DefineComponent<object, object, unknown>
  export const MoneyBagIcon: DefineComponent<object, object, unknown>
  export const Logout01Icon: DefineComponent<object, object, unknown>
  export const Menu01Icon: DefineComponent<object, object, unknown>
  export const Search01Icon: DefineComponent<object, object, unknown>
  export const FilterIcon: DefineComponent<object, object, unknown>
  export const ArrowRight01Icon: DefineComponent<object, object, unknown>
  export const ArrowLeft01Icon: DefineComponent<object, object, unknown>
  export const PlusIcon: DefineComponent<object, object, unknown>
  export const Edit01Icon: DefineComponent<object, object, unknown>
  export const Download01Icon: DefineComponent<object, object, unknown>
  export const ArrowUp01Icon: DefineComponent<object, object, unknown>
  export const Delete01Icon: DefineComponent<object, object, unknown>
  export const RefreshIcon: DefineComponent<object, object, unknown>
  export const Loading01Icon: DefineComponent<object, object, unknown>
  export const Link01Icon: DefineComponent<object, object, unknown>
}
