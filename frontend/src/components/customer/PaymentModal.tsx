import React, { useState } from 'react';
import { 
  CreditCard, QrCode, Smartphone, Building2, Banknote, ShieldCheck, 
  CheckCircle2, Sparkles, X, Heart, ArrowRight, Loader2, Copy, Check
} from 'lucide-react';
import { api } from '../../services/api';

interface PaymentModalProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

type PaymentTab = 'UPI' | 'CARD' | 'NETBANKING' | 'CASH';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  orderNumber,
  totalAmount,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('UPI');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

  // Form states
  const [customUpiId, setCustomUpiId] = useState('');
  const [selectedApp, setSelectedApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM'>('GPAY');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8912');
  const [cardHolder, setCardHolder] = useState('GUEST PATRON');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('•••');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const grandTotal = totalAmount + tipAmount;
  const mockUpiId = 'tejas.dining@icici';

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(mockUpiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      const txId = `TEJ-TXN-${Date.now().toString().slice(-6)}`;
      await api.payOrder(orderId, {
        payment_method: activeTab,
        transaction_id: activeTab !== 'CASH' ? txId : undefined,
        tip_amount: tipAmount > 0 ? tipAmount : undefined,
      });

      // Simulate instantaneous bank gateway confirmation
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        setTimeout(() => {
          onPaymentSuccess();
        }, 1800);
      }, 900);
    } catch (err: any) {
      alert(err.message || 'Payment could not be completed.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-gradient-to-b from-slate-900 via-charcoal-900 to-black text-white rounded-t-3xl sm:rounded-3xl border border-amber-500/20 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-amber-500/15 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Secure Digital Settlement</span>
            <h3 className="font-serif font-bold text-lg text-white">Bill Checkout • #{orderNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 no-scrollbar">
          {/* Bill Summary Amount Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600/20 via-yellow-600/10 to-amber-500/20 border border-amber-500/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-200/80">Total Authoritative Payable</p>
              <h2 className="text-2xl font-bold font-sans text-amber-400 mt-0.5">₹{grandTotal.toFixed(2)}</h2>
              {tipAmount > 0 && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>Includes ₹{tipAmount} Floor Server Tip</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-Bit Encrypted</span>
              </span>
            </div>
          </div>

          {/* Tip Floor Server Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Appreciate Chef & Waiter Service (Optional Tip)</span>
              {tipAmount > 0 && <span className="text-amber-400 font-bold">+₹{tipAmount}</span>}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 30, 50, 100].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setTipAmount(amount)}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    tipAmount === amount
                      ? 'bg-amber-600 text-white shadow-soft ring-2 ring-amber-400/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  {amount === 0 ? 'No Tip' : `₹${amount}`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('UPI')}
                className={`py-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'UPI' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI & QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CARD')}
                className={`py-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'CARD' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('NETBANKING')}
                className={`py-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'NETBANKING' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>NetBank</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CASH')}
                className={`py-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'CASH' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash/Desk</span>
              </button>
            </div>
          </div>

          {/* TAB 1: UPI & QR */}
          {activeTab === 'UPI' && (
            <div className="space-y-3 pt-1">
              {/* Dynamic QR Display */}
              <div className="p-4 rounded-2xl bg-white text-slate-900 text-center flex flex-col items-center shadow-soft">
                <div className="relative p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {/* Decorative QR Pattern */}
                  <div className="w-36 h-36 bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden p-2">
                    <QrCode className="w-full h-full text-white" />
                    <div className="absolute inset-x-2 top-0 h-1 bg-amber-400 animate-pulse"></div>
                  </div>
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-bold text-slate-800">Scan using any UPI App</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Google Pay • PhonePe • Paytm • BHIM</p>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-mono">
                  <span>{mockUpiId}</span>
                  <button onClick={handleCopyUpi} className="text-amber-700 hover:text-amber-900 font-sans font-bold">
                    {upiCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Direct UPI App Buttons */}
              <div>
                <p className="text-[11px] text-slate-400 font-semibold mb-1.5 uppercase">Or Pay Directly with App</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'GPAY', label: 'GPay', color: 'border-blue-500/40 text-blue-400' },
                    { key: 'PHONEPE', label: 'PhonePe', color: 'border-purple-500/40 text-purple-400' },
                    { key: 'PAYTM', label: 'Paytm', color: 'border-sky-500/40 text-sky-400' },
                    { key: 'BHIM', label: 'BHIM UPI', color: 'border-emerald-500/40 text-emerald-400' },
                  ].map((app) => (
                    <button
                      key={app.key}
                      type="button"
                      onClick={() => setSelectedApp(app.key as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        selectedApp === app.key
                          ? 'bg-slate-800 ring-2 ring-amber-500 text-white'
                          : `bg-slate-900/60 ${app.color} hover:bg-slate-800`
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom UPI VPA */}
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">Enter your UPI ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank"
                  value={customUpiId}
                  onChange={(e) => setCustomUpiId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800/90 text-white border border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CREDIT / DEBIT CARD */}
          {activeTab === 'CARD' && (
            <div className="space-y-3 pt-1">
              {/* Virtual Luxury Card Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-900 to-black border border-amber-500/30 text-white shadow-soft relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="font-serif italic text-xs tracking-wider text-amber-200">Tejas Priority Card</span>
                  <span className="font-mono text-xs font-bold text-amber-400">VISA / RUPAY</span>
                </div>
                <div className="my-3">
                  <span className="text-[10px] text-amber-300 font-mono tracking-widest uppercase">Card Number</span>
                  <p className="font-mono text-sm tracking-widest font-bold text-white mt-0.5">{cardNumber}</p>
                </div>
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-[9px] text-amber-300 uppercase">Card Holder</span>
                    <p className="font-semibold text-white uppercase">{cardHolder}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-amber-300 uppercase">Expires</span>
                    <p className="font-mono font-bold">{cardExpiry}</p>
                  </div>
                </div>
              </div>

              {/* Card Inputs */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Full Name as on card"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-800/90 text-white border border-slate-700 focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-800/90 text-white border border-slate-700 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="3 or 4 digits"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-800/90 text-white border border-slate-700 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NETBANKING */}
          {activeTab === 'NETBANKING' && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs text-slate-300 font-semibold">Select Your Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National'].map(
                  (bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                        selectedBank === bank
                          ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {bank}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PAY AT COUNTER / CASH */}
          {activeTab === 'CASH' && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Banknote className="w-5 h-5" />
                <span>Pay at Counter / Table Cash</span>
              </div>
              <p className="leading-relaxed">
                Your order is registered with our billing terminal. A server will visit your table with the physical folio and cash/POS machine upon finishing your meal.
              </p>
            </div>
          )}
        </div>

        {/* Action Button Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-amber-500/15 flex-shrink-0">
          {isSuccess ? (
            <div className="py-3 px-4 rounded-2xl bg-emerald-600 text-white font-bold text-center flex items-center justify-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5" />
              <span>Payment Authorized • Redirecting...</span>
            </div>
          ) : (
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-glow-gold flex items-center justify-center space-x-2 transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing ₹{grandTotal.toFixed(2)}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Pay ₹{grandTotal.toFixed(2)} with {activeTab}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
