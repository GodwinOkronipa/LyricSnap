declare module 'react-paystack' {
  export function usePaystackPayment(config: any): (onSuccess?: (reference: any) => void, onClose?: () => void) => void;
  export const PaystackButton: any;
  export const PaystackConsumer: any;
}
