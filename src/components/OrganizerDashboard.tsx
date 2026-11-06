import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { MASTER_SCHEDULE, getInstallmentForMember, getMonthDisplayName } from '../data/scheduleData';
import { PaymentRecord, Member } from '../types/chit';
import { FinancialReportsModal } from './FinancialReportsModal';
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
  Send,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Database,
  Image as ImageIcon,
  X,
  TrendingUp,
  Percent,
  DollarSign,
  UserCheck,
  UserPlus,
  Gavel,
  Trophy,
  Copy,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';

interface OrganizerDashboardProps {
  onOpenReceipt: (payment: PaymentRecord, member?: Member) => void;
  onOpenLottery: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onOpenReceipt, onOpenLottery }) => {
  const { 
    activeGroup,
    scheme, 
    groupMembers, 
    groupPayments, 
    groupLiftings,
    groupLotteryHistory,
    recordChitLifting,
    approvePayment, 
    rejectPayment, 
    setCurrentMonth,
    switchUser, 
    addMember,
    deleteMember,
    groups,
    dbStatus,
    language,
    showToast
  } = useChit();

  const currentGroup = activeGroup || scheme;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lifted' | 'eligible'>('all');
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPin, setNewMemberPin] = useState('1234');
  const [selectedEnrollGroupId, setSelectedEnrollGroupId] = useState(currentGroup.id);
  const [showMemberPins, setShowMemberPins] = useState<{ [id: string]: boolean }>({});
  const [addMemberError, setAddMemberError] = useState('');

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError('');

    if (!newMemberName.trim()) {
      setAddMemberError(language === 'te' ? 'దయచేసి సభ్యుని పేరు నమోదు చేయండి' : 'Enter member name');
      return;
    }

    const cleanPhone = newMemberPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setAddMemberError(language === 'te' ? 'సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Enter valid 10-digit phone');
      return;
    }

    if (groupMembers.some(m => m.phone === cleanPhone)) {
      setAddMemberError(language === 'te' ? 'ఈ మొబైల్ నంబర్ గల సభ్యుడు ఇప్పటికే ఉన్నారు' : 'Member with this phone already exists');
      return;
    }

    addMember({
      name: newMemberName.trim(),
      nameTe: newMemberName.trim(),
      phone: cleanPhone,
      pin: newMemberPin.trim() || '1234',
      groupId: selectedEnrollGroupId || currentGroup.id
    });

    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberPin('1234');
    setIsAddMemberOpen(false);
  };

  const handleShareLoginWhatsApp = (m: Member) => {
    const targetGroup = groups.find(g => g.id === (m.groupId || currentGroup.id)) || currentGroup;
    const groupName = language === 'te' ? targetGroup.nameTe : targetGroup.name;
    const appUrl = window.location.origin;
    const msg = encodeURIComponent(
      `నమస్కారం ${m.nameTe || m.name} గారు,\n` +
      `శ్రీ వరలక్ష్మి చిట్స్ (${groupName}) లో మీ మెంబర్షిప్ #${m.memberNo} నమోదు చేయబడింది.\n\n` +
      `📱 మీ లాగిన్ మొబైల్: ${m.phone}\n` +
      `🔑 మీ సెక్యూరిటీ పిన్: ${m.pin}\n` +
      `🌐 పాస్‌బుక్ లాగిన్ లింక్: ${appUrl}\n\n` +
      `వాయిదా సొమ్ము తేదీ ${targetGroup.paymentDueDay} లోపు చెల్లించవలసిందిగా కోరుతున్నాము.\n` +
      `ధన్యవాదాలు! - నిర్వాహకుడు శివ (8790859546)`
    );
    window.open(`https://wa.me/91${m.phone}?text=${msg}`, '_blank');
  };

  // Set of all members who have already lifted the chit in any month (strict exclusion - never appear in later months)
  const liftedMemberIds = new Set([
    ...groupLiftings.map(l => l.memberId),
    ...groupLotteryHistory.map(lot => lot.winnerMemberId),
    ...groupMembers.filter(m => m.hasLiftedChit).map(m => m.id)
  ]);
  const eligibleWinningMembers = groupMembers.filter(m => 
    !liftedMemberIds.has(m.id) && 
    !m.hasLiftedChit && 
    m.role !== 'organizer'
  );

  // Chit Lifting & Monthly Auction State (పాట పాడుకున్నవారు)
  const [isLiftingModalOpen, setIsLiftingModalOpen] = useState(false);
  const [liftMonth, setLiftMonth] = useState(currentGroup.currentMonth);
  const [liftMemberId, setLiftMemberId] = useState('');
  const [liftType, setLiftType] = useState<'auction' | 'lottery'>('auction');
  const [liftBidDiscount, setLiftBidDiscount] = useState<number>(20000);
  const [liftNotes, setLiftNotes] = useState('');
  const [liftError, setLiftError] = useState('');

  const calcChitVal = currentGroup.totalValue;
  const calcDiscount = liftType === 'auction' ? Math.max(0, Number(liftBidDiscount) || 0) : 0;
  const calcComm = (calcChitVal * (currentGroup.commissionPercent || 5)) / 100;
  const calcNetDistributed = calcChitVal - calcDiscount;
  const remCount = Math.max(1, (currentGroup.totalMembers || 20) - 1);
  const calcDivPerMember = Math.max(0, Math.round((calcDiscount - calcComm) / remCount));

  const handleSaveLiftingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiftError('');

    if (!liftMemberId) {
      setLiftError(language === 'te' ? 'దయచేసి చిట్ తీసుకున్న సభ్యుడిని ఎంచుకోండి' : 'Please select a member');
      return;
    }

    const selectedMember = groupMembers.find(m => m.id === liftMemberId);
    if (!selectedMember) return;

    await recordChitLifting({
      month: Number(liftMonth),
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberNameTe: selectedMember.nameTe,
      memberNo: selectedMember.memberNo,
      liftType,
      chitValue: calcChitVal,
      bidDiscount: calcDiscount,
      organizerCommission: calcComm,
      netDistributedAmount: calcNetDistributed,
      dividendPerMember: calcDivPerMember,
      notes: liftNotes
    });

    setIsLiftingModalOpen(false);
    setLiftMemberId('');
    setLiftNotes('');
    showToast(
      language === 'te' ? '🏆 చిట్ పాట నమోదు చేయబడింది!' : '🏆 Chit Auction Recorded!',
      language === 'te'
        ? `✅ ${selectedMember.nameTe || selectedMember.name} గారు నెల ${liftMonth} చిట్ పాట విజయవంతంగా నమోదు చేయబడింది!`
        : `✅ Month ${liftMonth} chit auction recorded for ${selectedMember.name}!`,
      'lottery'
    );
  };

  // Metrics
  const approvedPayments = groupPayments.filter(p => p.status === 'approved');
  const totalPoolCollected = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentMonthApproved = approvedPayments.filter(p => p.month === currentGroup.currentMonth);
  const currentMonthPending = groupPayments.filter(p => p.month === currentGroup.currentMonth && p.status === 'pending');
  
  const currentMonthCollectedAmount = currentMonthApproved.reduce((sum, p) => sum + p.amount, 0);
  const pendingApprovalsCount = currentMonthPending.length;

  const liftedMembersCount = groupMembers.filter(m => m.hasLiftedChit).length;
  const eligibleMembersCount = groupMembers.filter(m => !m.hasLiftedChit).length;

  // Commission Calculations (Section 8)
  const monthlyCommissionAmount = (currentGroup.totalValue * (currentGroup.commissionPercent || 5)) / 100;
  const totalCommissionEarned = monthlyCommissionAmount * currentGroup.currentMonth;
  const commissionReceivedSoFar = monthlyCommissionAmount * Math.max(0, currentGroup.currentMonth - 1);
  const commissionPendingThisMonth = monthlyCommissionAmount;

  // Filtered members
  const filteredMembers = groupMembers.filter(m => {
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
    const dueAmount = getInstallmentForMember(currentGroup.currentMonth, member);
    const message = encodeURIComponent(
      `నమస్కారం ${member.nameTe} గారు,\n` +
      `శ్రీ వరలక్ష్మి చిట్స్ (${currentGroup.nameTe}) నెల ${currentGroup.currentMonth} వాయిదా సొమ్ము ₹${dueAmount.toLocaleString('en-IN')} తేదీ ${currentGroup.paymentDueDay} లోపు చెల్లించవలసిందిగా కోరుతున్నాము.\n` +
      `UPI ID: ${currentGroup.organizerUpiId} (${currentGroup.organizerName})\nధన్యవాదాలు!`
    );
    window.open(`https://wa.me/91${member.phone}?text=${message}`, '_blank');
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

          <div className="flex items-center gap-2 flex-wrap">
            <div className="month-picker-pill">
              <Calendar size={15} />
              <span>{language === 'te' ? 'ప్రస్తుత నెల:' : 'Active Month:'}</span>
              <select 
                value={currentGroup.currentMonth} 
                onChange={e => setCurrentMonth(parseInt(e.target.value, 10))}
                className="month-select"
              >
                {Array.from({ length: currentGroup.totalMonths }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{getMonthDisplayName(m, language)}</option>
                ))}
              </select>
            </div>

            {currentGroup.currentMonth < currentGroup.totalMonths && (
              <button
                type="button"
                className="btn-seed-data py-1.5 px-3 text-xs flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors font-semibold"
                onClick={() => {
                  const nextM = currentGroup.currentMonth + 1;
                  const confirmAdv = window.confirm(
                    language === 'te'
                      ? `నెల ${currentGroup.currentMonth} కలెక్షన్స్ & వేలం పూర్తయిన తర్వాత, చిట్ ను తదుపరి నెలకు (${getMonthDisplayName(nextM, 'te')}) మార్చాలనుకుంటున్నారా?`
                      : `Advance chit fund to next month: ${getMonthDisplayName(nextM, 'en')}?`
                  );
                  if (confirmAdv) {
                    setCurrentMonth(nextM);
                  }
                }}
                title={language === 'te' ? 'తదుపరి నెలకు మార్చండి' : 'Advance to Next Month'}
              >
                <span>{language === 'te' ? `➡️ తదుపరి నెల (${getMonthDisplayName(currentGroup.currentMonth + 1, language)})` : `➡️ Next Month (${currentGroup.currentMonth + 1})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
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
              {language === 'te' ? `మొత్తం ${groupMembers.length} మంది సభ్యుల నుండి` : `Cumulative from ${groupMembers.length} Members`}
            </span>
          </div>

          {/* Metric 2: Current Month Collections */}
          <div className="metric-box emerald">
            <span className="metric-label">
              {language === 'te' ? `నెల ${currentGroup.currentMonth} కలెక్షన్` : `Month ${currentGroup.currentMonth} Collection`}
            </span>
            <div className="metric-value">
              <span className="cur">₹</span>{currentMonthCollectedAmount.toLocaleString('en-IN')}
            </div>
            <span className="metric-sub">
              {language === 'te' 
                ? `${currentMonthApproved.length} / ${groupMembers.length} మంది చెల్లించారు` 
                : `${currentMonthApproved.length} of ${groupMembers.length} Paid`}
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

          {/* Metric 4: Organizer Commission Module (Section 8) */}
          <div className="metric-box purple">
            <span className="metric-label">
              {language === 'te' ? 'ఆర్గనైజర్ కమిషన్' : 'Organizer Commission'}
            </span>
            <div className="metric-value">
              <span className="cur">₹</span>{totalCommissionEarned.toLocaleString('en-IN')}
            </div>
            <span className="metric-sub">
              {language === 'te' 
                ? `${currentGroup.commissionPercent}% శాతం (నెలవారీ ₹${monthlyCommissionAmount.toLocaleString('en-IN')})` 
                : `${currentGroup.commissionPercent}% rate (₹${monthlyCommissionAmount.toLocaleString('en-IN')}/mo)`}
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
                ? `🎰 నెల ${currentGroup.currentMonth} లక్కీ డ్రా నిర్వహించండి` 
                : `🎰 Launch Month ${currentGroup.currentMonth} Lucky Draw`}
            </span>
          </button>

          <button 
            type="button" 
            className="btn-tool-reports"
            onClick={() => setIsReportsOpen(true)}
          >
            <FileSpreadsheet size={18} />
            <span>{language === 'te' ? 'ఆర్థిక నివేదికలు & ఎక్సెల్ (9 Reports)' : '9 Financial Reports & Excel'}</span>
          </button>

          <button 
            type="button" 
            className="btn-tool-whatsapp"
            onClick={() => setIsBroadcastModalOpen(true)}
          >
            <Send size={18} />
            <span>{language === 'te' ? 'WhatsApp గ్రూప్ బ్రాడ్‌కాస్ట్' : 'WhatsApp Broadcast'}</span>
          </button>
        </div>
      </section>

      {/* 3. PENDING APPROVALS QUEUE WITH SCREENSHOT PROOF VERIFICATION (Section 6) */}
      {currentMonthPending.length > 0 && (
        <section className="pending-queue-section animate-bounce-short">
          <div className="pending-queue-header">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-amber-400" />
              <h3 className="section-title text-amber-300">
                {language === 'te' ? `ఆమోదం కోసం వేచి ఉన్న చెల్లింపులు (${currentMonthPending.length})` : `Pending Verifications (${currentMonthPending.length})`}
              </h3>
            </div>
            <span className="pending-badge">{language === 'te' ? 'ధృవీకరణ వేచి ఉంది' : 'Pending Verification'}</span>
          </div>

          <div className="pending-cards-grid">
            {currentMonthPending.map(p => {
              const mem = groupMembers.find(m => m.id === p.memberId);
              return (
                <div key={p.id} className="pending-review-card luxury-card">
                  <div className="pending-card-top">
                    <div>
                      <strong className="pending-member-name">
                        {language === 'te' ? (mem?.nameTe || p.memberName) : (mem?.name || p.memberName)}
                      </strong>
                      <span className="pending-member-phone">#{mem?.memberNo} • {mem?.phone}</span>
                    </div>
                    <div className="pending-amount">₹{p.amount.toLocaleString('en-IN')}</div>
                  </div>

                  <div className="pending-card-mid flex items-center justify-between gap-2 text-xs py-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        p.paymentMode === 'Cash'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : p.paymentMode === 'PhonePe'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {p.paymentMode === 'Cash' 
                          ? (language === 'te' ? '💵 నగదు (Cash)' : '💵 Cash')
                          : p.paymentMode === 'PhonePe'
                          ? '📱 PhonePe / GPay'
                          : '🏦 UPI'}
                      </span>
                      {p.utr && p.utr !== 'Cash' && p.utr !== p.paymentMode && (
                        <span className="pending-utr font-mono text-gray-400">Ref: {p.utr}</span>
                      )}
                    </div>
                    <span className="pending-date text-gray-400 font-mono">{p.date} • {language === 'te' ? `నెల ${p.month}` : `M${p.month}`}</span>
                  </div>

                  {/* Payment Screenshot Proof Thumbnail (Section 6) */}
                  {p.proofUrl ? (
                    <div className="proof-thumbnail-row">
                      <button
                        type="button"
                        className="btn-view-proof-thumb"
                        onClick={() => setPreviewProofUrl(p.proofUrl || null)}
                      >
                        <ImageIcon size={14} className="text-yellow-400" />
                        <span>{language === 'te' ? 'రసీదు స్క్రీన్‌షాట్ చూడండి (Verify)' : 'View Receipt Proof'}</span>
                      </button>
                    </div>
                  ) : (
                    <span className="no-proof-note text-xs text-gray-400">
                      {language === 'te' ? 'స్క్రీన్‌షాట్ జతచేయబడలేదు' : 'No screenshot attached'}
                    </span>
                  )}

                  <div className="pending-card-actions">
                    <button 
                      type="button" 
                      className="btn-approve"
                      onClick={() => {
                        approvePayment(p.id);
                        alert(language === 'te' 
                          ? `✅ ${mem?.name || p.memberName} చెల్లించిన ₹${p.amount.toLocaleString('en-IN')} స్వీకరించబడిందిగా ఆమోదించబడింది!` 
                          : `✅ Marked as Received: ₹${p.amount.toLocaleString('en-IN')} from ${mem?.name || p.memberName}`);
                      }}
                      title="Mark as Received"
                    >
                      <CheckCircle2 size={16} />
                      <span>{language === 'te' ? '✓ స్వీకరించబడింది (Received)' : '✓ Mark Received'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn-reject"
                      onClick={() => {
                        const confirmReject = window.confirm(language === 'te'
                          ? `ఈ పేమెంట్ మీ ఖాతాలో రాలేదని నిర్ధారిస్తున్నారా? (Mark Not Received)`
                          : `Confirm payment was NOT received in bank account?`);
                        if (confirmReject) {
                          rejectPayment(p.id);
                        }
                      }}
                      title="Mark as Not Received"
                    >
                      <span>{language === 'te' ? '✕ రాలేదు (Not Received)' : '✕ Not Received'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3.5 MONTHLY CHIT LIFTING & AUCTION REGISTER (పాట పాడుకున్నవారి వివరాలు - Section 3, 4, 5) */}
      <section className="auction-register-section luxury-card mb-6">
        <div className="section-header-row flex justify-between items-center flex-wrap gap-3 pb-3 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Gavel size={20} />
              </span>
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="section-title m-0 text-base font-bold text-white">
                    {language === 'te' ? 'నెలసరి వేలం పాట & చిట్ ఎత్తిన వివరాలు (పాట పాడుకున్నవారు)' : 'Monthly Auction & Chit Winners Register'}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 whitespace-nowrap">
                    {groupLiftings.length} / {currentGroup.totalMonths} {language === 'te' ? 'నెలలు పూర్తయ్యాయి' : 'Months'}
                  </span>
                </div>
                <p className="section-subtitle m-0 text-xs text-gray-400">
                  {language === 'te'
                    ? 'ప్రతి నెల పాట లేదా లక్కీ డ్రా ద్వారా చిట్ ఎత్తిన సభ్యుడు మరియు చేతికి అందిన నికర మొత్తం'
                    : 'Month-by-month winner tracking, auction discounts, and net prize money paid'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5"
              onClick={() => {
                setLiftMonth(currentGroup.currentMonth);
                setLiftMemberId('');
                setLiftError('');
                setIsLiftingModalOpen(true);
              }}
            >
              <Gavel size={14} />
              <span>{language === 'te' ? '+ ఈ నెల పాట నమోదు చేయండి' : '+ Record Chit Auction'}</span>
            </button>
            <button
              type="button"
              className="btn-seed-data py-2 px-3 text-xs flex items-center gap-1.5"
              onClick={onOpenLottery}
            >
              <Dices size={14} className="text-yellow-400" />
              <span>{language === 'te' ? '🎲 లక్కీ డ్రా నిర్వహించండి' : '🎲 Run Lucky Draw'}</span>
            </button>
          </div>
        </div>

        {/* Liftings Cards / Table */}
        <div className="mt-3">
          {groupLiftings.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-800 rounded-xl bg-gray-950/30">
              <Trophy size={32} className="mx-auto text-amber-500/60 mb-2" />
              <p className="text-sm text-gray-300 font-medium">
                {language === 'te' 
                  ? 'ఇంకా ఏ నెలా వేలం పాట నమోదు కాలేదు' 
                  : 'No chit auctions or lotteries recorded yet'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'te'
                  ? 'సభ్యులు పాట పాడుకున్నప్పుడు పైన ఉన్న "+ ఈ నెల పాట నమోదు చేయండి" బటన్ ద్వారా సులభంగా నమోదు చేయండి.'
                  : 'Click "+ Record Chit Auction" above to record the winning member, auction discount, and prize payout.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{language === 'te' ? 'నెల' : 'Month'}</th>
                    <th>{language === 'te' ? 'పాట పాడుకున్న సభ్యుడు' : 'Winner Member'}</th>
                    <th>{language === 'te' ? 'విధానం' : 'Method'}</th>
                    <th>{language === 'te' ? 'వేలం పాట తగ్గింపు' : 'Bid Discount'}</th>
                    <th>{language === 'te' ? 'చేతికి అందిన మొత్తం' : 'Net Prize Distributed'}</th>
                    <th>{language === 'te' ? 'సభ్యునికి తగ్గింపు (డివిడెండ్)' : 'Dividend / Member'}</th>
                    <th>{language === 'te' ? 'తేదీ' : 'Date'}</th>
                    <th>{language === 'te' ? 'స్థితి' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {groupLiftings.map(lift => (
                    <tr key={lift.id} className="ledger-row">
                      <td className="font-bold text-center">
                        <span className="month-badge text-xs font-mono font-bold text-amber-400">
                          {language === 'te' ? `నెల ${lift.month}` : `Month ${lift.month}`}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-amber-400">#{lift.memberNo || ''}</span>
                          <span>{language === 'te' ? lift.memberNameTe : lift.memberName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          lift.liftType === 'auction' 
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' 
                            : 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                        }`}>
                          {lift.liftType === 'auction' 
                            ? (language === 'te' ? 'వేలం పాట' : 'Auction Bid') 
                            : (language === 'te' ? 'లక్కీ డ్రా' : 'Lucky Draw')}
                        </span>
                      </td>
                      <td className="font-mono text-red-400 text-xs">
                        {lift.bidDiscount > 0 ? `-₹${lift.bidDiscount.toLocaleString('en-IN')}` : '₹0 (Full Chit)'}
                      </td>
                      <td className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{lift.netDistributedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="font-mono text-amber-400 text-xs">
                        {lift.dividendPerMember && lift.dividendPerMember > 0 ? `+₹${lift.dividendPerMember.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="text-xs text-gray-400 font-mono">
                        {lift.date}
                      </td>
                      <td>
                        <span className="badge-paid text-xs">
                          <CheckCircle2 size={12} />
                          <span>{language === 'te' ? 'చెల్లించబడింది' : 'Distributed'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 4. MEMBER LEDGER & TOTAL PAID TABLE */}
      <section className="member-ledger-section">
        <div className="ledger-header-row">
          <div>
            <h3 className="section-title">
              {language === 'te' ? `${currentGroup.nameTe} - సభ్యుల పూర్తి డైరెక్టరీ` : `${currentGroup.name} - Member Directory`}
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
                {language === 'te' ? `అందరూ (${groupMembers.length})` : `All (${groupMembers.length})`}
              </button>
              <button 
                type="button" 
                className={`filter-pill ${filterStatus === 'eligible' ? 'active' : ''}`}
                onClick={() => setFilterStatus('eligible')}
              >
                {language === 'te' ? `లక్కీ డ్రాకు అర్హులు (${eligibleMembersCount})` : `Draw Eligible (${eligibleMembersCount})`}
              </button>
              <button 
                type="button" 
                className={`filter-pill ${filterStatus === 'lifted' ? 'active' : ''}`}
                onClick={() => setFilterStatus('lifted')}
              >
                {language === 'te' ? `చిట్ ఎత్తినవారు (${liftedMembersCount})` : `Chit Lifted (${liftedMembersCount})`}
              </button>
            </div>
            
            <button
              type="button"
              className="btn-seed-data py-2 px-3 text-xs flex items-center gap-1.5 ml-auto"
              onClick={() => { setIsAddMemberOpen(true); setAddMemberError(''); }}
            >
              <UserPlus size={14} className="text-amber-400" />
              <span>{language === 'te' ? '+ సభ్యుని చేర్చండి' : '+ Add Member'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scroll Hint */}
        <div className="table-scroll-hint-bar">
          <span className="scroll-hint-text">
            {language === 'te' ? '👉 పూర్తి 9 కాలమ్స్ వివరాల కోసం పట్టికను పక్కకు జరపండి' : '👉 Swipe horizontally to view all 9 columns'}
          </span>
        </div>

        {/* Ledger Table */}
        <div className="table-responsive-container ledger-table-wrap">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/40 my-3">
              <Users size={36} className="mx-auto text-gray-500 mb-2" />
              <p className="text-sm font-semibold text-gray-300">
                {language === 'te' 
                  ? 'ఈ గ్రూప్‌లో ఇంకా సభ్యులు చేర్చబడలేదు' 
                  : 'No members enrolled in this group yet'}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                {language === 'te'
                  ? 'నిర్వాహకుడిగా మీరు పైన ఉన్న "+ సభ్యుని చేర్చండి" బటన్ ద్వారా 20 మంది సభ్యులను వారి మొబైల్ & పిన్ తో ఇక్కడే నమోదు చేయవచ్చు.'
                  : 'As the Organizer, click "+ Add Member" above to enroll participants with their mobile number and 4-digit PIN.'}
              </p>
              <button
                type="button"
                className="btn-primary mt-3 text-xs py-2 px-4 inline-flex items-center gap-1.5"
                onClick={() => { setIsAddMemberOpen(true); setAddMemberError(''); }}
              >
                <UserPlus size={14} />
                <span>{language === 'te' ? '+ సభ్యుని నమోదు చేయండి' : '+ Add Member'}</span>
              </button>
            </div>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>{language === 'te' ? 'నెం' : 'No'}</th>
                  <th>{language === 'te' ? 'సభ్యుని పేరు' : 'Member Name'}</th>
                  <th>{language === 'te' ? 'మొబైల్' : 'Mobile'}</th>
                  <th>{language === 'te' ? 'లాగిన్ పిన్' : 'PIN'}</th>
                  <th>{language === 'te' ? 'చిట్ స్థితి' : 'Chit Status'}</th>
                  <th>{language === 'te' ? 'ఈ నెల వాయిదా' : 'Month Due'}</th>
                  <th>{language === 'te' ? 'ఈ నెల స్థితి' : 'Payment Status'}</th>
                  <th>{language === 'te' ? 'ఇప్పటివరకు చెల్లించిన మొత్తం' : 'Total Paid So Far'}</th>
                  <th>{language === 'te' ? 'చర్యలు & లాగిన్ షేర్' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => {
                  const monthDue = getInstallmentForMember(currentGroup.currentMonth, m);
                  const curPay = groupPayments.find(p => p.memberId === m.id && p.month === currentGroup.currentMonth);
                  const isPaid = curPay?.status === 'approved';
                  const isPending = curPay?.status === 'pending';
                  const isPinVisible = Boolean(showMemberPins[m.id]);

                  return (
                    <tr key={m.id} className="ledger-row">
                      <td className="font-bold text-center">#{m.memberNo}</td>
                      <td>
                        <div className="member-name-cell">
                          <strong className="name-te">{language === 'te' ? m.nameTe : m.name}</strong>
                          <span className="name-en">{language === 'te' ? m.name : m.nameTe}</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{m.phone}</td>
                      <td>
                        <div className="inline-flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded border border-gray-800 font-mono text-xs">
                          <span className="text-amber-300 font-bold tracking-wider">
                            {isPinVisible ? m.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-white p-0.5"
                            onClick={() => setShowMemberPins(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                            title={isPinVisible ? 'Hide PIN' : 'View PIN'}
                          >
                            {isPinVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        {m.hasLiftedChit ? (
                          <span className="badge-status-lifted">
                            <Award size={14} />
                            <span>{language === 'te' ? `నెల ${m.liftedMonth} లో ఎత్తారు` : `Lifted Month ${m.liftedMonth}`}</span>
                          </span>
                        ) : (
                          <span className="badge-status-eligible">
                            <CheckCircle2 size={14} />
                            <span>{language === 'te' ? 'లక్కీ డ్రాకు అర్హులు' : 'Eligible for Draw'}</span>
                          </span>
                        )}
                      </td>
                      <td className="font-bold">
                        ₹{monthDue.toLocaleString('en-IN')}
                      </td>
                      <td>
                        {isPaid ? (
                          <span className="status-badge-paid">{language === 'te' ? 'చెల్లించారు' : 'Paid'}</span>
                        ) : isPending ? (
                          <span className="status-badge-pending">{language === 'te' ? 'పరిశీలనలో ఉంది' : 'Pending'}</span>
                        ) : (
                          <span className="status-badge-due">{language === 'te' ? 'బాకీ ఉంది' : 'Due'}</span>
                        )}
                      </td>
                      <td className="font-bold text-amber-400">
                        ₹{m.totalPaidSoFar.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <div className="action-buttons-cell flex items-center gap-1.5">
                          {/* 1-Click WhatsApp Login Credentials Share */}
                          <button
                            type="button"
                            className="btn-cell-whatsapp text-xs py-1 px-2 flex items-center gap-1"
                            onClick={() => handleShareLoginWhatsApp(m)}
                            title={language === 'te' ? 'లాగిన్ వివరాలు వాట్సాప్‌లో పంపండి' : 'Share Login Details on WhatsApp'}
                          >
                            <Send size={13} />
                            <span className="text-[11px]">{language === 'te' ? 'లాగిన్ పంపు' : 'Share Login'}</span>
                          </button>

                          {isPaid && curPay ? (
                            <button 
                              type="button" 
                              className="btn-cell-receipt"
                              onClick={() => onOpenReceipt(curPay, m)}
                              title={language === 'te' ? 'రసీదు వీక్షించండి' : 'View Receipt'}
                            >
                              <FileCheck size={15} />
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              className="btn-cell-switch text-xs py-1 px-2"
                              onClick={() => switchUser(m.id)}
                              title={language === 'te' ? 'ఈ సభ్యుని పాస్‌బుక్ చూడండి' : 'Open Passbook as Member'}
                            >
                              {language === 'te' ? 'పాస్‌బుక్' : 'Passbook'}
                            </button>
                          )}

                          {/* Delete Member button */}
                          <button
                            type="button"
                            className="text-gray-500 hover:text-red-400 p-1.5 rounded transition-colors"
                            onClick={() => {
                              const ok = window.confirm(
                                language === 'te'
                                  ? `మీరు "${m.name}" ని ఈ చిట్ గ్రూప్ నుండి తొలగించాలనుకుంటున్నారా?`
                                  : `Are you sure you want to remove "${m.name}" from this group?`
                              );
                              if (ok) {
                                deleteMember(m.id);
                              }
                            }}
                            title={language === 'te' ? 'సభ్యుని తొలగించండి' : 'Remove Member'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 5. MODAL: FULL PROOF SCREENSHOT VIEWER (Section 6) */}
      {previewProofUrl && (
        <div className="modal-backdrop animate-fade" onClick={() => setPreviewProofUrl(null)}>
          <div className="proof-viewer-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-bold text-base">
                {language === 'te' ? 'పేమెంట్ రసీదు స్క్రీన్‌షాట్ ధృవీకరణ' : 'Payment Screenshot Proof Verification'}
              </h3>
              <button
                type="button"
                className="btn-modal-close static"
                onClick={() => setPreviewProofUrl(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="proof-full-image-wrap">
              <img src={previewProofUrl} alt="Payment Proof" className="proof-full-img" />
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: WHATSAPP GROUP BROADCAST TEMPLATES (Section 10) */}
      {isBroadcastModalOpen && (
        <div className="modal-backdrop animate-fade" onClick={() => setIsBroadcastModalOpen(false)}>
          <div className="login-modal-card luxury-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-emerald-400" />
                <h3 className="text-white font-bold text-base">
                  {language === 'te' ? 'WhatsApp గ్రూప్ బ్రాడ్‌కాస్ట్ సందేశాలు' : 'WhatsApp Group Broadcast Templates'}
                </h3>
              </div>
              <button type="button" className="btn-modal-close static" onClick={() => setIsBroadcastModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="broadcast-templates-list">
              <div className="broadcast-template-card">
                <strong className="text-sm text-yellow-300">📢 1. నెలవారీ వాయిదా రిమైండర్ (Monthly Due Notice)</strong>
                <p className="text-xs text-gray-300 my-2 font-mono p-2 bg-slate-900 rounded">
                  {`📢 *${currentGroup.nameTe} - నెల ${currentGroup.currentMonth} వాయిదా నోటీస్*\nనెల ${currentGroup.currentMonth} వాయిదా సొమ్ము తేదీ ${currentGroup.paymentDueDay} లోపు చెల్లించవలసిందిగా కోరుతున్నాము.\nUPI: ${currentGroup.organizerUpiId} (${currentGroup.organizerName})`}
                </p>
                <button
                  type="button"
                  className="btn-primary py-1 px-3 text-xs"
                  onClick={() => {
                    const text = encodeURIComponent(`📢 *${currentGroup.nameTe} - నెల ${currentGroup.currentMonth} వాయిదా నోటీస్*\nనెల ${currentGroup.currentMonth} వాయిదా సొమ్ము తేదీ ${currentGroup.paymentDueDay} లోపు చెల్లించవలసిందిగా కోరుతున్నాము.\nUPI: ${currentGroup.organizerUpiId} (${currentGroup.organizerName})`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                >
                  WhatsApp లో పంపండి (Share)
                </button>
              </div>

              <div className="broadcast-template-card mt-3">
                <strong className="text-sm text-yellow-300">🏆 2. లక్కీ డ్రా ఫలితాల ప్రకటన (Lottery Result)</strong>
                <p className="text-xs text-gray-300 my-2 font-mono p-2 bg-slate-900 rounded">
                  {`🏆 *${currentGroup.nameTe} - లక్కీ డ్రా ఫలితాలు*\nనెల ${currentGroup.currentMonth} డిజిటల్ లక్కీ డ్రా విజయవంతంగా నిర్వహించబడింది.\nవిజేత ₹${currentGroup.totalValue.toLocaleString('en-IN')} చిట్ పొందారు.\nనిర్వాహకుడు: ${currentGroup.organizerName}`}
                </p>
                <button
                  type="button"
                  className="btn-primary py-1 px-3 text-xs"
                  onClick={() => {
                    const text = encodeURIComponent(`🏆 *${currentGroup.nameTe} - లక్కీ డ్రా ఫలితాలు*\nనెల ${currentGroup.currentMonth} డిజిటల్ లక్కీ డ్రా విజయవంతంగా నిర్వహించబడింది.\nవిజేత ₹${currentGroup.totalValue.toLocaleString('en-IN')} చిట్ పొందారు.\nనిర్వాహకుడు: ${currentGroup.organizerName}`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                >
                  WhatsApp లో పంపండి (Share)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD MEMBER MODAL (For Organizer to enroll members) */}
      {isAddMemberOpen && (
        <div className="modal-backdrop animate-fade" onClick={() => setIsAddMemberOpen(false)}>
          <div className="login-modal-card luxury-card" onClick={e => e.stopPropagation()}>
            <div className="login-modal-top-bar">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <UserPlus size={18} />
                <span>{language === 'te' ? 'కొత్త సభ్యుని చేర్చండి' : 'Enroll New Chit Member'}</span>
              </h3>
              <button 
                type="button" 
                className="btn-modal-close static" 
                onClick={() => setIsAddMemberOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {addMemberError && (
              <div className="login-error-alert my-2">
                <span>{addMemberError}</span>
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit} className="login-form mt-3">
              <div className="form-field">
                <label className="field-label text-xs">
                  <Layers size={14} />
                  <span>{language === 'te' ? 'చిట్ గ్రూప్ ఎంచుకోండి' : 'Select Chit Group'}</span>
                </label>
                <select
                  className="form-input"
                  value={selectedEnrollGroupId}
                  onChange={e => setSelectedEnrollGroupId(e.target.value)}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {language === 'te' ? g.nameTe : g.name} (₹{g.totalValue.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label text-xs">
                  <span>{language === 'te' ? 'సభ్యుని పేరు (Member Name)' : 'Member Name'}</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-field">
                <label className="field-label text-xs">
                  <span>{language === 'te' ? 'మొబైల్ నంబర్ (10-Digit Mobile)' : 'Mobile Number'}</span>
                </label>
                <div className="input-group">
                  <span className="input-prefix">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    className="form-input"
                    placeholder="10-digit mobile"
                    value={newMemberPhone}
                    onChange={e => setNewMemberPhone(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="field-label text-xs">
                  <span>{language === 'te' ? 'సెక్యూరిటీ PIN (4-Digits, Default: 1234)' : 'Security PIN (4-Digits)'}</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="form-input text-center tracking-widest font-bold"
                  placeholder="1234"
                  value={newMemberPin}
                  onChange={e => setNewMemberPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full mt-2">
                <span>{language === 'te' ? 'సభ్యుని గ్రూప్‌లో చేర్చండి' : 'Enroll Member in Group'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. RECORD MONTHLY CHIT AUCTION / LIFTING MODAL (పాట పాడుకున్నవారి వివరాలు) */}
      {isLiftingModalOpen && (
        <div className="modal-backdrop animate-fade" onClick={() => setIsLiftingModalOpen(false)}>
          <div className="lifting-modal-card luxury-card animate-fade" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Gavel size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white m-0">
                    {language === 'te' ? 'నెలసరి వేలం పాట / చిట్ ఎత్తిన వివరాలు నమోదు' : 'Record Monthly Chit Auction / Lift'}
                  </h3>
                  <p className="text-xs text-amber-400 m-0 font-medium">
                    {language === 'te' ? `${currentGroup.nameTe} (మొత్తం విలువ: ₹2,00,000)` : `${currentGroup.name} (Value: ₹2,00,000)`}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-modal-close static" 
                onClick={() => setIsLiftingModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {liftError && (
              <div className="mb-3 text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg p-2.5 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{liftError}</span>
              </div>
            )}

            <form onSubmit={handleSaveLiftingSubmit} className="space-y-3.5">
              {/* Month Selector */}
              <div className="form-field">
                <label className="field-label text-xs">
                  <Calendar size={14} />
                  <span>{language === 'te' ? 'చిట్ నెల (Month Number)' : 'Chit Month'}</span>
                </label>
                <select
                  className="form-input"
                  value={liftMonth}
                  onChange={e => setLiftMonth(Number(e.target.value))}
                >
                  {Array.from({ length: currentGroup.totalMonths || 20 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {getMonthDisplayName(m, language)} {m === currentGroup.currentMonth ? (language === 'te' ? '(ప్రస్తుత నెల)' : '(Current)') : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Selector (Eligible participants only - excludes already lifted members!) */}
              <div className="form-field">
                <div className="flex justify-between items-center mb-1">
                  <label className="field-label text-xs m-0">
                    <UserCheck size={14} />
                    <span>{language === 'te' ? 'చిట్ ఎత్తిన సభ్యుడు (Winning Member)' : 'Winning Member'}</span>
                  </label>
                  <span className="text-[11px] text-amber-400">
                    {language === 'te' 
                      ? `అర్హులైన సభ్యులు: ${eligibleWinningMembers.length}` 
                      : `Eligible: ${eligibleWinningMembers.length}`}
                  </span>
                </div>
                <select
                  className="form-input font-bold"
                  value={liftMemberId}
                  onChange={e => setLiftMemberId(e.target.value)}
                  required
                >
                  <option value="">{language === 'te' ? '-- సభ్యుడిని ఎంచుకోండి --' : '-- Select Member --'}</option>
                  {eligibleWinningMembers.length === 0 ? (
                    <option disabled>{language === 'te' ? 'అందరు సభ్యులు చిట్ తీసుకున్నారు' : 'All members have already lifted'}</option>
                  ) : (
                    eligibleWinningMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        #{m.memberNo} {language === 'te' ? m.nameTe : m.name} ({m.phone})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Method Selector: Luxury Segmented Switch */}
              <div className="form-field">
                <label className="field-label text-xs">
                  <Award size={14} />
                  <span>{language === 'te' ? 'చిట్ తీసుకునే పద్ధతి (Lifting Method)' : 'Lifting Method'}</span>
                </label>
                <div className="method-segmented-group">
                  <button
                    type="button"
                    className={`method-segmented-btn ${liftType === 'auction' ? 'active' : ''}`}
                    onClick={() => setLiftType('auction')}
                  >
                    <Gavel size={15} />
                    <span>{language === 'te' ? 'వేలం పాట (Auction Bid)' : 'Auction Bid'}</span>
                  </button>

                  <button
                    type="button"
                    className={`method-segmented-btn ${liftType === 'lottery' ? 'active' : ''}`}
                    onClick={() => setLiftType('lottery')}
                  >
                    <Dices size={15} />
                    <span>{language === 'te' ? 'లక్కీ డ్రా (Lucky Draw)' : 'Lucky Draw'}</span>
                  </button>
                </div>
              </div>

              {/* If Auction: Bid Discount Input */}
              {liftType === 'auction' && (
                <div className="form-field">
                  <label className="field-label text-xs">
                    <TrendingUp size={14} />
                    <span>{language === 'te' ? 'వేలం పాట తగ్గింపు మొత్తం (₹ Auction Discount)' : 'Auction Bid Discount (₹)'}</span>
                  </label>
                  <div className="input-group">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      step={500}
                      min={0}
                      max={calcChitVal}
                      className="form-input font-bold text-amber-400 font-mono text-base"
                      value={liftBidDiscount}
                      onChange={e => setLiftBidDiscount(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Calculation Breakdown: Luxury Ledger Card */}
              <div className="auction-summary-card">
                <div className="summary-metric-row">
                  <span className="summary-metric-label">{language === 'te' ? 'మొత్తం చిట్ విలువ:' : 'Total Chit Value:'}</span>
                  <span className="summary-metric-value">₹{calcChitVal.toLocaleString('en-IN')}</span>
                </div>
                {liftType === 'auction' && (
                  <div className="summary-metric-row text-red-400">
                    <span className="summary-metric-label text-red-400">{language === 'te' ? 'వేలం పాట తగ్గింపు (Discount):' : 'Bid Discount:'}</span>
                    <span className="summary-metric-value text-red-400">- ₹{calcDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="summary-metric-row">
                  <span className="summary-metric-label">{language === 'te' ? 'ఆర్గనైజర్ కమీషన్ (5%):' : 'Organizer Commission (5%):'}</span>
                  <span className="summary-metric-value">₹{calcComm.toLocaleString('en-IN')}</span>
                </div>

                <div className="highlight-prize-box">
                  <span className="text-xs font-bold text-emerald-300">
                    {language === 'te' ? 'విజేతకు చేతికి ఇచ్చే నికర మొత్తం:' : 'Net Distributed to Winner:'}
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-400">
                    ₹{calcNetDistributed.toLocaleString('en-IN')}
                  </span>
                </div>

                {liftType === 'auction' && (
                  <div className="highlight-dividend-box">
                    <span className="text-amber-300 font-semibold">
                      {language === 'te' ? 'మిగిలిన 19 మంది సభ్యుల డివిడెండ్:' : 'Dividend to other members:'}
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      ~₹{calcDivPerMember.toLocaleString('en-IN')} / member
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-field">
                <label className="field-label text-xs">
                  <span>{language === 'te' ? 'గమనికలు (ఐచ్ఛికం)' : 'Remarks / Notes (Optional)'}</span>
                </label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder={language === 'te' ? 'ఉదా: బ్యాంక్ ట్రాన్స్‌ఫర్ ద్వారా ఇచ్చాము' : 'e.g. Paid via Bank Transfer'}
                  value={liftNotes}
                  onChange={e => setLiftNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="btn-seed-data flex-1 text-xs py-2.5 rounded-xl font-semibold"
                  onClick={() => setIsLiftingModalOpen(false)}
                >
                  <span>{language === 'te' ? 'రద్దు చేయి' : 'Cancel'}</span>
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 luxury-btn text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>{language === 'te' ? '✓ నిర్ధారించండి & సేవ్ చేయండి' : '✓ Confirm & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINANCIAL REPORTS MODAL */}
      <FinancialReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
      />
    </div>
  );
};
