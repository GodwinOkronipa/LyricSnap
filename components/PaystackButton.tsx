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
  const config = {
    reference: (new Date()).getTime().toString(),
    email: email || "guest@lyricsnap.app",
    amount: amount,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    currency: 'GHS',
    label: 'LyricSnap Studio Pro (Flywheel Technologies)',
  };

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
