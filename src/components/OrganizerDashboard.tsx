import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { MASTER_SCHEDULE, getInstallmentForMember } from '../data/scheduleData';
import { PaymentRecord, Member } from '../types/chit';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Dices, 
  Share2, 
  ChevronRight, 
  Search, 
  Calendar,
  Sparkles,
  Award,
  CreditCard,
  FileCheck,
  Send
} from 'lucide-react';

interface OrganizerDashboardProps {
  onOpenReceipt: (payment: PaymentRecord, member?: Member) => void;
  onOpenLottery: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onOpenReceipt, onOpenLottery }) => {
  const { 
    scheme, 
    members, 
    payments, 
    approvePayment, 
    rejectPayment, 
    setCurrentMonth,
    switchUser, 
    language 
  } = useChit();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lifted' | 'eligible'>('all');

  // Metrics
  const approvedPayments = payments.filter(p => p.status === 'approved');
  const totalPoolCollected = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentMonthApproved = approvedPayments.filter(p => p.month === scheme.currentMonth);
  const currentMonthPending = payments.filter(p => p.month === scheme.currentMonth && p.status === 'pending');
  
  const currentMonthCollectedAmount = currentMonthApproved.reduce((sum, p) => sum + p.amount, 0);
  const pendingApprovalsCount = currentMonthPending.length;

  const liftedMembersCount = members.filter(m => m.hasLiftedChit).length;
  const eligibleMembersCount = members.filter(m => !m.hasLiftedChit).length;

  // Filtered members
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameTe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.memberNo.toString().includes(searchTerm);

    if (!matchesSearch) return false;
    if (filterStatus === 'lifted') return m.hasLiftedChit;
    if (filterStatus === 'eligible') return !m.hasLiftedChit;
    return true;
  });

  const handleSendReminder = (member: Member) => {
    const dueAmount = getInstallmentForMember(scheme.currentMonth, member);
    const message = encodeURIComponent(
      `నమస్కారం ${member.nameTe} గారు,\n` +
      `శ్రీ వరలక్ష్మి చిట్స్ (₹2,00,000 పథకం) నెల ${scheme.currentMonth} వాయిదా సొమ్ము ₹${dueAmount.toLocaleString('en-IN')} తేదీ 10 లోపు చెల్లించవలసిందిగా కోరుతున్నాము.\n` +
      `UPI ID: ${scheme.organizerUpiId} (${scheme.organizerName})\nధన్యవాదాలు!`
    );
    window.open(`https://wa.me/91${member.phone}?text=${message}`, '_blank');
  };

  const handleBroadcastReminders = () => {
    alert(language === 'te' 
      ? 'ఈ నెల ఇంకా చెల్లించని సభ్యులందరికీ WhatsApp రిమైండర్ సందేశాలు రూపొందించబడ్డాయి.' 
      : 'Reminder messages generated for all unpaid members.');
  };

  return (
    <div className="dashboard-content">
      {/* 1. ORGANIZER TOP HERO BANNER */}
      <section className="organizer-hero-banner animate-fade">
        <div className="org-hero-top">
          <div className="hero-chip organizer">
            <Sparkles size={16} className="text-yellow-300" />
            <span>{language === 'te' ? 'నిర్వాహకుని నియంత్రణ కేంద్రం' : 'Organizer Control Center'}</span>
          </div>
          <div className="month-picker-pill">
            <Calendar size={15} />
            <span>{language === 'te' ? 'ప్రస్తుత నెల:' : 'Active Month:'}</span>
            <select 
              value={scheme.currentMonth} 
              onChange={e => setCurrentMonth(parseInt(e.target.value, 10))}
              className="month-select"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>నెల {m} / Month {m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="org-metrics-grid">
          {/* Metric 1: Total Pool Collected So Far */}
          <div className="metric-box gold">
            <span className="metric-label">
              {language === 'te' ? 'మొత్తం వసూలైన సొమ్ము' : 'Total Pool Collected'}
            </span>
            <div className="metric-value">
              <span className="cur">₹</span>{totalPoolCollected.toLocaleString('en-IN')}
            </div>
            <span className="metric-sub">
              {language === 'te' ? `మొత్తం 20 మంది సభ్యుల నుండి` : `Cumulative from 20 Members`}
            </span>
          </div>

          {/* Metric 2: Current Month Collections */}
          <div className="metric-box emerald">
            <span className="metric-label">
              {language === 'te' ? `నెల ${scheme.currentMonth} కలెక్షన్` : `Month ${scheme.currentMonth} Collection`}
            </span>
            <div className="metric-value">
              <span className="cur">₹</span>{currentMonthCollectedAmount.toLocaleString('en-IN')}
            </div>
            <span className="metric-sub">
              {language === 'te' 
                ? `${currentMonthApproved.length} / 20 మంది చెల్లించారు` 
                : `${currentMonthApproved.length} of 20 Members Paid`}
            </span>
          </div>

          {/* Metric 3: Chit Lifted vs Remaining Eligible */}
          <div className="metric-box blue">
            <span className="metric-label">
              {language === 'te' ? 'చిట్ గ్రహీతలు / మిగిలినవారు' : 'Chit Lifted / Remaining'}
            </span>
            <div className="metric-value">
              {liftedMembersCount} <small className="text-sm font-normal">/ {eligibleMembersCount}</small>
            </div>
            <span className="metric-sub">
              {language === 'te' 
                ? `${eligibleMembersCount} మంది లక్కీ డ్రాకు అర్హులు` 
                : `${eligibleMembersCount} eligible for Lucky Draw`}
            </span>
          </div>
        </div>

        {/* Quick Action Tools Bar */}
        <div className="org-tools-bar">
          <button 
            type="button" 
            className="btn-tool-lottery"
            onClick={onOpenLottery}
          >
            <Dices size={20} />
            <span>
              {language === 'te' 
                ? `🎰 నెల ${scheme.currentMonth} లక్కీ డ్రా నిర్వహించండి` 
                : `🎰 Launch Month ${scheme.currentMonth} Lucky Draw`}
            </span>
          </button>

          <button 
            type="button" 
            className="btn-tool-whatsapp"
            onClick={handleBroadcastReminders}
          >
            <Send size={18} />
            <span>{language === 'te' ? 'బాకీ ఉన్నవారికి WhatsApp రిమైండర్' : 'Send WhatsApp Reminders'}</span>
          </button>
        </div>
      </section>

      {/* 2. PENDING APPROVALS QUEUE */}
      {currentMonthPending.length > 0 && (
        <section className="pending-queue-section animate-bounce-short">
          <div className="pending-queue-header">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-amber-400" />
              <h3 className="section-title text-amber-300">
                {language === 'te' ? `ఆమోదం కోసం వేచి ఉన్న చెల్లింపులు (${currentMonthPending.length})` : `Pending Verifications (${currentMonthPending.length})`}
              </h3>
            </div>
            <span className="pending-badge">Pending Verification</span>
          </div>

          <div className="pending-cards-grid">
            {currentMonthPending.map(p => {
              const mem = members.find(m => m.id === p.memberId);
              return (
                <div key={p.id} className="pending-review-card">
                  <div className="pending-card-top">
                    <div>
                      <strong className="pending-member-name">{mem?.nameTe || p.memberName}</strong>
                      <span className="pending-member-phone">#{mem?.memberNo} • {mem?.phone}</span>
                    </div>
                    <div className="pending-amount">₹{p.amount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="pending-card-mid">
                    <span className="pending-utr font-mono">UTR: {p.utr || 'Cash'}</span>
                    <span className="pending-date">{p.date} • నెల {p.month}</span>
                  </div>
                  <div className="pending-card-actions">
                    <button 
                      type="button" 
                      className="btn-approve"
                      onClick={() => approvePayment(p.id)}
                    >
                      <CheckCircle2 size={16} />
                      <span>{language === 'te' ? 'ఆమోదించు (Approve)' : 'Approve'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn-reject"
                      onClick={() => rejectPayment(p.id)}
                    >
                      <span>{language === 'te' ? 'తిరస్కరించు' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. MEMBER LEDGER & TOTAL PAID TABLE */}
      <section className="member-ledger-section">
        <div className="ledger-header-row">
          <div>
            <h3 className="section-title">
              {language === 'te' ? '20 మంది సభ్యుల పూర్తి లెడ్జర్ (Member Directory)' : 'All 20 Members Directory'}
            </h3>
            <p className="section-subtitle">
              {language === 'te' 
                ? 'సభ్యుల చెల్లింపు వివరాలు, ఇప్పటివరకు చెల్లించిన మొత్తం మరియు లక్కీ డ్రా అర్హత' 
                : 'Live tracking of each member total paid and chit status'}
            </p>
          </div>

          {/* Search & Filter */}
          <div className="ledger-controls">
            <div className="search-input-wrap">
              <Search size={16} />
              <input 
                type="text" 
                placeholder={language === 'te' ? 'పేరు లేదా ఫోన్ నంబర్...' : 'Search name or phone...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-pill-group">
              <button 
                type="button" 
                className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                అందరూ (20)
              </button>
              <button 
                type="button" 
                className={`filter-pill ${filterStatus === 'eligible' ? 'active' : ''}`}
                onClick={() => setFilterStatus('eligible')}
              >
                లక్కీ డ్రాకు అర్హులు ({eligibleMembersCount})
              </button>
              <button 
                type="button" 
                className={`filter-pill ${filterStatus === 'lifted' ? 'active' : ''}`}
                onClick={() => setFilterStatus('lifted')}
              >
                చిట్ ఎత్తినవారు ({liftedMembersCount})
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="table-responsive-container">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>నెం (No)</th>
                <th>సభ్యుని పేరు (Member Name)</th>
                <th>మొబైల్ (Phone)</th>
                <th>చిట్ స్థితి (Status)</th>
                <th>ఈ నెల వాయిదా</th>
                <th>ఈ నెల స్థితి</th>
                <th>ఇప్పటివరకు చెల్లించిన మొత్తం</th>
                <th>చర్యలు (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => {
                const monthDue = getInstallmentForMember(scheme.currentMonth, m);
                const curPay = payments.find(p => p.memberId === m.id && p.month === scheme.currentMonth);
                const isPaid = curPay?.status === 'approved';
                const isPending = curPay?.status === 'pending';

                return (
                  <tr key={m.id} className="ledger-row">
                    <td className="font-bold text-center">#{m.memberNo}</td>
                    <td>
                      <div className="member-name-cell">
                        <strong className="name-te">{m.nameTe}</strong>
                        <span className="name-en">{m.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{m.phone}</td>
                    <td>
                      {m.hasLiftedChit ? (
                        <span className="badge-status-lifted">
                          <Award size={14} />
                          <span>నెల {m.liftedMonth} లో ఎత్తారు</span>
                        </span>
                      ) : (
                        <span className="badge-status-eligible">
                          <CheckCircle2 size={14} />
                          <span>లక్కీ డ్రాకు అర్హులు</span>
                        </span>
                      )}
                    </td>
                    <td className="font-bold">
                      ₹{monthDue.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {isPaid ? (
                        <span className="status-badge-paid">చెల్లించారు</span>
                      ) : isPending ? (
                        <span className="status-badge-pending">పరిశీలనలో ఉంది</span>
                      ) : (
                        <span className="status-badge-due">బాకీ ఉంది</span>
                      )}
                    </td>
                    <td className="font-bold text-amber-400">
                      ₹{m.totalPaidSoFar.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        {isPaid && curPay ? (
                          <button 
                            type="button" 
                            className="btn-cell-receipt"
                            onClick={() => onOpenReceipt(curPay, m)}
                            title="రసీదు వీక్షించండి"
                          >
                            <FileCheck size={16} />
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            className="btn-cell-whatsapp"
                            onClick={() => handleSendReminder(m)}
                            title="WhatsApp రిమైండర్ పంపండి"
                          >
                            <Send size={15} />
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="btn-cell-switch"
                          onClick={() => switchUser(m.id)}
                          title="ఈ సభ్యునిగా లాగిన్ అవ్వండి"
                        >
                          లాగిన్
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. MASTER 4-COLUMN SCHEDULE REFERENCE */}
      <section className="schedule-section">
        <h3 className="section-title">
          {language === 'te' ? 'అధికారిక 20 నెలల వాయిదాల చార్ట్ (Master Chart)' : 'Master 20-Month Schedule'}
        </h3>
        <div className="table-responsive-container">
          <table className="master-table">
            <thead>
              <tr>
                <th>నెల (నెం)</th>
                <th>చిట్ విలువ</th>
                <th>చిట్ తీసుకోని వారి వాయిదా (Less Price)</th>
                <th>చిట్ తీసుకున్న వారి స్థిర వాయిదా (Fixed Rate)</th>
              </tr>
            </thead>
            <tbody>
              {MASTER_SCHEDULE.map(item => (
                <tr key={item.month} className={item.month === scheme.currentMonth ? 'current-active-row' : ''}>
                  <td className="font-bold text-center">నెల {item.month}</td>
                  <td>₹{item.chitValue.toLocaleString('en-IN')}</td>
                  <td className="font-bold text-amber-400">{item.notTakenAmount === 0 ? '₹0' : `₹${item.notTakenAmount.toLocaleString('en-IN')}`}</td>
                  <td className="font-bold text-emerald-400">₹{item.takenAmount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
