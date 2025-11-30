


import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import { Event, CheckoutCart } from '../types';
import * as api from '../services/api';
import { CheckCircleIcon, ShieldCheckIcon, UsersIcon } from './Icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, LinkAuthenticationElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Use the provided Sandbox Key
const stripePromise = loadStripe('pk_test_51SLBunRAyVvF9E7vr7yuREQGiXex8blRmLwL40tUIfqbtDrSg6alTAjl5vtQXFuCLW8CzwOPHqt7L9qI1Uj20RVy00iPsBrVtO');

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CheckoutCart;
  event: Event;
  recipientUserId?: string; // For competitions/fundraisers
  promoCode?: string;
  appliedDiscountPercent?: number;
  promoOwnerName?: string; // NEW: To display "Supporting [Name]"
}

type View = 'checkout' | 'payment_form' | 'success' | 'loading' | 'error';

const PaymentForm: React.FC<{ 
    total: number, 
    userEmail: string,
    onSuccess: () => void, 
    onError: (msg: string) => void 
}> = ({ total, userEmail, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);

        // Confirm payment
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href, // Redirect URL (not always used for 1-click)
            },
            redirect: 'if_required' 
        });

        if (error) {
            console.error("Stripe Error:", error);
            onError(error.message || "Payment failed. Please check your details.");
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess();
        } else {
            // Unexpected status, maybe requiring action, treat as waiting/error for now
            onError("Payment processing incomplete. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Secure Payment</h2>
            
            {/* 
                LinkAuthenticationElement:
                Prefilled with the logged-in user's email to ensure the email field 
                is populated by our system state, as required.
            */}
            <LinkAuthenticationElement 
                id="link-authentication-element"
                options={{ 
                    defaultValues: { email: userEmail }
                }} 
            />
            
            <PaymentElement 
                id="payment-element" 
                options={{ 
                    layout: "tabs",
                    paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
                }} 
            />
            
            <button 
                type="submit"
                disabled={isLoading || !stripe || !elements} 
                className="w-full h-14 mt-4 bg-purple-600 hover:bg-purple-500 text-white text-lg font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                    </div>
                ) : (
                    <>
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span>Pay ${total.toFixed(2)}</span>
                    </>
                )}
            </button>
        </form>
    );
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart, event, recipientUserId, promoCode, appliedDiscountPercent, promoOwnerName }) => {
  const { user, refreshUser } = useAuth();
  const [view, setView] = useState<View>('checkout');
  const [errorMessage, setErrorMessage] = useState('');
  const [platformDonation, setPlatformDonation] = useState(0);
  const [feesConfig, setFeesConfig] = useState({ percent: 5.9, fixed: 0.35 });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null); // NEW: Track ID for confirmation

  // Internal Promo State to allow changes within modal
  const [activePromoCode, setActivePromoCode] = useState(promoCode || '');
  const [activeDiscountPercent, setActiveDiscountPercent] = useState(appliedDiscountPercent || 0);
  const [activeOwnerName, setActiveOwnerName] = useState(promoOwnerName || '');
  
  const [promoInput, setPromoInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Initialize state from props when modal opens
  useEffect(() => {
      if (isOpen) {
          setView('checkout');
          setErrorMessage('');
          setActivePromoCode(promoCode || '');
          setPromoInput(promoCode || '');
          setActiveDiscountPercent(appliedDiscountPercent || 0);
          setActiveOwnerName(promoOwnerName || '');
          setPromoMessage(null);
          setClientSecret(null);
          setCurrentOrderId(null);

          api.getSystemSettings().then(settings => {
              let percent = 5.9;
              let fixed = 0.35;

              if (typeof settings.platformFeePercent === 'number' && !isNaN(settings.platformFeePercent)) {
                  percent = settings.platformFeePercent;
              }
              if (typeof settings.platformFeeFixed === 'number' && !isNaN(settings.platformFeeFixed)) {
                  fixed = settings.platformFeeFixed;
              }
              
              setFeesConfig({ percent, fixed });
          }).catch(err => {
              // Defaults are already set in useState
          });
      }
  }, [isOpen, promoCode, appliedDiscountPercent, promoOwnerName]);

  const handleApplyPromo = async () => {
      if (!promoInput.trim()) {
          // Clear promo if input is empty
          setActivePromoCode('');
          setActiveDiscountPercent(0);
          setActiveOwnerName('');
          setPromoMessage(null);
          return;
      }

      setValidatingPromo(true);
      setPromoMessage(null);

      try {
          const result = await api.validatePromoCode(event.id, promoInput.trim());
          if (result.valid) {
              setActivePromoCode(result.code);
              setActiveDiscountPercent(result.discountPercent);
              setActiveOwnerName(result.ownerName || '');
              
              let msg = "Code Applied!";
              if (result.discountPercent > 0) msg += ` ${result.discountPercent}% Off`;
              setPromoMessage({ type: 'success', text: msg });
          } else {
              setPromoMessage({ type: 'error', text: "Invalid Code" });
          }
      } catch (e) {
          setPromoMessage({ type: 'error', text: "Validation Failed" });
      } finally {
          setValidatingPromo(false);
      }
  };

  const { items, subtotal, discount, mandatoryFees, finalTotal } = useMemo(() => {
    const isFundraiser = event.type === 'fundraiser';
    const cartItems = Object.keys(cart).map((itemType) => {
      const details = cart[itemType];
      let price = 0;
      let itemSubtotal = 0;
      let isTicket = false;

      if (isFundraiser) {
        // Find the item definition to check minimum
        const ticketOption = event.tickets.find(t => t.type === itemType);
        const addOnOption = event.addOns?.find(a => a.name === itemType);
        const minDonation = ticketOption?.minimumDonation || addOnOption?.minimumDonation || 0;

        // Enforce minimum donation validation
        price = Math.max(details.donationAmount || 0, minDonation);
        itemSubtotal = price * details.quantity;
        
        if (ticketOption) isTicket = true;
      } else {
        const ticketOption = event.tickets.find(t => t.type === itemType);
        if (ticketOption) {
            price = ticketOption.price;
            isTicket = true; // Identify as a ticket
        } else {
            const addOnOption = event.addOns?.find(a => a.name === itemType);
            if (addOnOption) {
                price = addOnOption.price;
            }
        }
        itemSubtotal = price * details.quantity;
      }
      return {
        type: itemType,
        quantity: details.quantity,
        price,
        subtotal: itemSubtotal,
        isTicket // Passed for discount logic
      };
    });
    
    const calculatedSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    let discountAmount = 0;
    if (activeDiscountPercent && event.type === 'ticketed') {
        // Apply discount ONLY to tickets, NOT add-ons
        const ticketSubtotal = cartItems
            .filter(item => item.isTicket)
            .reduce((sum, item) => sum + item.subtotal, 0);
            
        discountAmount = ticketSubtotal * (activeDiscountPercent / 100);
    }
    
    const subtotalAfterDiscount = calculatedSubtotal - discountAmount;

    // Mandatory Fees: System Configured % + Fixed Fee
    const calculatedFees = subtotalAfterDiscount > 0 ? (subtotalAfterDiscount * (feesConfig.percent / 100)) + feesConfig.fixed : 0;

    // Final Total including donation (handled in component state)
    const totalToPay = subtotalAfterDiscount + calculatedFees + (platformDonation || 0);

    return { 
        items: cartItems, 
        subtotal: calculatedSubtotal, 
        discount: discountAmount, 
        mandatoryFees: calculatedFees,
        finalTotal: totalToPay 
    };
  }, [cart, event, activeDiscountPercent, platformDonation, feesConfig]);

  // Initialize default donation when modal opens or subtotal changes significantly
  useEffect(() => {
      if (isOpen && subtotal > 0 && view === 'checkout') {
          // Default donation: 10% of subtotal, rounded UP to nearest dollar
          const defaultDonation = Math.ceil((subtotal - discount) * 0.10);
          setPlatformDonation(defaultDonation);
      }
  }, [isOpen, subtotal, discount, view]);

  const handleInitiatePayment = async () => {
    if (!user) return;
    setView('loading');
    setErrorMessage('');
    
    try {
      // Create Order + PaymentIntent on Backend
      const response = await api.purchaseTicket(
          user.id, 
          event.id, 
          cart, 
          recipientUserId, 
          activePromoCode, // Use the active/validated code
          { mandatory: mandatoryFees, donation: platformDonation }
      );
      
      if (response && response.clientSecret) {
          setClientSecret(response.clientSecret);
          setCurrentOrderId(response.orderId); // Capture Order ID for manual confirmation
          setView('payment_form');
      } else {
          throw new Error("Failed to initialize payment gateway.");
      }
      
    } catch (error: any) {
      console.error("Payment init failed", error);
      setErrorMessage(error.message || "An unexpected error occurred.");
      setView('error');
    }
  };

  const handlePaymentSuccess = async () => {
      // Payment confirmed by Stripe Client Side
      try {
          // Critical: Call Manual Confirmation Endpoint to bypass blocked webhooks
          if (currentOrderId) {
              await api.confirmOrderPayment(currentOrderId);
          }
          await refreshUser(); // Fetch newly purchased tickets
          setView('success');
      } catch (e) {
          console.warn("User refresh or confirmation failed after payment", e);
          setView('success'); // Still show success as payment went through
      }
  }

  const handleClose = () => {
      onClose();
      // Reset view for next time modal opens
      setTimeout(() => {
          setView('checkout');
          setErrorMessage('');
          setClientSecret(null);
          setCurrentOrderId(null);
      }, 300);
  }

  // Helper to determine what text to show for attribution
  const attributionText = useMemo(() => {
      if (activeOwnerName) return activeOwnerName;
      if (activePromoCode) return activePromoCode;
      return null;
  }, [activeOwnerName, activePromoCode]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
        {/* 
            Container constraints:
            max-h-[calc(100vh-64px)] ensures top and bottom margins (about 32px each) are always visible 
            so the modal doesn't touch screen edges vertically.
        */}
        <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col max-h-[calc(100vh-64px)] min-h-[400px]">
            {view === 'checkout' && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow">
                        <h2 className="text-2xl font-bold text-white mb-6">Checkout Summary</h2>
                        <div className="space-y-4 mb-8 border-b border-neutral-800 pb-6">
                            {items.map(item => (
                                <div key={item.type} className="flex justify-between items-center">
                                    <div>
                                        <p className="text-lg font-medium text-white">{item.type} (x{item.quantity})</p>
                                        <p className="text-sm text-neutral-400">${item.price.toFixed(2)} {event.type === 'fundraiser' ? 'donation' : 'each'}</p>
                                    </div>
                                    <span className="text-lg font-semibold text-white">${item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="space-y-3">
                            {/* Promo Code Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Promo Code</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={promoInput}
                                        onChange={(e) => {
                                            setPromoInput(e.target.value.toUpperCase());
                                            // Reset message on type
                                            if (promoMessage) setPromoMessage(null);
                                        }}
                                        placeholder="Enter Code"
                                        className="flex-grow h-10 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                                    />
                                    <button 
                                        onClick={handleApplyPromo}
                                        disabled={validatingPromo || !promoInput}
                                        className="px-4 h-10 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors border border-neutral-700 disabled:opacity-50"
                                    >
                                        {validatingPromo ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {promoMessage && (
                                    <p className={`text-xs mt-1 ${promoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                        {promoMessage.text}
                                    </p>
                                )}
                            </div>

                            {/* Attribution Badge for Fundraisers */}
                            {event.type === 'fundraiser' && attributionText && (
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center text-purple-300 text-sm font-medium">
                                        <UsersIcon className="w-4 h-4 mr-2" />
                                        Supporting: <span className="text-white ml-1 font-bold">{attributionText}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-neutral-300">
                                <p>Subtotal</p>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            
                            {/* Discount Logic for Ticketed Events */}
                            {discount > 0 && event.type === 'ticketed' && (
                                <div className="flex justify-between items-center text-green-400">
                                    <p>Discount ({activeDiscountPercent}%)</p>
                                    <span>-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center text-neutral-300">
                                <p>Processing & Taxes</p>
                                <span>${mandatoryFees.toFixed(2)}</span>
                            </div>
                            
                            <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-800 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label htmlFor="donation-input" className="text-sm font-medium text-purple-300">
                                        Platform Donation
                                    </label>
                                    <div className="relative w-24">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                                        <input 
                                            id="donation-input"
                                            type="number" 
                                            min="0"
                                            step="1"
                                            value={platformDonation}
                                            onChange={(e) => setPlatformDonation(Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-1.5 pl-6 pr-2 text-right text-white focus:border-purple-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-500">
                                    ❤️ Evensta is a non-profit event management platform. Your donation is optional and supports our operations.
                                </p>
                            </div>
                        </div>

                        <div className="border-t-2 border-neutral-700 mt-6 pt-4 flex justify-between items-center">
                            <span className="text-lg font-semibold text-neutral-300">Total</span>
                            <span className="text-3xl font-bold text-white">${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 bg-neutral-900 border-t border-neutral-800">
                         <button onClick={handleInitiatePayment} className="w-full h-16 md:h-20 px-6 bg-purple-600 text-white text-lg font-semibold hover:bg-purple-500 transition-all duration-300 flex items-center justify-center space-x-3">
                            <ShieldCheckIcon className="w-5 h-5" />
                            <span>Proceed to Payment</span>
                        </button>
                    </div>
                </div>
            )}

            {view === 'loading' && (
                 <div className="flex flex-col justify-center items-center h-full flex-grow p-8">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-neutral-300 text-lg font-medium">Securing Checkout...</p>
                    <p className="text-neutral-500 text-sm mt-2">Preparing secure payment channel.</p>
                </div>
            )}

            {view === 'payment_form' && clientSecret && (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* The Stripe Elements container must scroll independently */}
                    <div className="overflow-y-auto custom-scrollbar flex-grow bg-neutral-900">
                        <Elements 
                            stripe={stripePromise} 
                            options={{ 
                                clientSecret, 
                                appearance: { 
                                    theme: 'night', 
                                    variables: { 
                                        colorPrimary: '#a855f7', 
                                        colorBackground: '#171717', 
                                        colorText: '#ffffff', 
                                        borderRadius: '12px' 
                                    } 
                                } 
                            }}
                        >
                            <PaymentForm 
                                total={finalTotal} 
                                userEmail={user?.email || ''} // Pass authenticated user email
                                onSuccess={handlePaymentSuccess} 
                                onError={(msg) => { setErrorMessage(msg); setView('error'); }} 
                            />
                        </Elements>
                    </div>
                </div>
            )}

            {view === 'error' && (
                <div className="flex flex-col h-full">
                    <div className="p-12 text-center flex-grow flex flex-col justify-center items-center overflow-y-auto">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Payment Failed</h2>
                        <p className="text-red-400 mb-8 bg-red-900/20 p-4 rounded-lg border border-red-900/50 text-sm">
                            {errorMessage}
                        </p>
                    </div>
                     <div className="flex flex-shrink-0">
                        <button onClick={handleClose} className="w-1/2 h-16 px-6 bg-neutral-800 text-neutral-300 font-semibold hover:bg-neutral-700 transition-all border-t border-neutral-700">
                            Cancel
                        </button>
                        <button onClick={() => setView('checkout')} className="w-1/2 h-16 px-6 bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-all">
                            Try Again
                        </button>
                     </div>
                </div>
            )}

            {view === 'success' && (
                <div className="animate-in zoom-in duration-300 flex flex-col h-full">
                    <div className="p-12 text-center flex-grow flex flex-col justify-center items-center overflow-y-auto">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <CheckCircleIcon className="w-16 h-16 text-green-400 absolute" />
                            <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping"></div>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Ticket Confirmed!</h2>
                        <p className="text-neutral-400 mb-8 text-lg">Your order was successful. You will receive an email confirmation shortly.</p>
                    </div>
                     <button onClick={handleClose} className="w-full h-16 px-6 bg-neutral-800 text-white text-lg font-semibold hover:bg-neutral-700 transition-all duration-300 border-t border-neutral-700 flex-shrink-0">
                        View Tickets
                    </button>
                </div>
            )}
        </div>
    </Modal>
  );
};

export default CheckoutModal;
