import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { MASTER_SCHEDULE, getInstallmentForMember, getMonthDisplayName, MONTH_CALENDAR_NAMES } from '../data/scheduleData';
import { PaymentRecord } from '../types/chit';

// Compact Short Month Names for 100% Mobile Table Fit
const MONTH_SHORT_NAMES: { [key: number]: { en: string; te: string } } = {
  1: { en: "Dec '26", te: "డిసెం '26" },
  2: { en: "Jan '27", te: "జన '27" },
  3: { en: "Feb '27", te: "ఫిబ్ర '27" },
  4: { en: "Mar '27", te: "మార్చి '27" },
  5: { en: "Apr '27", te: "ఏప్రి '27" },
  6: { en: "May '27", te: "మే '27" },
  7: { en: "Jun '27", te: "జూన్ '27" },
  8: { en: "Jul '27", te: "జూలై '27" },
  9: { en: "Aug '27", te: "ఆగ '27" },
  10: { en: "Sep '27", te: "సెప్టెం '27" },
  11: { en: "Oct '27", te: "అక్టో '27" },
  12: { en: "Nov '27", te: "నవం '27" },
  13: { en: "Dec '27", te: "డిసెం '27" },
  14: { en: "Jan '28", te: "జన '28" },
  15: { en: "Feb '28", te: "ఫిబ్ర '28" },
  16: { en: "Mar '28", te: "మార్చి '28" },
  17: { en: "Apr '28", te: "ఏప్రి '28" },
  18: { en: "May '28", te: "మే '28" },
  19: { en: "Jun '28", te: "జూన్ '28" },
  20: { en: "Jul '28", te: "జూలై '28" }
};
import { 
  Wallet, 
  Calendar, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  FileText, 
  AlertCircle,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Receipt,
  Upload,
  Image as ImageIcon,
  Gavel,
  Trophy,
  Banknote,
  Smartphone,
  CreditCard
} from 'lucide-react';

