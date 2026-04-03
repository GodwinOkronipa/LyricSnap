'use client';

import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Button } from './ui/button';

interface PaystackButtonProps {
  email: string;
  amount: number;
  metadata?: any;
  onSuccess: (reference: any) => void;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export default function PaystackButton({ 
  email, 
  amount, 
  onSuccess, 
  onClose, 
  className,
  children 
}: PaystackButtonProps) {
  const config = React.useMemo(() => {
    // 🍎 Note: Apple Pay may not be available for all currencies/regions
    // GHS support depends on Paystack merchant account configuration
    // If not showing, check: Dashboard > Settings > Payment Methods > Apple Pay
    const channels = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'];
    
    // Only add Apple Pay if explicitly enabled in environment
    if (process.env.NEXT_PUBLIC_ENABLE_APPLE_PAY === 'true') {
      channels.push('apple_pay');
    }

    return {
      reference: (new Date()).getTime().toString(),
      email: email || "guest@lyricsnap.app",
      amount: amount,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      currency: 'GHS',
      label: 'LyricSnap Studio Pro (Flywheel Technologies)',
      channels: channels,
    };
  }, [email, amount]);

  const initializePayment: any = usePaystackPayment(config);

  return (
    <Button 
      onClick={() => initializePayment(onSuccess, onClose)}
      className={className}
    >
      {children}
    </Button>
  );
}
