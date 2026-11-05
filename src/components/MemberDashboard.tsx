import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { MASTER_SCHEDULE, getInstallmentForMember } from '../data/scheduleData';
import { PaymentRecord } from '../types/chit';
import { 
  Wallet, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  FileText, 
  AlertCircle,
  Copy,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

interface MemberDashboardProps {
  onOpenReceipt: (payment: PaymentRecord) => void;
  onOpenLottery: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ onOpenReceipt, onOpenLottery }) => {
  const { scheme, currentUser, payments, submitPayment, language } = useChit();

  const [utrInput, setUtrInput] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!currentUser) return null;

  // Calculate stats for current member
  const currentMonthDue = getInstallmentForMember(scheme.currentMonth, currentUser);
  const currentMonthPayment = payments.find(
    p => p.memberId === currentUser.id && p.month === scheme.currentMonth
  );

  const isCurrentMonthPaid = currentMonthPayment?.status === 'approved';
  const isCurrentMonthPending = currentMonthPayment?.status === 'pending';

  // Total paid calculation
  const approvedPayments = payments.filter(
    p => p.memberId === currentUser.id && p.status === 'approved'
  );
  const totalPaidAmount = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalMonthsPaidCount = approvedPayments.length;
  const progressPercent = Math.min(100, Math.round((totalMonthsPaidCount / scheme.totalMonths) * 100));

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(scheme.organizerUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrInput.trim()) return;

    submitPayment(scheme.currentMonth, currentMonthDue, utrInput, 'UPI');
    setUtrInput('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  return (
    <div className="dashboard-content">
      {/* 1. HERO CARD: TOTAL PAID AMOUNT SO FAR (High Priority as requested) */}
      <section className="hero-total-card animate-fade">
        <div className="hero-top-row">
          <div className="hero-chip">
            <Sparkles size={16} className="text-yellow-300" />
            <span>{language === 'te' ? 'సభ్యుని ఖాతా సారాంశం' : 'Member Passbook Overview'}</span>
          </div>
          <div className="hero-member-id">
            #{currentUser.memberNo} {language === 'te' ? currentUser.nameTe : currentUser.name}
          </div>
        </div>

        <div className="hero-counter-wrap">
          <span className="hero-label">
            {language === 'te' 
              ? 'ఇప్పటివరకు మీరు చెల్లించిన మొత్తం (Total Paid So Far)' 
              : 'Total Amount You Paid So Far'}
          </span>
          <div className="hero-amount-display">
            <span className="currency-symbol">₹</span>
            <span className="amount-number">{totalPaidAmount.toLocaleString('en-IN')}</span>
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
              <Award size={18} className="text-yellow-400" />
              <span>
                {language === 'te' 
                  ? `చిట్ గ్రహీత: నెల ${currentUser.liftedMonth} లో ₹2,00,000 తీసుకున్నారు (స్థిర వాయిదా: ₹11,500)` 
                  : `Chit Lifted: Received ₹2,00,000 in Month ${currentUser.liftedMonth} (Fixed Rate: ₹11,500)`}
              </span>
            </div>
          ) : (
            <div className="status-waiting">
              <Clock size={18} className="text-emerald-400" />
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
            <span className="section-tag">
              {language === 'te' ? `నెల ${scheme.currentMonth} వాయిదా` : `Month ${scheme.currentMonth} Installment`}
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
            <span className="due-label">
              {currentUser.hasLiftedChit 
                ? (language === 'te' ? 'చిట్ తీసుకున్న వారి స్థిర వాయిదా' : 'Chit Taken Fixed Rate')
                : (language === 'te' ? 'చిట్ తీసుకోని వారి వాయిదా (Less Price)' : 'Chit Not Taken Rate')}
            </span>
            <div className="due-amount-number">
              ₹{currentMonthDue.toLocaleString('en-IN')}
            </div>
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

        {/* UPI Payment Box & UTR Submission Form */}
        {!isCurrentMonthPaid && (
          <div className="payment-submission-box">
            <h4 className="payment-box-title">
              {language === 'te' ? 'ఫోన్‌పే / గూగుల్‌పే ద్వారా చెల్లించండి:' : 'Pay via PhonePe / Google Pay / Paytm:'}
            </h4>

            {/* UPI ID Row */}
            <div className="upi-detail-card">
              <div className="upi-meta">
                <span className="upi-label">ఆర్గనైజర్ UPI ID:</span>
                <span className="upi-address font-mono">{scheme.organizerUpiId}</span>
                <span className="upi-holder">({scheme.organizerName})</span>
              </div>
              <button 
                type="button" 
                className="btn-copy-upi" 
                onClick={handleCopyUpi}
              >
                <Copy size={16} />
                <span>{copiedUpi ? (language === 'te' ? 'కాపీ చేయబడింది!' : 'Copied!') : (language === 'te' ? 'కాపీ చేయి' : 'Copy UPI')}</span>
              </button>
            </div>

            {/* 1-Click UPI Pay Link */}
            <div className="upi-quick-actions">
              <a 
                href={`upi://pay?pa=${scheme.organizerUpiId}&pn=${encodeURIComponent(scheme.name)}&am=${currentMonthDue}&cu=INR&tn=${encodeURIComponent(`Sri Varalaxmi Chits Month ${scheme.currentMonth} - ${currentUser.name}`)}`}
                className="btn-upi-instant"
              >
                <ArrowUpRight size={18} />
                <span>{language === 'te' ? 'UPI యాప్‌లో చెల్లించండి (Direct Pay ₹' + currentMonthDue.toLocaleString('en-IN') + ')' : 'Open UPI App to Pay'}</span>
              </a>
            </div>

            {/* UTR Submission Form */}
            <form onSubmit={handlePaymentSubmit} className="utr-submit-form">
              <label className="utr-label">
                {language === 'te' 
                  ? 'చెల్లించిన తర్వాత 12 అంకెల UTR / ట్రాన్సాక్షన్ ID ఇక్కడ నమోదు చేయండి:' 
                  : 'Enter 12-digit UTR / Transaction ID after payment:'}
              </label>
              <div className="utr-input-group">
                <input
                  type="text"
                  placeholder="e.g. 523412349876 or UPI Ref"
                  className="form-input"
                  value={utrInput}
                  onChange={e => setUtrInput(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">
                  {language === 'te' ? 'సమర్పించండి' : 'Submit UTR'}
                </button>
              </div>
              {submitSuccess && (
                <div className="success-toast">
                  <CheckCircle size={16} />
                  <span>{language === 'te' ? 'మీ చెల్లింపు వివరాలు నిర్వాహకునికి పంపబడ్డాయి!' : 'Payment submitted successfully for verification!'}</span>
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
              <span>{language === 'te' ? 'ఈ నెల అధికారిక రసీదును చూడండి (View Receipt)' : 'View Month 3 Official Receipt'}</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. LUCKY DRAW BANNER FOR MEMBERS */}
      <section className="lottery-feature-banner">
        <div className="lottery-banner-text">
          <span className="lottery-tag">🎲 లక్కీ డ్రా ఫీచర్</span>
          <h4>
            {language === 'te' 
              ? 'ఈ నెల ఎవరూ చిట్టీ ఎత్తలేదా? లక్కీ డ్రా అందుబాటులో ఉంది!' 
              : 'No bids this month? Digital Lucky Draw is available!'}
          </h4>
          <p>
            {language === 'te'
              ? 'గతంలో చిట్ ఎత్తినవారు మినహాయించబడతారు. మిగిలిన సభ్యుల పేర్లతో పారదర్శక లక్కీ డ్రా జరుగుతుంది.'
              : 'Members who lifted previously are excluded. Remaining members get fair digital lottery draw.'}
          </p>
        </div>
        <button type="button" className="btn-open-lottery" onClick={onOpenLottery}>
          <span>{language === 'te' ? 'లక్కీ డ్రా తెరవండి' : 'Open Lucky Draw'}</span>
          <ChevronRight size={18} />
        </button>
      </section>

      {/* 4. MASTER 20-MONTH SCHEDULE (Strictly 4 Columns as requested by user) */}
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
                <th className="th-month">{language === 'te' ? 'నెల (నెం)' : 'Month'}</th>
                <th className="th-val">{language === 'te' ? 'చిట్ విలువ' : 'Chit Value'}</th>
                <th className="th-nottaken">{language === 'te' ? 'చిట్ తీసుకోని వారి వాయిదా (Less Price)' : 'Chit Not Taken (Less Price)'}</th>
                <th className="th-taken">{language === 'te' ? 'చిట్ తీసుకున్న వారి స్థిర వాయిదా (Fixed Rate)' : 'Chit Taken (Fixed Rate)'}</th>
              </tr>
            </thead>
            <tbody>
              {MASTER_SCHEDULE.map(item => {
                const isCurrent = item.month === scheme.currentMonth;
                const isPast = item.month < scheme.currentMonth;
                return (
                  <tr key={item.month} className={`schedule-row ${isCurrent ? 'current-active-row' : ''} ${isPast ? 'past-row' : ''}`}>
                    <td className="td-month">
                      <span className="month-badge">
                        {item.month}
                        {isCurrent && <span className="active-dot-indicator" title="ప్రస్తుత నెల"></span>}
                      </span>
                    </td>
                    <td className="td-val font-semibold">
                      ₹{item.chitValue.toLocaleString('en-IN')}
                    </td>
                    <td className="td-nottaken font-bold text-amber-400">
                      {item.notTakenAmount === 0 ? '₹0' : `₹${item.notTakenAmount.toLocaleString('en-IN')}`}
                    </td>
                    <td className="td-taken font-bold text-emerald-400">
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
                    <strong className="receipt-card-month">నెల {p.month} వాయిదా</strong>
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
                    రసీదు చూడండి
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