interface MemberDashboardProps {
  onOpenReceipt: (payment: PaymentRecord) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ onOpenReceipt }) => {
  const { scheme, activeGroup, currentUser, groupPayments, groupLotteryHistory, groupLiftings, submitPayment, language, showToast } = useChit();

  const [paymentMode, setPaymentMode] = useState<'Cash' | 'PhonePe' | 'UPI'>('Cash');
  const [utrInput, setUtrInput] = useState('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!currentUser) return null;

  const currentGroup = activeGroup || scheme;

  // Calculate stats for current member
  const currentMonthDue = getInstallmentForMember(currentGroup.currentMonth, currentUser);
  const currentMonthPayment = groupPayments.find(
    p => p.memberId === currentUser.id && p.month === currentGroup.currentMonth
  );

  const isCurrentMonthPaid = currentMonthPayment?.status === 'approved';
  const isCurrentMonthPending = currentMonthPayment?.status === 'pending';

  // Total paid calculation
  const approvedPayments = groupPayments.filter(
    p => p.memberId === currentUser.id && p.status === 'approved'
  );
  const totalPaidAmount = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalMonthsPaidCount = approvedPayments.length;
  const progressPercent = Math.min(100, Math.round((totalMonthsPaidCount / currentGroup.totalMonths) * 100));
  const remainingMonthsCount = Math.max(0, currentGroup.totalMonths - totalMonthsPaidCount);
  const remainingEstimatedBalance = Math.max(0, currentGroup.totalValue - totalPaidAmount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAmount = amountInput !== '' ? Number(amountInput) : currentMonthDue;
    if (!finalAmount || finalAmount <= 0) return;

    const refString = utrInput.trim() || (paymentMode === 'Cash' ? 'Cash' : paymentMode);
    submitPayment(currentGroup.currentMonth, finalAmount, refString, paymentMode, proofImage || undefined);
    setUtrInput('');
    setProofImage(null);
    setSubmitSuccess(true);
    showToast(
      language === 'te' ? '✅ పేమెంట్ సమర్పించబడింది!' : '✅ Payment Submitted!',
      language === 'te'
        ? `నెల ${currentGroup.currentMonth} వాయిదా ₹${finalAmount.toLocaleString('en-IN')} వివరాలు ఆర్గనైజర్ శివ గారికి పంపబడ్డాయి.`
        : `Month ${currentGroup.currentMonth} installment ₹${finalAmount.toLocaleString('en-IN')} sent to Organizer Siva for approval.`,
      'payment'
    );
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  return (
    <div className="dashboard-content">
      {/* 1. UNIFIED LUXURY MEMBER PASSBOOK HERO */}
      <section className="hero-total-card animate-fade">
        <div className="hero-top-row">
          <div className="hero-chip">
            <Sparkles size={15} className="text-yellow-300" />
            <span>{language === 'te' ? 'సభ్యుని ఖాతా పుస్తకం' : 'Member Passbook'}</span>
          </div>
          <div className="hero-member-id">
            #{currentUser.memberNo} {language === 'te' ? currentUser.nameTe : currentUser.name}
          </div>
        </div>

        <div className="hero-counter-wrap">
          <span className="hero-label">
            {language === 'te' 
              ? 'ఇప్పటివరకు మీరు చెల్లించిన మొత్తం' 
              : 'Total Amount You Paid So Far'}
          </span>
          <div className="hero-amount-display">
            <span className="currency-symbol">₹</span>
            <span className="amount-number">{totalPaidAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* 3 Compact Inline Stats */}
        <div className="hero-stats-row-mini">
          <div className="hero-mini-stat">
            <span className="mini-stat-label">{language === 'te' ? 'మొత్తం పథకం' : 'Chit Scheme'}</span>
            <span className="mini-stat-val font-mono">₹{currentGroup.totalValue.toLocaleString('en-IN')}</span>
          </div>
          <div className="hero-mini-stat">
            <span className="mini-stat-label">{language === 'te' ? 'చెల్లించినవి' : 'Installments'}</span>
            <span className="mini-stat-val font-mono text-emerald-400">{totalMonthsPaidCount} / 20</span>
          </div>
          <div className="hero-mini-stat">
            <span className="mini-stat-label">{language === 'te' ? 'మిగిలినవి' : 'Remaining'}</span>
            <span className="mini-stat-val font-mono text-amber-300">{remainingMonthsCount} {language === 'te' ? 'నెలలు' : 'Mos'}</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="hero-progress-section">
          <div className="progress-info-row">
            <span>
              {language === 'te' 
                ? `పూర్తయిన వాయిదాలు: ${totalMonthsPaidCount} / 20 నెలలు` 
                : `Installments Completed: ${totalMonthsPaidCount} of 20 Months`}
            </span>
            <span className="progress-percentage">{progressPercent}%</span>
          </div>
          <div className="progress-track-bar">
            <div className="progress-fill-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* Chit Status Badge */}
        <div className="hero-chit-status-pill">
          {currentUser.hasLiftedChit ? (
            <div className="status-lifted">
              <Award size={16} className="text-yellow-400 shrink-0" />
              <span>
                {language === 'te' 
                  ? `చిట్ గ్రహీత: నెల ${currentUser.liftedMonth} లో ₹2,00,000 తీసుకున్నారు (స్థిర వాయిదా: ₹11,500)` 
                  : `Chit Lifted: Received ₹2,00,000 in Month ${currentUser.liftedMonth} (Fixed Rate: ₹11,500)`}
              </span>
            </div>
          ) : (
            <div className="status-waiting">
              <Clock size={16} className="text-emerald-400 shrink-0" />
              <span>
                {language === 'te' 
                  ? 'చిట్ ఇంకా తీసుకోలేదు: ₹2,00,000 పొందడానికి మరియు లక్కీ డ్రాకు మీరు అర్హులు' 
                  : 'Chit Not Yet Lifted: Eligible to Lift ₹2,00,000 or Win Lucky Draw'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 2. CURRENT MONTH DUE & UPI ACTION */}
      <section className="current-month-card">
        <div className="month-card-header">
          <div>
            <span className="section-tag font-bold text-amber-400">
              {getMonthDisplayName(currentGroup.currentMonth, language)}
            </span>
            <h3 className="section-heading">
              {language === 'te' ? 'ఈ నెల చెల్లించవలసిన సొమ్ము' : 'Current Month Due'}
            </h3>
          </div>
          <div className="due-date-pill">
            <Calendar size={15} />
            <span>{language === 'te' ? 'తేదీ 10 లోపు చెల్లించవలెను' : 'Pay Before 10th'}</span>
          </div>
        </div>

        <div className="due-amount-hero">
          <div className="due-figure-col">
            <div className="due-amount-number">
              ₹{currentMonthDue.toLocaleString('en-IN')}
            </div>
            <span className="due-label">
              {currentUser.hasLiftedChit && currentUser.liftedMonth !== undefined && currentGroup.currentMonth > currentUser.liftedMonth
                ? (language === 'te' ? 'స్థిర వాయిదా (Fixed Rate)' : 'Fixed Installment Rate')
                : (language === 'te' ? 'ఈ నెల వాయిదా మొత్తం' : 'Monthly Due Installment')}
            </span>
          </div>

          <div className="due-status-col">
            {isCurrentMonthPaid ? (
              <span className="badge-paid">
                <CheckCircle size={18} />
                <span>{language === 'te' ? 'చెల్లించబడింది' : 'Paid & Approved'}</span>
              </span>
            ) : isCurrentMonthPending ? (
              <span className="badge-pending">
                <Clock size={18} />
                <span>{language === 'te' ? 'పరిశీలనలో ఉంది' : 'Verification Pending'}</span>
              </span>
            ) : (
              <span className="badge-due">
                <AlertCircle size={18} />
                <span>{language === 'te' ? 'బాకీ ఉంది' : 'Payment Due'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Simple & Clean Payment Submission as requested by user */}
        {!isCurrentMonthPaid && (
          <div className="payment-submission-box luxury-card border border-amber-500/20 bg-gray-950/70 p-4 rounded-xl mt-4">
            <h4 className="payment-box-title font-bold text-white text-sm mb-3 flex items-center gap-2">
              <CreditCard size={17} className="text-amber-400" />
              <span>{language === 'te' ? 'వాయిదా చెల్లింపు నమోదు (Record Payment)' : 'Record Monthly Payment'}</span>
            </h4>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              {/* 1. Payment Method Pills: Cash / PhonePe & GPay / Other UPI */}
              <div>
                <label className="text-xs text-gray-300 font-semibold mb-1.5 block">
                  {language === 'te' ? 'చెల్లింపు విధానం (Payment Mode):' : 'Select Payment Mode:'}
                </label>
                <div className="payment-mode-selector-grid">
                  <button
                    type="button"
                    className={`payment-mode-card-btn cash ${paymentMode === 'Cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('Cash')}
                  >
                    <div className="mode-icon-circle">
                      <Banknote size={18} className="text-amber-400" />
                    </div>
                    <span>{language === 'te' ? 'నగదు (Cash)' : 'Cash'}</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-mode-card-btn phonepe ${paymentMode === 'PhonePe' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('PhonePe')}
                  >
                    <div className="mode-icon-circle">
                      <Smartphone size={18} className="text-purple-400" />
                    </div>
                    <span>PhonePe / GPay</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-mode-card-btn upi ${paymentMode === 'UPI' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('UPI')}
                  >
                    <div className="mode-icon-circle">
                      <CreditCard size={18} className="text-emerald-400" />
                    </div>
                    <span>{language === 'te' ? 'ఇతర UPI' : 'Other UPI'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Amount Input */}
              <div>
                <label className="text-xs text-gray-300 font-semibold mb-1 block">
                  {language === 'te' ? 'చెల్లిస్తున్న మొత్తం (Amount in ₹):' : 'Amount Being Paid (₹):'}
                </label>
                <div className="input-group relative flex items-center">
                  <span className="input-prefix px-3 py-2 bg-gray-900 text-amber-400 font-bold border border-r-0 border-gray-800 rounded-l-lg">₹</span>
                  <input
                    type="number"
                    className="form-input text-lg font-bold text-amber-300 font-mono w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-r-lg focus:outline-none focus:border-amber-500"
                    value={amountInput !== '' ? amountInput : currentMonthDue}
                    onChange={e => setAmountInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 3. Optional Reference / Note (NOT strictly required for Cash) */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {paymentMode === 'Cash'
                    ? (language === 'te' ? 'నోట్ / రిఫరెన్స్ (ఐచ్ఛికం):' : 'Notes / Remarks (Optional):')
                    : (language === 'te' ? 'ట్రాన్సాక్షన్ ID / UTR నంబర్ (ఐచ్ఛికం):' : 'Transaction ID / UTR Ref (Optional):')}
                </label>
                <input
                  type="text"
                  placeholder={
                    paymentMode === 'Cash'
                      ? (language === 'te' ? 'ఉదా: శివ గారికి నేరుగా ఇచ్చాను' : 'e.g. Paid in cash directly to Siva')
                      : (language === 'te' ? 'ఉదా: UPI ట్రాన్సాక్షన్ నంబర్ లేదా రిఫరెన్స్' : 'e.g. UPI Ref / Transaction ID')
                  }
                  className="form-input text-xs w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-200"
                  value={utrInput}
                  onChange={e => setUtrInput(e.target.value)}
                />
              </div>

              {/* 4. Single Big Submit Button */}
              <button
                type="submit"
                className="btn-primary w-full luxury-btn py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 size={18} />
                <span>
                  {language === 'te'
                    ? 'చెల్లింపు సమర్పించండి (Submit Payment)'
                    : 'Submit Payment for Approval'}
                </span>
              </button>

              {submitSuccess && (
                <div className="success-toast mt-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-lg flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>
                    {language === 'te'
                      ? '✅ పేమెంట్ వివరాలు ఆర్గనైజర్ శివ గారికి పంపబడ్డాయి! పరిశీలించి ఆమోదించబడుతుంది.'
                      : '✅ Payment details sent to Organizer Siva! Awaiting approval.'}
                  </span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* View Receipt button if paid */}
        {isCurrentMonthPaid && currentMonthPayment && (
          <div className="paid-receipt-action">
            <button 
              type="button" 
              className="btn-view-receipt"
              onClick={() => onOpenReceipt(currentMonthPayment)}
            >
              <Receipt size={18} />
              <span>{language === 'te' ? `నెల ${scheme.currentMonth} అధికారిక రసీదును చూడండి` : `View Month ${scheme.currentMonth} Official Receipt`}</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. MASTER 20-MONTH SCHEDULE (Official 4-Column Schedule) */}
      <section className="schedule-section">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">
              {language === 'te' ? 'ప్రధాన 20 నెలల పట్టిక (Master Schedule)' : 'Master 20-Month Schedule'}
            </h3>
            <p className="section-subtitle">
              {language === 'te' 
                ? 'మొత్తం చిట్ విలువ: ₹2,00,000 • 20 నెలలు • ప్రతి నెల 10వ తేదీ లోపు చెల్లించవలెను' 
                : 'Total Chit Value: ₹2,00,000 • 20 Months • Pay before 10th of every month'}
            </p>
          </div>
        </div>

        {/* 4-COLUMN TABLE ONLY */}
        <div className="table-responsive-container">
          <table className="master-table">
            <thead>
              <tr>
                <th className="th-month">{language === 'te' ? 'నెల' : 'Month'}</th>
                <th className="th-val">{language === 'te' ? 'చిట్ విలువ' : 'Chit Value'}</th>
                <th className="th-nottaken">
                  <div className="th-stacked-header">
                    <span>{language === 'te' ? 'వాయిదా' : 'Installment'}</span>
                    <span className="th-sub-note">{language === 'te' ? '(తీసుకోని వారు)' : '(Less Price)'}</span>
                  </div>
                </th>
                <th className="th-taken">
                  <div className="th-stacked-header">
                    <span>{language === 'te' ? 'స్థిర వాయిదా' : 'Fixed Rate'}</span>
                    <span className="th-sub-note">{language === 'te' ? '(ఎత్తిన వారు)' : '(Chit Taken)'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {MASTER_SCHEDULE.map(item => {
                const isCurrent = item.month === scheme.currentMonth;
                const isPast = item.month < scheme.currentMonth;
                return (
                  <tr key={item.month} className={`schedule-row ${isCurrent ? 'current-active-row' : ''} ${isPast ? 'past-row' : ''}`}>
                    <td className="td-month">
                      <div className="sched-cell-stack">
                        <div className="sched-month-top">
                          <span className="sched-pill-no">#{item.month}</span>
                          {isCurrent && (
                            <span className="sched-current-dot-pill" title={language === 'te' ? 'ప్రస్తుత నెల' : 'Current Month'}>
                              {language === 'te' ? 'ప్రస్తుతం' : 'Active'}
                            </span>
                          )}
                        </div>
                        <span className="sched-month-subtext">
                          {MONTH_SHORT_NAMES[item.month]
                            ? (language === 'te' ? MONTH_SHORT_NAMES[item.month].te : MONTH_SHORT_NAMES[item.month].en)
                            : `M${item.month}`}
                        </span>
                      </div>
                    </td>
                    <td className="td-val font-mono font-bold text-gray-200">
                      ₹{item.chitValue.toLocaleString('en-IN')}
                    </td>
                    <td className="td-nottaken font-mono font-bold text-amber-400">
                      {item.notTakenAmount === 0 ? '₹0' : `₹${item.notTakenAmount.toLocaleString('en-IN')}`}
                    </td>
                    <td className="td-taken font-mono font-bold text-emerald-400">
                      ₹{item.takenAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. MY PAST RECEIPTS & PASSBOOK */}
      <section className="receipts-history-section">
        <h3 className="section-title">
          {language === 'te' ? 'నా చెల్లింపుల రసీదులు (Digital Receipts)' : 'My Payment Receipts'}
        </h3>
        <div className="receipts-grid">
          {approvedPayments.length === 0 ? (
            <p className="text-gray-400 py-3">{language === 'te' ? 'ఇంకా ఎటువంటి చెల్లింపులు ఆమోదించబడలేదు' : 'No approved payments yet'}</p>
          ) : (
            approvedPayments.map(p => (
              <div key={p.id} className="receipt-quick-card">
                <div className="receipt-card-left">
                  <div className="receipt-icon-box">
                    <FileText size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <strong className="receipt-card-month">
                      {language === 'te' ? `నెల ${p.month} వాయిదా` : `Month ${p.month} Installment`}
                    </strong>
                    <span className="receipt-card-date">{p.date} • {p.receiptNo}</span>
                  </div>
                </div>
                <div className="receipt-card-right">
                  <span className="receipt-card-amount">₹{p.amount.toLocaleString('en-IN')}</span>
                  <button 
                    type="button" 
                    className="btn-sm-receipt"
                    onClick={() => onOpenReceipt(p)}
                  >
                    {language === 'te' ? 'రసీదు చూడండి' : 'View Receipt'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
