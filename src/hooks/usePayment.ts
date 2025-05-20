// // hooks/usePayment.ts
// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/router';
// import { toast } from 'react-hot-toast';

// type PaymentStatus = 'idle' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

// export const usePayment = () => {
//   const router = useRouter();
//   const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
//   const [countdown, setCountdown] = useState(30);
//   const [isProcessing, setIsProcessing] = useState(false);

//   const resetPayment = useCallback(() => {
//     setPaymentStatus('idle');
//     setCountdown(30);
//     setIsProcessing(false);
//   }, []);

//   const initiatePayment = useCallback(
//     async (url: string, payload: any, successRedirectData: any) => {
//       setPaymentStatus('pending');
//       setIsProcessing(true);
//       setCountdown(30);

//       let timeoutId: NodeJS.Timeout;
//       let pollIntervalId: NodeJS.Timeout;

//       try {
//         // Start timeout countdown
//         timeoutId = setInterval(() => {
//           setCountdown(prev => {
//             if (prev <= 1) {
//               setPaymentStatus('timeout');
//               toast.error('Payment timed out');
//               return 0;
//             }
//             return prev - 1;
//           });
//         }, 1000);

//         // Initiate payment
//         const response = await fetch(url, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         });

//         if (!response.ok) {
//           throw new Error('Failed to initiate payment');
//         }

//         // Start polling for status
//         pollIntervalId = setInterval(async () => {
//           try {
//             const checkRes = await fetch(
//               `/api/stk_api/check_payment_status?phone=${payload.phone}&account=${payload.accountnumber || payload.storenumber}`
//             );
//             const checkData = await checkRes.json();

//             if (checkData.status === 'Success') {
//               clearInterval(timeoutId);
//               clearInterval(pollIntervalId);
//               setPaymentStatus('success');
//               toast.success('Payment confirmed!');
//               router.push(
//                 `/ThankYouPage?data=${encodeURIComponent(JSON.stringify(successRedirectData))}`
//               );
//             } else if (checkData.status === 'Cancelled') {
//               clearInterval(timeoutId);
//               clearInterval(pollIntervalId);
//               setPaymentStatus('cancelled');
//               toast.error('Payment was cancelled');
//             } else if (checkData.status === 'Failed') {
//               clearInterval(timeoutId);
//               clearInterval(pollIntervalId);
//               setPaymentStatus('failed');
//               toast.error('Payment failed');
//             }
//           } catch (error) {
//             console.error('Polling error:', error);
//           }
//         }, 5000);
//       } catch (error) {
//         clearInterval(timeoutId!);
//         clearInterval(pollIntervalId!);
//         setPaymentStatus('failed');
//         toast.error('Payment initiation failed');
//         console.error('Payment error:', error);
//       } finally {
//         setIsProcessing(false);
//       }

//       return () => {
//         clearInterval(timeoutId!);
//         clearInterval(pollIntervalId!);
//       };
//     },
//     [router]
//   );

//   return {
//     paymentStatus,
//     countdown,
//     isProcessing,
//     initiatePayment,
//     resetPayment,
//   };
// };