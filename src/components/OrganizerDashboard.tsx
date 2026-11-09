import React, { useState, useMemo } from 'react';
import { useChit } from '../context/ChitContext';
import { MASTER_SCHEDULE, getInstallmentForMember, getMonthDisplayName, MONTH_SHORT_NAMES, getScheduleNotTakenAmount } from '../data/scheduleData';
import { PaymentRecord, Member } from '../types/chit';
import {
  Users,
  CheckCircle2,
  Check,
  Clock,
  AlertTriangle,
  Dices,
  Share2,
  ChevronRight,
  Search,
  Calendar,
  Award,
  CreditCard,
  FileCheck,
  Send,
  Trash2,
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
  Layers,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
  Edit2
} from 'lucide-react';
import {
  openDeviceSms,
  openWhatsApp,
  getEnrollmentSmsText,
  getPaymentReceiptSmsText
} from '../utils/smsHelper';

interface OrganizerDashboardProps {
  onOpenReceipt: (payment: PaymentRecord, member?: Member) => void;
  onOpenLottery: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onOpenReceipt, onOpenLottery }) => {
  const {
    activeGroup,
    scheme,
    members,
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
    updateMember,
    groups,
    dbStatus,
    language,
    showToast
  } = useChit();

  const currentGroup = activeGroup || scheme;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lifted' | 'eligible'>('all');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isBroadcastCopied, setIsBroadcastCopied] = useState(false);
  const [customReceiverName, setCustomReceiverName] = useState('');
  const [customReceiverPhone, setCustomReceiverPhone] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPin, setNewMemberPin] = useState('1234');
  const [selectedEnrollGroupId, setSelectedEnrollGroupId] = useState(currentGroup.id);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isMembersExpanded, setIsMembersExpanded] = useState(true);
  const [showMemberPins, setShowMemberPins] = useState<{ [id: string]: boolean }>({});
  const [memberViewMode, setMemberViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [addMemberError, setAddMemberError] = useState('');
  const [isEnrollingMember, setIsEnrollingMember] = useState(false);
  const [enrolledSuccessMember, setEnrolledSuccessMember] = useState<{
    name: string;
    phone: string;
    pin: string;
    groupName: string;
    chitNote?: string;
  } | null>(null);
  const [approvedPaymentSuccess, setApprovedPaymentSuccess] = useState<{
    payment: PaymentRecord;
    member: Member | null;
  } | null>(null);
  const [isPinCopied, setIsPinCopied] = useState(false);

  // Edit Member State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberNo, setEditMemberNo] = useState<number>(1);
  const [editName, setEditName] = useState('');
  const [editNameTe, setEditNameTe] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEditMember = (m: Member) => {
    setEditingMember(m);
    setEditMemberNo(m.memberNo);
    setEditName(m.name);
    setEditNameTe(m.nameTe || m.name);
    setEditPhone(m.phone);
    setEditPin(m.pin);
    setEditError('');
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditError('');

    if (!editName.trim()) {
      setEditError(language === 'te' ? 'దయచేసి సభ్యుని పేరు నమోదు చేయండి' : 'Enter member name');
      return;
    }

    let cleanPhone = editPhone.trim().replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(2);
    if (cleanPhone.startsWith('0') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(1);
    if (cleanPhone.length !== 10) {
      setEditError(language === 'te' ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Enter 10-digit mobile');
      return;
    }

    const targetGroupMembers = members.filter(m => m.groupId === (editingMember.groupId || currentGroup.id) && m.id !== editingMember.id && m.role !== 'organizer');
    if (targetGroupMembers.some(m => m.memberNo === Number(editMemberNo))) {
      setEditError(
        language === 'te'
          ? `మెంబర్ నంబర్ #${editMemberNo} ఇప్పటికే వేరొక సభ్యునికి కేటాయించబడింది!`
          : `Member #${editMemberNo} is already assigned to another member in this group!`
      );
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateMember(editingMember.id, {
        memberNo: Number(editMemberNo),
        name: editName.trim(),
        nameTe: editNameTe.trim() || editName.trim(),
        phone: cleanPhone,
        pin: editPin.trim() || '1234'
      });
      showToast(
        language === 'te' ? '✅ సభ్యుని వివరాలు అప్‌డేట్ అయ్యాయి!' : '✅ Member Updated!',
        language === 'te' ? `#${editMemberNo} ${editName} వివరాలు సేవ్ చేయబడ్డాయి.` : `Member #${editMemberNo} saved successfully.`,
        'info'
      );
      setEditingMember(null);
    } catch {
      setEditError(language === 'te' ? 'సేవ్ చేయడంలో లోపం' : 'Error updating member');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError('');

    if (!newMemberName.trim()) {
      setAddMemberError(language === 'te' ? 'దయచేసి సభ్యుని పేరు నమోదు చేయండి' : 'Enter member name');
      return;
    }

    let cleanPhone = newMemberPhone.trim().replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(2);
    if (cleanPhone.startsWith('0') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(1);
    if (cleanPhone.length !== 10) {
      setAddMemberError(
        language === 'te' 
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి (ఉదా: 9848012345)' 
          : 'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    const targetGroup = groups.find(g => g.id === (selectedEnrollGroupId || currentGroup.id)) || currentGroup;
    const groupName = targetGroup.id === 'grp-2' || targetGroup.name.includes('Group B') ? 'Group B' : 'Group A';

    // 1. Group capacity check (Max totalMembers, e.g. 20)
    const targetGroupMembers = members.filter(m => m.groupId === targetGroup.id && m.role !== 'organizer');
    if (targetGroupMembers.length >= targetGroup.totalMembers) {
      setAddMemberError(
        language === 'te'
          ? `${groupName} లో గరిష్టంగా ${targetGroup.totalMembers} మంది సభ్యులు మాత్రమే ఉండగలరు. గ్రూప్ ఇప్పటికే నిండిపోయింది.`
          : `${groupName} is full (${targetGroup.totalMembers}/${targetGroup.totalMembers} members enrolled).`
      );
      return;
    }

    // 2. Multi-Chit Support:
    // If this phone already has chits in this group or other groups, reuse their existing PIN and suffix name
    const existingInGroup = targetGroupMembers.filter(m => m.phone === cleanPhone);
    const existingAcrossGroups = members.filter(m => m.phone === cleanPhone && m.role !== 'organizer');
    const existingPin = existingAcrossGroups.length > 0 ? existingAcrossGroups[0].pin : null;
    const finalPin = existingPin || (newMemberPin.trim() || '1234');

    let finalName = newMemberName.trim();
    if (existingInGroup.length > 0 && !finalName.toLowerCase().includes('chit') && !finalName.includes('టికెట్')) {
      finalName = `${finalName} (Chit ${existingInGroup.length + 1})`;
    }

    setIsEnrollingMember(true);
    try {
      await addMember({
        name: finalName,
        nameTe: finalName,
        phone: cleanPhone,
        pin: finalPin,
        groupId: targetGroup.id
      });

      setEnrolledSuccessMember({
        name: finalName,
        phone: cleanPhone,
        pin: finalPin,
        groupName,
        chitNote: existingInGroup.length > 0
          ? (language === 'te' ? `గమనిక: ఈ నంబర్‌పై ఇది ${existingInGroup.length + 1}వ చిట్టీగా (Ticket #${existingInGroup.length + 1}) విజయవంతంగా నమోదైంది.` : `Note: Registered as Chit #${existingInGroup.length + 1} for this member.`)
          : undefined
      });

      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberPin('1234');
    } catch (err: any) {
      setAddMemberError(err?.message || (language === 'te' ? 'సభ్యుని చేర్చడంలో లోపం ఏర్పడింది. మళ్ళీ ప్రయత్నించండి.' : 'Error enrolling member. Please try again.'));
    } finally {
      setIsEnrollingMember(false);
    }
  };

  const handleShareLoginSms = (m: Member) => {
    const targetGroup = groups.find(g => g.id === (m.groupId || currentGroup.id)) || currentGroup;
    const groupName = targetGroup.id === 'grp-2' || targetGroup.name.includes('Group B') ? 'Group B' : 'Group A';
    const text = getEnrollmentSmsText({
      memberName: m.name,
      phone: m.phone,
      pin: m.pin,
      groupName,
      organizerName: currentGroup.organizerName,
      organizerPhone: currentGroup.organizerPhone,
    });
    openDeviceSms(m.phone, text);
  };

  const handleSendPaymentReceiptSms = (p: PaymentRecord, mem?: Member | null) => {
    const phone = mem?.phone || '';
    const text = getPaymentReceiptSmsText({
      memberName: mem?.name || p.memberName,
      month: p.month,
      amount: p.amount,
      receiptNo: p.receiptNo,
      organizerName: currentGroup.organizerName,
      organizerPhone: currentGroup.organizerPhone
    });
    openDeviceSms(phone, text);
  };

  const handleShareLoginWhatsApp = (m: Member) => {
    const targetGroup = groups.find(g => g.id === (m.groupId || currentGroup.id)) || currentGroup;
    const groupName = language === 'te' ? targetGroup.nameTe : targetGroup.name;
    const appUrl = window.location.origin;
    const msg = encodeURIComponent(
      `నమస్కారం ${m.nameTe || m.name} గారు,\n` +
      `శ్రీ వరలక్ష్మి చిట్స్ లో మీ మెంబర్షిప్ #${m.memberNo} నమోదు చేయబడింది.\n\n` +
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

  // Set of all months that already have a chit lifting / winner recorded
  const completedMonthSet = useMemo(() => {
    return new Set(groupLiftings.map(l => Number(l.month)));
  }, [groupLiftings]);

  // Available remaining unlifted months (completed months are NEVER shown!)
  const unliftedMonths = useMemo(() => {
    return Array.from({ length: currentGroup.totalMonths || 20 }, (_, i) => i + 1)
      .filter(m => !completedMonthSet.has(m));
  }, [currentGroup.totalMonths, completedMonthSet]);

  // Next available unlifted month
  const nextPendingMonth = unliftedMonths.length > 0 ? unliftedMonths[0] : (currentGroup.totalMonths || 20);

  // Chit Lifting & Monthly Auction State (పాట పాడుకున్నవారు)
  const [isLiftingModalOpen, setIsLiftingModalOpen] = useState(false);
  const [liftMonth, setLiftMonth] = useState<number>(() => {
    return unliftedMonths.length > 0 ? unliftedMonths[0] : currentGroup.currentMonth;
  });
  const [liftMemberId, setLiftMemberId] = useState('');
  const [liftNotes, setLiftNotes] = useState('');
  const [liftError, setLiftError] = useState('');

  const handleOpenLiftingModal = () => {
    if (unliftedMonths.length === 0) {
      showToast(
        language === 'te' ? 'అన్ని చిట్స్ పూర్తయ్యాయి' : 'All Chits Completed',
        language === 'te' ? 'ఈ గ్రూప్‌లోని అన్ని 20 నెలల చిట్స్ ఇప్పటికే పూర్తయ్యాయి.' : 'All 20 monthly chits have already been completed.',
        'info'
      );
      return;
    }
    const defaultMonth = unliftedMonths.includes(currentGroup.currentMonth)
      ? currentGroup.currentMonth
      : unliftedMonths[0];
    setLiftMonth(defaultMonth);
    setLiftMemberId('');
    setLiftNotes('');
    setLiftError('');
    setIsLiftingModalOpen(true);
  };

  const calcChitVal = currentGroup.totalValue || 200000;
  const calcComm = (calcChitVal * (currentGroup.commissionPercent || 5)) / 100;
  const calcNetDistributed = calcChitVal; // Full ₹2,00,000 received by winning member
  const fixedTakenInstallment = currentGroup.fixedTakenInstallment || 11500;

  const handleSaveLiftingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiftError('');

    if (completedMonthSet.has(Number(liftMonth))) {
      setLiftError(
        language === 'te'
          ? `నెల ${liftMonth} చిట్ ఇప్పటికే పూర్తయింది!`
          : `Month ${liftMonth} chit has already been completed!`
      );
      return;
    }

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
      liftType: 'auction',
      chitValue: calcChitVal,
      bidDiscount: 0,
      organizerCommission: calcComm,
      netDistributedAmount: calcNetDistributed,
      dividendPerMember: 0,
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
  // Commission is earned strictly from actual completed monthly auctions (₹10,000 per completed auction/lifting)
  const monthlyCommissionAmount = (currentGroup.totalValue * (currentGroup.commissionPercent || 5)) / 100;
  const totalCommissionEarned = groupLiftings.reduce((sum, l) => sum + (l.organizerCommission || 0), 0);
  const completedAuctionsCount = groupLiftings.length;

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
    const dueAmount = getInstallmentForMember(currentGroup.currentMonth, member, language);
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
          <div className="month-picker-pill">
            <Calendar size={15} />
            <span>{language === 'te' ? 'ప్రస్తుత నెల:' : 'Active Month:'}</span>
            <select
              value={currentGroup.currentMonth}
              onChange={e => setCurrentMonth(parseInt(e.target.value, 10))}
              className="month-select"
            >
              {Array.from({ length: currentGroup.totalMonths }, (_, i) => i + 1).map(m => {
                const isLifted = completedMonthSet.has(m);
                return (
                  <option key={m} value={m}>
                    {getMonthDisplayName(m, language)} {isLifted ? (language === 'te' ? '✓ (పూర్తయింది)' : '✓ (Completed)') : ''}
                  </option>
                );
              })}
            </select>
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

          {/* Metric 4: Total Chit Amount */}
          <div className="metric-box purple">
            <span className="metric-label">
              {language === 'te' ? 'మొత్తం చిట్ అమౌంట్' : 'Total Chit Amount'}
            </span>
            <div className="metric-value">
              <span className="cur">₹</span>{(currentGroup.totalValue || 200000).toLocaleString('en-IN')}
            </div>
            <span className="metric-sub">
              {language === 'te'
                ? `${currentGroup.totalMonths || 20} నెలలు • 20 మంది సభ్యులు`
                : `${currentGroup.totalMonths || 20} Months • 20 Members`}
            </span>
          </div>
        </div>

        {/* Quick Action Tools Bar (Compact & Responsive on Mobile) */}
        <div className="org-tools-bar">
          <button
            type="button"
            className="btn-tool-lottery"
            onClick={handleOpenLiftingModal}
            title={language === 'te' ? 'నెలసరి చిట్ నమోదు చేయండి' : 'Record Monthly Chit / Lift'}
          >
            <Award size={15} className="shrink-0" />
            <span>
              {language === 'te'
                ? (completedMonthSet.has(currentGroup.currentMonth)
                    ? (unliftedMonths.length > 0 ? `+ నెల ${nextPendingMonth} చిట్ నమోదు` : `అన్ని చిట్స్ పూర్తయ్యాయి`)
                    : `ఈ నెల చిట్ నమోదు`)
                : (completedMonthSet.has(currentGroup.currentMonth)
                    ? (unliftedMonths.length > 0 ? `+ Record Month ${nextPendingMonth} Lift` : `All Lifts Completed`)
                    : `Record Chit / Lift`)}
            </span>
          </button>

          <button
            type="button"
            className="btn-tool-whatsapp"
            onClick={() => setIsBroadcastModalOpen(true)}
            title={language === 'te' ? 'గ్రూప్ సభ్యులందరికీ వాట్సాప్ సందేశం' : 'WhatsApp Group Broadcast Notice'}
          >
            <MessageCircle size={15} className="text-emerald-400 shrink-0" />
            <span>{language === 'te' ? 'WhatsApp బ్రాడ్‌కాస్ట్' : 'WhatsApp Broadcast'}</span>
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
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${p.paymentMode === 'Cash'
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
                        setApprovedPaymentSuccess({ payment: p, member: mem || null });
                      }}
                      title="Mark as Received & Send Receipt"
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

      {/* 3.5 MASTER 20-MONTH SCHEDULE (Official Schedule with Option A Winner Tracking) */}
      <section className="schedule-section luxury-card mb-6">
        <div className="section-header-row flex justify-between items-center flex-wrap gap-3 pb-3 border-b border-gray-800">
          <div
            className="cursor-pointer select-none flex-1 min-w-[240px]"
            onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
            title={isScheduleExpanded ? (language === 'te' ? 'టేబుల్ మడవడానికి క్లిక్ చేయండి' : 'Click to collapse table') : (language === 'te' ? 'టేబుల్ తెరవడానికి క్లిక్ చేయండి' : 'Click to expand table')}
          >
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Calendar size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="section-title m-0 text-base font-bold text-white flex items-center gap-1.5">
                    <span>{language === 'te' ? 'ప్రధాన 20 నెలల పట్టిక (Master Schedule)' : 'Master 20-Month Schedule'}</span>
                    {isScheduleExpanded ? <ChevronUp size={16} className="text-amber-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 whitespace-nowrap">
                    {groupLiftings.length} / {currentGroup.totalMonths} {language === 'te' ? 'నెలలు లిఫ్ట్ అయ్యాయి' : 'Lifted'}
                  </span>
                </div>
                <p className="section-subtitle m-0 text-xs text-gray-400 mt-0.5">
                  {language === 'te'
                    ? 'మొత్తం చిట్ విలువ: ₹2,00,000 • 20 నెలలు • ప్రతి నెల 10వ తేదీ లోపు చెల్లించవలెను'
                    : 'Total Chit Value: ₹2,00,000 • 20 Months • Pay before 10th of every month'}
                </p>
              </div>
            </div>
          </div>

          <div className="auction-header-actions flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn-auction-action"
              onClick={handleOpenLiftingModal}
            >
              <Award size={14} className="shrink-0" />
              <span>
                {language === 'te'
                  ? (completedMonthSet.has(currentGroup.currentMonth)
                      ? (unliftedMonths.length > 0 ? `+ నెల ${nextPendingMonth} చిట్ నమోదు` : `అన్ని చిట్స్ పూర్తయ్యాయి`)
                      : `+ ఈ నెల చిట్ నమోదు`)
                  : (completedMonthSet.has(currentGroup.currentMonth)
                      ? (unliftedMonths.length > 0 ? `+ Record Month ${nextPendingMonth} Lift` : `All Lifts Completed`)
                      : `+ Record Chit / Lift`)}
              </span>
            </button>
            <button
              type="button"
              className="btn-auction-action"
              onClick={() => {
                if (completedMonthSet.has(currentGroup.currentMonth)) {
                  showToast(
                    language === 'te' ? `నెల ${currentGroup.currentMonth} పూర్తయింది` : `Month ${currentGroup.currentMonth} Completed`,
                    language === 'te'
                      ? `నెల ${currentGroup.currentMonth} చిట్ ఇప్పటికే పూర్తయింది. లక్కీ డ్రా కేవలం చిట్ ఎత్తని నెలలకే నిర్వహించబడుతుంది.`
                      : `Month ${currentGroup.currentMonth} chit has already been lifted. Lucky draw is only for pending months.`,
                    'info'
                  );
                  return;
                }
                onOpenLottery();
              }}
            >
              <Dices size={14} className="shrink-0" />
              <span>{language === 'te' ? '🎲 లక్కీ డ్రా నిర్వహించండి' : '🎲 Run Lucky Draw'}</span>
            </button>
          </div>
        </div>

        {/* Collapsed Compact Preview Bar */}
        {!isScheduleExpanded && (
          <div
            className="collapsed-preview-strip"
            onClick={() => setIsScheduleExpanded(true)}
            role="button"
            tabIndex={0}
            title={language === 'te' ? '20 నెలల పూర్తి పట్టిక తెరవడానికి క్లిక్ చేయండి' : 'Click to open 20-Month Table'}
          >
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="font-semibold text-amber-400">
                {language === 'te' ? `ప్రస్తుతం: నెల #${currentGroup.currentMonth}` : `Current: Month #${currentGroup.currentMonth}`}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">
                {language === 'te' ? 'తీసుకోని వారి వాయిదా: ' : 'Chit Not Taken: '}
                <strong className="text-amber-300">
                  ₹{getScheduleNotTakenAmount(MASTER_SCHEDULE.find(m => m.month === currentGroup.currentMonth) || MASTER_SCHEDULE[0], language).toLocaleString('en-IN')}
                </strong>
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">
                {language === 'te' ? 'తీసుకున్న వారి వాయిదా: ' : 'Chit Taken Rate: '}
                <strong className="text-emerald-400">₹{MASTER_SCHEDULE[0].takenAmount.toLocaleString('en-IN')}</strong>
              </span>
            </div>
            <ChevronDown size={16} className="text-amber-400" />
          </div>
        )}

        {/* 4-COLUMN MASTER TABLE WITH OPTION A WINNER BADGES */}
        {isScheduleExpanded && (
          <div className="table-responsive-container mt-3 animate-fade">
          <table className="master-table">
            <thead>
              <tr>
                <th className="th-month">{language === 'te' ? 'నెల & విజేత' : 'Month & Winner'}</th>
                <th className="th-val">{language === 'te' ? 'చిట్ విలువ' : 'Chit Value'}</th>
                <th className="th-nottaken">
                  <div className="th-stacked-header">
                    <span>{language === 'te' ? 'చిట్ తీసుకోని వారి వాయిదా' : 'Chit Not Taken'}</span>
                    <span className="th-sub-note">{language === 'te' ? '(తగ్గింపు వాయిదా)' : '(Discounted)'}</span>
                  </div>
                </th>
                <th className="th-taken">
                  <div className="th-stacked-header">
                    <span>{language === 'te' ? 'చిట్ తీసుకున్న వారి వాయిదా' : 'Chit Taken Rate'}</span>
                    <span className="th-sub-note">{language === 'te' ? '(స్థిర వాయిదా)' : '(Fixed Post-Lift)'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {MASTER_SCHEDULE.map(item => {
                const isCurrent = item.month === currentGroup.currentMonth;
                const isPast = item.month < currentGroup.currentMonth;
                const notTaken = getScheduleNotTakenAmount(item, language);
                const monthLifting = groupLiftings.find(l => l.month === item.month);
                const winnerName = monthLifting
                  ? (language === 'te' ? (monthLifting.memberNameTe || monthLifting.memberName) : monthLifting.memberName)
                  : null;

                return (
                  <tr key={item.month} className={`schedule-row ${isCurrent ? 'current-active-row active-row' : ''} ${isPast ? 'past-row' : ''}`}>
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
                        {winnerName && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="sched-winner-pill" title={language === 'te' ? `చిట్ తీసుకున్నవారు: ${winnerName}` : `Lifted by: ${winnerName}`}>
                              👑 {winnerName} {monthLifting?.memberNo ? `(#${monthLifting.memberNo})` : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <Check size={10} className="text-emerald-400 font-bold" />
                              <span>{language === 'te' ? 'పూర్తయింది' : 'Completed'}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="td-val font-mono font-bold text-gray-200">
                      ₹{item.chitValue.toLocaleString('en-IN')}
                    </td>
                    <td className="td-nottaken font-mono font-bold text-amber-400">
                      {notTaken === 0 ? '₹0' : `₹${notTaken.toLocaleString('en-IN')}`}
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
        )}
      </section>

      {/* 4. MEMBER LEDGER & TOTAL PAID TABLE */}
      <section className="member-ledger-section luxury-card">
        <div className="ledger-header-row flex justify-between items-start flex-wrap gap-3 pb-3 border-b border-gray-800">
          <div
            className="cursor-pointer select-none flex-1 min-w-[240px]"
            onClick={() => setIsMembersExpanded(!isMembersExpanded)}
            title={isMembersExpanded ? (language === 'te' ? 'సభ్యుల లిస్ట్ మడవడానికి క్లిక్ చేయండి' : 'Click to collapse members') : (language === 'te' ? 'సభ్యుల లిస్ట్ తెరవడానికి క్లిక్ చేయండి' : 'Click to view members')}
          >
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="section-title m-0 text-base font-bold text-white flex items-center gap-1.5">
                    <span>{language === 'te' ? `${currentGroup.nameTe} - సభ్యుల పూర్తి డైరెక్టరీ` : `${currentGroup.name} - Member Directory`}</span>
                    {isMembersExpanded ? <ChevronUp size={16} className="text-blue-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 whitespace-nowrap">
                    {groupMembers.length} {language === 'te' ? 'సభ్యులు' : 'Members'}
                  </span>
                </div>
                <p className="section-subtitle m-0 text-xs text-gray-400 mt-0.5">
                  {language === 'te'
                    ? 'సభ్యుల చెల్లింపు వివరాలు, ఇప్పటివరకు చెల్లించిన మొత్తం మరియు లక్కీ డ్రా అర్హత'
                    : 'Live tracking of each member total paid and chit status'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: + Add Member */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn-add-member-pill"
              onClick={() => { setSelectedEnrollGroupId(currentGroup.id); setIsAddMemberOpen(true); setAddMemberError(''); setEnrolledSuccessMember(null); }}
              title={language === 'te' ? 'కొత్త సభ్యుని చేర్చండి' : 'Add New Member'}
            >
              <UserPlus size={15} />
              <span>{language === 'te' ? '+ సభ్యుని చేర్చండి' : '+ Add Member'}</span>
            </button>
          </div>
        </div>

        {/* Collapsed Compact Preview Bar */}
        {!isMembersExpanded && (
          <div
            className="collapsed-preview-strip"
            onClick={() => setIsMembersExpanded(true)}
            role="button"
            tabIndex={0}
            title={language === 'te' ? 'సభ్యుల పూర్తి వివరాలు తెరవడానికి క్లిక్ చేయండి' : 'Click to view member details'}
          >
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="text-gray-300">
                {language === 'te'
                  ? <>నమోదైన సభ్యులు: <strong className="text-blue-400">{groupMembers.length} మంది</strong></>
                  : <>Enrolled Members: <strong className="text-blue-400">{groupMembers.length}</strong></>}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-emerald-400 font-semibold">
                {language === 'te' ? `డ్రాకు అర్హులు: ${eligibleMembersCount} మంది` : `Draw Eligible: ${eligibleMembersCount}`}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-amber-400 font-semibold">
                {language === 'te' ? `చిట్ ఎత్తినవారు: ${liftedMembersCount} మంది` : `Chit Lifted: ${liftedMembersCount}`}
              </span>
            </div>
            <ChevronDown size={16} className="text-blue-400" />
          </div>
        )}

        {/* Expanded Content: Search, Filter, Toolbar & Member List */}
        {isMembersExpanded && (
          <div className="member-directory-body mt-3 animate-fade">
            {/* Search & Filter */}
            <div className="ledger-controls mb-3">
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
            </div>

        {/* Directory Toolbar: Count on Left, View Mode Switcher on Right */}
        {filteredMembers.length > 0 && (
          <div className="member-directory-toolbar">
            <span className="member-count-badge">
              {language === 'te'
                ? <>మొత్తం సభ్యులు: <strong>{filteredMembers.length} మంది</strong></>
                : <>Total Members: <strong>{filteredMembers.length}</strong></>}
            </span>

            <div className="member-view-toggle">
              <button
                type="button"
                className={`view-mode-btn ${memberViewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setMemberViewMode('cards')}
                title={language === 'te' ? 'కార్డ్స్ వ్యూ (స్మార్ట్ మోడల్)' : 'Smart Cards View (Mobile Friendly)'}
              >
                <LayoutGrid size={13} />
                <span>{language === 'te' ? 'కార్డ్స్' : 'Cards'}</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${memberViewMode === 'table' ? 'active' : ''}`}
                onClick={() => setMemberViewMode('table')}
                title={language === 'te' ? 'టేబుల్ వ్యూ (పట్టిక)' : 'Table View'}
              >
                <TableIcon size={13} />
                <span>{language === 'te' ? 'టేబుల్' : 'Table'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
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
              onClick={() => { setSelectedEnrollGroupId(currentGroup.id); setIsAddMemberOpen(true); setAddMemberError(''); setEnrolledSuccessMember(null); }}
            >
              <UserPlus size={14} />
              <span>{language === 'te' ? '+ సభ్యుని నమోదు చేయండి' : '+ Add Member'}</span>
            </button>
          </div>
        ) : memberViewMode === 'cards' ? (
          /* ============================================================
             NEW SMART EXPANDABLE MEMBER CARDS (Click to Expand / Collapse)
             ============================================================ */
          <div className="member-cards-list">
            {filteredMembers.map(m => {
              const isAuctionDone = groupLiftings.some(l => l.month === currentGroup.currentMonth);
              const monthDue = getInstallmentForMember(currentGroup.currentMonth, m, language);
              const curPay = groupPayments.find(p => p.memberId === m.id && p.month === currentGroup.currentMonth && p.status === 'approved')
                || groupPayments.find(p => p.memberId === m.id && p.month === currentGroup.currentMonth && p.status === 'pending');
              const isPaid = curPay?.status === 'approved';
              const isPending = curPay?.status === 'pending';
              const isPinVisible = Boolean(showMemberPins[m.id]);
              const isExpanded = expandedMemberId === m.id;

              return (
                <div
                  key={m.id}
                  className={`member-expandable-card ${isExpanded ? 'active' : ''}`}
                >
                  {/* Clickable Card Header (Row) */}
                  <div
                    className="member-card-header"
                    onClick={() => setExpandedMemberId(prev => prev === m.id ? null : m.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className="member-card-header-left">
                      <span className="member-card-num">#{m.memberNo}</span>
                      <div className="member-card-names">
                        <span className="member-name-primary">
                          {language === 'te' ? m.nameTe : m.name}
                        </span>
                        <span className="member-phone-label font-mono">
                          {m.phone}
                        </span>
                      </div>
                    </div>

                    <div className="member-card-header-right">
                      {isPaid ? (
                        <span className="card-badge-paid">
                          <CheckCircle2 size={12} />
                          <span>{language === 'te' ? 'చెల్లించారు' : 'Paid'}</span>
                        </span>
                      ) : isPending ? (
                        <span className="card-badge-pending">
                          <Clock size={12} />
                          <span>{language === 'te' ? 'పరిశీలనలో' : 'Pending'}</span>
                        </span>
                      ) : !isAuctionDone ? (
                        <span className="card-badge-pending bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          <Gavel size={12} />
                          <span>{language === 'te' ? 'పాట పెండింగ్' : 'Auction Pending'}</span>
                        </span>
                      ) : (
                        <span className="card-badge-due">
                          <span>{language === 'te' ? 'బాకీ' : 'Due'}</span>
                          <span className="font-mono font-bold">₹{monthDue.toLocaleString('en-IN')}</span>
                        </span>
                      )}
                      <ChevronDown size={16} className={`member-card-chevron ${isExpanded ? 'open' : ''}`} />
                    </div>
                  </div>

                  {/* Expandable Drawer (shown ONLY when clicked!) */}
                  {isExpanded && (
                    <div className="member-card-drawer animate-fade">
                      <div className="drawer-details-grid">
                        {/* PIN Box */}
                        <div className="drawer-info-box">
                          <span className="drawer-info-label">{language === 'te' ? 'లాగిన్ పిన్' : 'Login PIN'}</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono font-bold text-amber-300 tracking-wider">
                              {isPinVisible ? m.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              className="p-1 text-gray-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMemberPins(prev => ({ ...prev, [m.id]: !prev[m.id] }));
                              }}
                              title={isPinVisible ? 'Hide PIN' : 'View PIN'}
                            >
                              {isPinVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Chit Status */}
                        <div className="drawer-info-box">
                          <span className="drawer-info-label">{language === 'te' ? 'చిట్ స్థితి' : 'Chit Status'}</span>
                          <div className="mt-1">
                            {m.hasLiftedChit ? (
                              <span className="badge-status-lifted">
                                <Award size={13} />
                                <span>{language === 'te' ? `నెల ${m.liftedMonth} లో ఎత్తారు` : `Lifted Month ${m.liftedMonth}`}</span>
                              </span>
                            ) : (
                              <span className="badge-status-eligible">
                                <CheckCircle2 size={13} />
                                <span>{language === 'te' ? 'లక్కీ డ్రాకు అర్హులు' : 'Eligible for Draw'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Total Paid Row */}
                      <div className="drawer-total-paid-strip">
                        <span>{language === 'te' ? 'ఇప్పటివరకు మొత్తం చెల్లించినది:' : 'Total Paid So Far:'}</span>
                        <strong className="text-amber-400 font-mono text-sm">₹{m.totalPaidSoFar.toLocaleString('en-IN')}</strong>
                      </div>

                      {/* Action Buttons Grid */}
                      <div className="drawer-actions-grid">
                        <button
                          type="button"
                          className="btn-drawer-action btn-drawer-sms"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareLoginSms(m);
                          }}
                          title="Send SMS PIN to Member"
                        >
                          <MessageSquare size={14} />
                          <span>SMS PIN</span>
                        </button>

                        <button
                          type="button"
                          className="btn-drawer-action btn-drawer-wa"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareLoginWhatsApp(m);
                          }}
                          title="Share Login Details via WhatsApp"
                        >
                          <Send size={14} />
                          <span>{language === 'te' ? 'వాట్సాప్' : 'WhatsApp'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-drawer-action btn-drawer-passbook"
                          onClick={(e) => {
                            e.stopPropagation();
                            switchUser(m.id);
                          }}
                          title={language === 'te' ? 'ఈ సభ్యుని పాస్‌బుక్ చూడండి' : 'Open Passbook as Member'}
                        >
                          <UserCheck size={14} />
                          <span>{language === 'te' ? 'పాస్‌బుక్' : 'Passbook'}</span>
                        </button>

                        {isPaid && curPay ? (
                          <>
                            <button
                              type="button"
                              className="btn-drawer-action btn-drawer-receipt"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenReceipt(curPay, m);
                              }}
                              title={language === 'te' ? 'రసీదు వీక్షించండి' : 'View Receipt'}
                            >
                              <FileCheck size={14} />
                              <span>{language === 'te' ? 'రసీదు' : 'Receipt'}</span>
                            </button>
                            <button
                              type="button"
                              className="btn-drawer-action btn-drawer-sms"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendPaymentReceiptSms(curPay, m);
                              }}
                              title="Send Payment Receipt SMS"
                            >
                              <MessageSquare size={14} />
                              <span>{language === 'te' ? 'రసీదు SMS' : 'SMS Receipt'}</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-drawer-action btn-drawer-reminder"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReminder(m);
                            }}
                            title="Send Due Reminder"
                          >
                            <Send size={14} />
                            <span>{language === 'te' ? 'రిమైండర్' : 'Remind'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-drawer-action btn-drawer-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditMember(m);
                          }}
                          title={language === 'te' ? 'సభ్యుని వివరాలు సవరించండి' : 'Edit Member Details'}
                        >
                          <Edit2 size={14} />
                          <span>{language === 'te' ? 'సవరించు' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-drawer-action btn-drawer-delete"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          <span>{language === 'te' ? 'తొలగించు' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ============================================================
             TRADITIONAL TABLE VIEW (Optional Toggle for Desktop)
             ============================================================ */
          <>
            <div className="table-scroll-hint-bar">
              <span className="scroll-hint-text">
                {language === 'te' ? '👉 పూర్తి 9 కాలమ్స్ వివరాల కోసం పట్టికను పక్కకు జరపండి' : '👉 Swipe horizontally to view all 9 columns'}
              </span>
            </div>

            <div className="table-responsive-container ledger-table-wrap">
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
                    const isAuctionDone = groupLiftings.some(l => l.month === currentGroup.currentMonth);
                    const monthDue = getInstallmentForMember(currentGroup.currentMonth, m, language);
                    const curPay = groupPayments.find(p => p.memberId === m.id && p.month === currentGroup.currentMonth && p.status === 'approved')
                      || groupPayments.find(p => p.memberId === m.id && p.month === currentGroup.currentMonth && p.status === 'pending');
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
                          ) : !isAuctionDone ? (
                            <span className="status-badge-pending bg-amber-500/10 border border-amber-500/20 text-amber-300">
                              {language === 'te' ? 'పాట పెండింగ్' : 'Auction Pending'}
                            </span>
                          ) : (
                            <span className="status-badge-due">{language === 'te' ? 'బాకీ ఉంది' : 'Due'}</span>
                          )}
                        </td>
                        <td className="font-bold text-amber-400">
                          ₹{m.totalPaidSoFar.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <div className="action-buttons-cell flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              className="btn-cell-sms text-xs py-1 px-2 flex items-center gap-1"
                              onClick={() => handleShareLoginSms(m)}
                              title="Send Login Password/PIN via SMS (English)"
                            >
                              <MessageSquare size={13} />
                              <span className="text-[11px]">SMS PIN</span>
                            </button>

                            <button
                              type="button"
                              className="btn-cell-whatsapp text-xs py-1 px-2 flex items-center gap-1"
                              onClick={() => handleShareLoginWhatsApp(m)}
                              title={language === 'te' ? 'లాగిన్ వివరాలు వాట్సాప్‌లో పంపండి' : 'Share Login Details on WhatsApp'}
                            >
                              <Send size={13} />
                              <span className="text-[11px]">{language === 'te' ? 'వాట్సాప్' : 'WhatsApp'}</span>
                            </button>

                            {isPaid && curPay ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-cell-receipt"
                                  onClick={() => onOpenReceipt(curPay, m)}
                                  title={language === 'te' ? 'రసీదు వీక్షించండి' : 'View Receipt'}
                                >
                                  <FileCheck size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-cell-sms text-xs py-1 px-2 flex items-center gap-1"
                                  onClick={() => handleSendPaymentReceiptSms(curPay, m)}
                                  title="Send SMS Receipt to Member (English)"
                                >
                                  <MessageSquare size={13} />
                                  <span className="text-[11px]">SMS</span>
                                </button>
                              </>
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

                            <button
                              type="button"
                              className="btn-cell-edit text-xs py-1 px-2 flex items-center gap-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
                              onClick={() => handleOpenEditMember(m)}
                              title={language === 'te' ? 'సభ్యుని వివరాలు సవరించండి' : 'Edit Member Details'}
                            >
                              <Edit2 size={13} />
                              <span className="text-[11px]">{language === 'te' ? 'సవరించు' : 'Edit'}</span>
                            </button>

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
            </div>
          </>
        )}
          </div>
        )}
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

      {/* 6. MODAL: WHATSAPP GROUP BROADCAST NOTICE (User Specified Format) */}
      {isBroadcastModalOpen && (() => {
        const activeMonthLifting = groupLiftings.find(l => l.month === currentGroup.currentMonth);
        const winnerMember = activeMonthLifting
          ? groupMembers.find(m => m.id === activeMonthLifting.memberId)
          : null;

        const broadcastWinnerName = activeMonthLifting
          ? (language === 'te' ? (activeMonthLifting.memberNameTe || activeMonthLifting.memberName) : activeMonthLifting.memberName)
          : (language === 'te' ? 'ఇంకా పాట జరగలేదు (Pending Auction)' : 'Auction Pending');

        const activeMonthSchedule = MASTER_SCHEDULE.find(s => s.month === currentGroup.currentMonth);
        const defaultInstallmentAmount = activeMonthSchedule
          ? (language === 'te' ? activeMonthSchedule.notTakenAmountTe || activeMonthSchedule.notTakenAmount : activeMonthSchedule.notTakenAmount)
          : 10000;

        const broadcastLoss = activeMonthLifting && activeMonthLifting.liftType === 'auction'
          ? `₹${activeMonthLifting.bidDiscount.toLocaleString('en-IN')}`
          : (activeMonthLifting?.liftType === 'lottery' ? '₹0 (లక్కీ డ్రా)' : '-');

        const divAmount = activeMonthLifting?.dividendPerMember || 0;
        const broadcastBonus = divAmount > 0 ? `₹${divAmount.toLocaleString('en-IN')}` : '-';
        const broadcastAmountToPay = divAmount > 0
          ? `₹${Math.max(0, currentGroup.monthlyInstallment - divAmount).toLocaleString('en-IN')}`
          : `₹${defaultInstallmentAmount.toLocaleString('en-IN')}`;

        const monthNameText = getMonthDisplayName(currentGroup.currentMonth, language);

        // Receiver PhonePe number & Name: ALWAYS THE PERSON WHO LIFTED THE CHIT (Winner)!
        const receiverName = customReceiverName.trim() || (winnerMember
          ? (language === 'te' ? (winnerMember.nameTe || winnerMember.name) : winnerMember.name)
          : (activeMonthLifting ? activeMonthLifting.memberName : (language === 'te' ? 'చిట్టీ విజేత పేరు' : 'Chit Winner Name')));

        const receiverPhone = customReceiverPhone.trim() || (winnerMember ? winnerMember.phone : (language === 'te' ? 'విజేత ఫోన్‌పే నంబర్' : 'Winner PhonePe Number'));

        const officialBroadcastText =
          `📢 *${language === 'te' ? currentGroup.nameTe : currentGroup.name}*
నెల ${currentGroup.currentMonth} వేలం పాట వివరాలు & వాయిదా నోటీస్
━━━━━━━━━━━━━━━━━━━━━
• Chit Scheme : ₹${currentGroup.totalValue.toLocaleString('en-IN')} (${currentGroup.totalMonths} Months)
• Month       : నెల ${currentGroup.currentMonth} (${monthNameText})
• చిట్టీ విజేత : ${broadcastWinnerName}
• Loss (పాట తగ్గింపు)  : ${broadcastLoss}
• Bonus (సభ్యుల లాభం) : ${broadcastBonus}
• Amount to Pay (వాయిదా): ${broadcastAmountToPay}
━━━━━━━━━━━━━━━━━━━━━
⚠️ *Plz arrange amount with in 3 days.*
(సభ్యులందరూ మీ వాయిదా సొమ్మును నేరుగా ఈ నెల చిట్టీ తీసుకున్న విజేతకు PhonePe/GPay ద్వారా పంపవలసిందిగా కోరుతున్నాము.)

📱 PhonePe / GPay : ${receiverPhone}
👤 Name (గ్రహీత)   : ${receiverName}
━━━━━━━━━━━━━━━━━━━━━
నిర్వాహకుడు: శివ (${currentGroup.organizerPhone})
ధన్యవాదాలు! - శ్రీ వరలక్ష్మి చిట్స్`;

        return (
          <div className="modal-backdrop animate-fade" onClick={() => setIsBroadcastModalOpen(false)}>
            <div className="login-modal-card luxury-card max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-emerald-400" />
                  <h3 className="text-white font-bold text-base">
                    {language === 'te' ? 'WhatsApp గ్రూప్ బ్రాడ్‌కాస్ట్ నోటీస్' : 'WhatsApp Group Broadcast Notice'}
                  </h3>
                </div>
                <button type="button" className="btn-modal-close static" onClick={() => setIsBroadcastModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-amber-300 mb-2.5">
                {language === 'te'
                  ? 'ఈ క్రింది సందేశాన్ని మీ చిట్ వాట్సాప్ గ్రూప్‌లో షేర్ చేయండి:'
                  : 'Share this notice directly to your chit WhatsApp group:'}
              </p>

              {/* Receiver Info Box (Winner Details) */}
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 mb-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">
                    {language === 'te' ? '💰 డబ్బులు అందుకోవలసిన చిట్టీ విజేత (Receiver):' : '💰 Chit Winner (Money Receiver Details):'}
                  </span>
                  {winnerMember && (
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ ఆటోమేటిక్ సెలెక్ట్
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px]">
                      {language === 'te' ? 'గ్రహీత పేరు (Name):' : 'Receiver Name:'}
                    </label>
                    <input
                      type="text"
                      className="form-input text-xs py-1.5"
                      placeholder={winnerMember ? (winnerMember.nameTe || winnerMember.name) : 'విజేత పేరు'}
                      value={customReceiverName}
                      onChange={e => setCustomReceiverName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1 text-[11px]">
                      {language === 'te' ? 'PhonePe / GPay నంబర్:' : 'PhonePe / GPay No:'}
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      className="form-input text-xs py-1.5 font-mono"
                      placeholder={winnerMember ? winnerMember.phone : '10-digit mobile'}
                      value={customReceiverPhone}
                      onChange={e => setCustomReceiverPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 m-0">
                  {language === 'te'
                    ? '* సభ్యులందరూ ఈ నంబర్‌కే ఫోన్‌పే ద్వారా నేరుగా డబ్బులు పంపుతారు.'
                    : '* All members will send payments directly to this PhonePe number.'}
                </p>
              </div>

              {/* Live WhatsApp Chat Bubble Preview */}
              <div className="bg-[#0b141a] border border-[#202c33] rounded-2xl p-3.5 mb-3.5 shadow-inner">
                <div className="text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed select-all">
                  {officialBroadcastText}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  className="btn-whatsapp-share w-full py-2.5 flex items-center justify-center gap-2 font-bold text-sm shadow-lg"
                  onClick={() => {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(officialBroadcastText)}`, '_blank');
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{language === 'te' ? '💬 WhatsApp గ్రూప్‌లో షేర్ చేయండి' : '💬 Share on WhatsApp Group'}</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(officialBroadcastText);
                    setIsBroadcastCopied(true);
                    setTimeout(() => setIsBroadcastCopied(false), 2500);
                  }}
                >
                  <Copy size={14} />
                  <span>
                    {isBroadcastCopied
                      ? (language === 'te' ? '✓ సందేశం కాపీ అయింది!' : '✓ Message Copied!')
                      : (language === 'te' ? '📋 సందేశం కాపీ చేయండి (Copy Text)' : '📋 Copy Text')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

            {enrolledSuccessMember ? (
              <div className="enroll-success-stage animate-fade">
                {/* Glowing Success Header */}
                <div className="enroll-success-badge-wrap">
                  <div className="enroll-success-badge">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="enroll-success-title">
                      {language === 'te' ? 'సభ్యుడు విజయవంతంగా చేర్చబడ్డాడు!' : 'Member Enrolled Successfully!'}
                    </h4>
                    <p className="enroll-success-sub">
                      {language === 'te'
                        ? 'లాగిన్ పాస్‌వర్డ్ & వివరాలు సిద్ధమయ్యాయి'
                        : 'Login credentials generated • Ready to share'}
                    </p>
                  </div>
                </div>

                {/* Digital Luxury Passbook Slip */}
                <div className="membership-slip-card">
                  {/* Slip Header */}
                  <div className="membership-slip-header">
                    <div className="membership-slip-brand">
                      <span className="slip-brand-logo">🪙</span>
                      <div>
                        <div className="slip-brand-title">SRI VARALAXMI CHITS</div>
                        <div className="slip-brand-sub">{enrolledSuccessMember.groupName} • ₹2,00,000 Scheme</div>
                      </div>
                    </div>
                    <span className="slip-group-badge">
                      {enrolledSuccessMember.groupName}
                    </span>
                  </div>

                  {/* Perforated Divider */}
                  <div className="slip-divider">
                    <span className="slip-notch left" />
                    <span className="slip-line" />
                    <span className="slip-notch right" />
                  </div>

                  {/* Slip Body Details */}
                  <div className="membership-slip-body">
                    {/* Member Name */}
                    <div className="slip-info-row">
                      <span className="slip-label">
                        {language === 'te' ? 'సభ్యుని పేరు' : 'Member Name'}
                      </span>
                      <strong className="slip-val-name">
                        {enrolledSuccessMember.name}
                      </strong>
                    </div>

                    {/* Mobile Number */}
                    <div className="slip-info-row">
                      <span className="slip-label">
                        {language === 'te' ? 'మొబైల్ నంబర్' : 'Mobile Number'}
                      </span>
                      <span className="slip-val-phone font-mono">
                        +91 {enrolledSuccessMember.phone}
                      </span>
                    </div>

                    {/* Highlighted Security PIN Box with 1-Tap Copy */}
                    <div className="slip-pin-highlight-box">
                      <div className="pin-highlight-left">
                        <span className="pin-box-label">
                          {language === 'te' ? 'సెక్యూరిటీ పిన్ (Login PIN)' : 'Security PIN (Password)'}
                        </span>
                        <div className="pin-box-value font-mono">
                          {enrolledSuccessMember.pin}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-copy-pin"
                        onClick={() => {
                          navigator.clipboard.writeText(enrolledSuccessMember.pin);
                          setIsPinCopied(true);
                          setTimeout(() => setIsPinCopied(false), 2500);
                        }}
                        title={language === 'te' ? 'పిన్ కాపీ చేయండి' : 'Copy PIN'}
                      >
                        {isPinCopied ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold">{language === 'te' ? 'కాపీ అయింది!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>{language === 'te' ? 'కాపీ' : 'Copy PIN'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {enrolledSuccessMember.chitNote && (
                      <div className="slip-note-box">
                        ✨ {enrolledSuccessMember.chitNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Instant Share Buttons (Clean Side-by-Side 50/50 Grid) */}
                <div className="enroll-share-grid">
                  <button
                    type="button"
                    className="btn-whatsapp-share-modern"
                    onClick={() => {
                      const text = getEnrollmentSmsText({
                        memberName: enrolledSuccessMember.name,
                        phone: enrolledSuccessMember.phone,
                        pin: enrolledSuccessMember.pin,
                        groupName: enrolledSuccessMember.groupName,
                        organizerName: currentGroup.organizerName,
                        organizerPhone: currentGroup.organizerPhone,
                      });
                      openWhatsApp(enrolledSuccessMember.phone, text);
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="btn-sms-share-modern"
                    onClick={() => {
                      const text = getEnrollmentSmsText({
                        memberName: enrolledSuccessMember.name,
                        phone: enrolledSuccessMember.phone,
                        pin: enrolledSuccessMember.pin,
                        groupName: enrolledSuccessMember.groupName,
                        organizerName: currentGroup.organizerName,
                        organizerPhone: currentGroup.organizerPhone,
                      });
                      const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                      openDeviceSms(enrolledSuccessMember.phone, text);
                      if (!isMobile) {
                        showToast(
                          language === 'te' ? '📋 SMS సందేశం కాపీ అయింది!' : '📋 SMS Text Copied!',
                          language === 'te'
                            ? 'మొబైల్ ఫోన్‌లో అయితే నేరుగా SMS యాప్ ఓపెన్ అవుతుంది. కంప్యూటర్‌లో WhatsApp వాడండి.'
                            : 'Opens native SMS app on phones. On desktop PC, use WhatsApp.',
                          'info'
                        );
                      }
                    }}
                  >
                    <MessageSquare size={18} />
                    <span>SMS PIN</span>
                  </button>
                </div>

                {/* Secondary Action Buttons */}
                <div className="enroll-bottom-actions">
                  <button
                    type="button"
                    className="btn-enroll-another"
                    onClick={() => {
                      setEnrolledSuccessMember(null);
                      setIsPinCopied(false);
                    }}
                  >
                    <UserPlus size={15} />
                    <span>{language === 'te' ? '+ మరొకరిని చేర్చండి' : '+ Enroll Another'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-enroll-done"
                    onClick={() => {
                      setEnrolledSuccessMember(null);
                      setIsPinCopied(false);
                      setIsAddMemberOpen(false);
                    }}
                  >
                    <Check size={15} />
                    <span>{language === 'te' ? 'పూర్తయింది (Done)' : 'Done / Close'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddMemberSubmit} className="login-form mt-3">
                <div className="form-field">
                  <label className="field-label text-xs">
                    <Layers size={14} />
                    <span>{language === 'te' ? 'చిట్ గ్రూప్ ఎంచుకోండి' : 'Select Chit Group'}</span>
                  </label>
                  <select
                    className="form-input font-bold"
                    value={selectedEnrollGroupId}
                    onChange={e => setSelectedEnrollGroupId(e.target.value)}
                  >
                    {groups.map(g => {
                      const isGroupB = g.id === 'grp-2' || g.name.includes('Group B') || g.nameTe?.includes('గ్రూప్ B');
                      const label = isGroupB
                        ? (language === 'te' ? 'గ్రూప్ B' : 'Group B')
                        : (language === 'te' ? 'గ్రూప్ A' : 'Group A');
                      return (
                        <option key={g.id} value={g.id}>
                          {label}
                        </option>
                      );
                    })}
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
                      maxLength={15}
                      className="form-input"
                      placeholder="10-digit mobile"
                      value={newMemberPhone}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.startsWith('91') && val.length > 10) val = val.slice(2);
                        if (val.startsWith('0') && val.length > 10) val = val.slice(1);
                        if (val.length > 10) val = val.slice(0, 10);
                        setNewMemberPhone(val);
                      }}
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

                <button type="submit" className="btn-primary w-full mt-2" disabled={isEnrollingMember}>
                  {isEnrollingMember ? (
                    <span>{language === 'te' ? 'నమోదు అవుతోంది...' : 'Enrolling Member...'}</span>
                  ) : (
                    <span>{language === 'te' ? 'సభ్యుని గ్రూప్‌లో చేర్చండి' : 'Enroll Member in Group'}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. RECORD MONTHLY CHIT AUCTION / LIFTING MODAL (పాట పాడుకున్నవారి వివరాలు) */}
      {isLiftingModalOpen && (
        <div className="modal-backdrop animate-fade" onClick={() => setIsLiftingModalOpen(false)}>
          <div className="lifting-modal-card luxury-card animate-fade relative" onClick={e => e.stopPropagation()}>
            {/* Top-Right Absolute Close Cross Mark */}
            <button
              type="button"
              className="btn-modal-close"
              onClick={() => setIsLiftingModalOpen(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="mb-4 pb-2 border-b border-gray-800 pr-10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  <Award size={22} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white m-0 truncate">
                    {language === 'te' ? 'నెలసరి చిట్ నమోదు / Record Monthly Chit / Lift' : 'Record Monthly Chit / Lift'}
                  </h3>
                </div>
              </div>
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
                  className="form-input font-bold text-amber-300"
                  value={liftMonth}
                  onChange={e => setLiftMonth(Number(e.target.value))}
                >
                  {Array.from({ length: currentGroup.totalMonths || 20 }, (_, i) => i + 1).map(m => {
                    const isCompleted = completedMonthSet.has(m);
                    const lift = groupLiftings.find(l => Number(l.month) === m);
                    const winnerText = lift ? (language === 'te' ? (lift.memberNameTe || lift.memberName) : lift.memberName) : '';
                    return (
                      <option
                        key={m}
                        value={m}
                        disabled={isCompleted}
                        className={isCompleted ? 'text-gray-500 bg-gray-900 font-normal' : 'text-white font-bold'}
                      >
                        {isCompleted ? '✓ ' : ''}{getMonthDisplayName(m, language)}
                        {isCompleted
                          ? (language === 'te' ? ` [✓ పూర్తయింది - ${winnerText}]` : ` [✓ Completed: ${winnerText}]`)
                          : (m === currentGroup.currentMonth ? (language === 'te' ? ' (ప్రస్తుత నెల)' : ' (Current)') : '')}
                      </option>
                    );
                  })}
                </select>

                {/* Small Box with Tick Mark showing Completed Months */}
                {groupLiftings.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs animate-fade">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1.5">
                      <CheckCircle2 size={13} />
                      <span>
                        {language === 'te' ? 'ఇప్పటికే పూర్తయిన నెలలు:' : 'Already Completed Months:'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupLiftings.map(l => (
                        <div
                          key={l.id || l.month}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs"
                        >
                          <span className="font-bold text-emerald-300">
                            {language === 'te' ? `నెల ${l.month}` : `Month ${l.month}`}:
                          </span>
                          <span className="font-medium">{language === 'te' ? (l.memberNameTe || l.memberName) : l.memberName}</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/30 text-[10px] font-bold text-emerald-100 border border-emerald-400/50">
                            <Check size={10} className="text-emerald-300" />
                            <span>{language === 'te' ? 'పూర్తయింది' : 'Completed'}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

              {/* Sri Varalaxmi Chits Fixed Schedule Summary Card */}
              <div className="auction-summary-card">
                {/* 1. Chit Value */}
                <div className="summary-metric-row">
                  <span className="summary-metric-label">{language === 'te' ? 'మొత్తం చిట్ విలువ:' : 'Total Chit Value:'}</span>
                  <span className="summary-metric-value text-amber-300">₹{calcChitVal.toLocaleString('en-IN')}</span>
                </div>

                {/* Prize Money Received by Winner */}
                <div className="summary-metric-row">
                  <span className="summary-metric-label">{language === 'te' ? 'విజేతకు చేతికి అందే మొత్తం:' : 'Prize Money to Winner:'}</span>
                  <span className="summary-metric-value text-emerald-400 font-bold">₹{calcNetDistributed.toLocaleString('en-IN')}</span>
                </div>

                {/* 2. Chit Taken Month */}
                <div className="summary-metric-row">
                  <span className="summary-metric-label">{language === 'te' ? 'చిట్ తీసుకున్న నెల:' : 'Chit Taken Month:'}</span>
                  <span className="summary-metric-value text-white font-bold">{getMonthDisplayName(liftMonth, language)}</span>
                </div>

                {/* 3. Next Month Onwards Installment */}
                <div className="highlight-taken-box">
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      {language === 'te' ? 'వచ్చే నెల నుండి విజేత కట్టాల్సిన వాయిదా:' : 'Next Month Onwards Installment:'}
                    </span>
                    <span className="text-[11px] text-amber-200/70">
                      {language === 'te' ? '(నెల 20 వరకు స్థిర వాయిదా)' : '(Fixed Post-Lift Rate till Month 20)'}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-black text-amber-400">
                    ₹{fixedTakenInstallment.toLocaleString('en-IN')}
                  </span>
                </div>
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

              <div className="lifting-modal-actions pt-2">
                <button
                  type="button"
                  className="btn-lifting-modal-action"
                  onClick={() => setIsLiftingModalOpen(false)}
                >
                  <X size={16} />
                  <span>{language === 'te' ? 'రద్దు చేయి (Cancel)' : 'Cancel'}</span>
                </button>
                <button
                  type="submit"
                  className="btn-lifting-modal-action"
                >
                  <CheckCircle2 size={16} />
                  <span>{language === 'te' ? 'నమోదు చేయి (Save)' : 'Confirm & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PAYMENT APPROVED SUCCESS MODAL (Send SMS / WhatsApp Receipt in English) */}
      {approvedPaymentSuccess && (
        <div className="modal-backdrop animate-fade" onClick={() => setApprovedPaymentSuccess(null)}>
          <div className="login-modal-card luxury-card animate-fade max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white m-0">
                    {language === 'te' ? 'చెల్లింపు ఆమోదించబడింది!' : 'Payment Approved & Received!'}
                  </h3>
                  <p className="text-xs text-amber-400 m-0">
                    {language === 'te' ? 'సభ్యునికి SMS రసీదు పంపండి' : 'Send payment receipt SMS to member'}
                  </p>
                </div>
              </div>
              <button type="button" className="btn-modal-close static" onClick={() => setApprovedPaymentSuccess(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">{language === 'te' ? 'సభ్యుని పేరు:' : 'Member Name:'}</span>
                <strong className="text-white text-sm">
                  {approvedPaymentSuccess.member?.name || approvedPaymentSuccess.payment.memberName}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{language === 'te' ? 'వాయిదా నెల:' : 'Installment Month:'}</span>
                <strong className="text-yellow-400 font-bold">Month {approvedPaymentSuccess.payment.month}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{language === 'te' ? 'స్వీకరించిన మొత్తం:' : 'Amount Received:'}</span>
                <strong className="text-emerald-400 font-mono text-base font-bold">
                  ₹{approvedPaymentSuccess.payment.amount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{language === 'te' ? 'రసీదు సంఖ్య:' : 'Receipt No:'}</span>
                <strong className="text-amber-400 font-mono">{approvedPaymentSuccess.payment.receiptNo}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="btn-sms-share w-full py-2.5 flex items-center justify-center gap-2"
                onClick={() => {
                  const phone = approvedPaymentSuccess.member?.phone || '';
                  const text = getPaymentReceiptSmsText({
                    memberName: approvedPaymentSuccess.member?.name || approvedPaymentSuccess.payment.memberName,
                    month: approvedPaymentSuccess.payment.month,
                    amount: approvedPaymentSuccess.payment.amount,
                    receiptNo: approvedPaymentSuccess.payment.receiptNo,
                    organizerName: currentGroup.organizerName,
                    organizerPhone: currentGroup.organizerPhone
                  });
                  openDeviceSms(phone, text);
                }}
              >
                <MessageSquare size={16} />
                <span>{language === 'te' ? '📱 SMS రసీదు పంపండి (English SMS)' : '📱 Send SMS Receipt'}</span>
              </button>

              <button
                type="button"
                className="btn-whatsapp-share w-full py-2.5 flex items-center justify-center gap-2"
                onClick={() => {
                  const phone = approvedPaymentSuccess.member?.phone || '';
                  const text = getPaymentReceiptSmsText({
                    memberName: approvedPaymentSuccess.member?.name || approvedPaymentSuccess.payment.memberName,
                    month: approvedPaymentSuccess.payment.month,
                    amount: approvedPaymentSuccess.payment.amount,
                    receiptNo: approvedPaymentSuccess.payment.receiptNo,
                    organizerName: currentGroup.organizerName,
                    organizerPhone: currentGroup.organizerPhone
                  });
                  openWhatsApp(phone, text);
                }}
              >
                <Send size={16} />
                <span>{language === 'te' ? '💬 WhatsApp లో రసీదు పంపండి' : '💬 Send via WhatsApp'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary w-full py-2 text-xs mt-1"
                onClick={() => setApprovedPaymentSuccess(null)}
              >
                <span>{language === 'te' ? 'ముగించు (Done)' : 'Done / Close'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Details Modal */}
      {editingMember && (
        <div className="modal-backdrop animate-fade" onClick={() => setEditingMember(null)}>
          <div className="modal-content login-mobile-frame animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="font-bold text-white text-base">
                {language === 'te' ? `సభ్యుని వివరాలు సవరించండి (#${editingMember.memberNo})` : `Edit Member Details (#${editingMember.memberNo})`}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-white"
                onClick={() => setEditingMember(null)}
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="alert-box error mt-3 text-xs p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditMember} className="login-form mt-3 space-y-3">
              <div className="form-field">
                <label className="field-label text-xs font-semibold text-gray-300">
                  {language === 'te' ? 'మెంబర్ నంబర్ / టికెట్ (#1 నుండి #20):' : 'Member / Ticket No (#1 to #20):'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="form-input font-bold text-amber-400"
                  value={editMemberNo}
                  onChange={e => setEditMemberNo(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-field">
                <label className="field-label text-xs font-semibold text-gray-300">
                  {language === 'te' ? 'సభ్యుని పేరు (ఇంగ్లీష్):' : 'Member Name:'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Rajesh"
                  required
                />
              </div>

              <div className="form-field">
                <label className="field-label text-xs font-semibold text-gray-300">
                  {language === 'te' ? 'సభ్యుని పేరు (తెలుగు):' : 'Telugu Name (Optional):'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editNameTe}
                  onChange={e => setEditNameTe(e.target.value)}
                  placeholder="e.g. రాజేష్"
                />
              </div>

              <div className="form-field">
                <label className="field-label text-xs font-semibold text-gray-300">
                  {language === 'te' ? '10-అంకెల మొబైల్ నంబర్:' : 'Mobile Number:'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  className="form-input font-mono"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digit mobile"
                  required
                />
              </div>

              <div className="form-field">
                <label className="field-label text-xs font-semibold text-gray-300">
                  {language === 'te' ? '4-అంకెల సెక్యూరిటీ పిన్:' : 'Security PIN (4 digits):'}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="form-input text-center font-bold tracking-widest font-mono"
                  value={editPin}
                  onChange={e => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary flex-1 py-2.5 text-xs"
                  onClick={() => setEditingMember(null)}
                >
                  {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit
                    ? (language === 'te' ? 'సేవ్ అవుతోంది...' : 'Saving...')
                    : (language === 'te' ? 'సేవ్ చేయి' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
