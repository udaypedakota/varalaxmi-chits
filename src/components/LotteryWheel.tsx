import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { Member } from '../types/chit';
import confetti from 'canvas-confetti';
import { X, Trophy, Dices, Users, CheckCircle, ShieldAlert, Award, Sparkles } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';

interface LotteryWheelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LotteryWheel: React.FC<LotteryWheelProps> = ({ isOpen, onClose }) => {
  const { 
    scheme, 
    getEligibleLotteryMembers, 
    getExcludedLotteryMembers, 
    drawLottery, 
    language 
  } = useChit();

  const eligibleMembers = getEligibleLotteryMembers();
  const excludedMembers = getExcludedLotteryMembers();

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Member | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || eligibleMembers.length === 0) return;

    setIsSpinning(true);
    setSelectedWinner(null);

    // Dynamic rotation: 6 to 9 full spins (2160 to 3240 deg) + random slice offset
    const extraSpins = 360 * 7 + Math.floor(Math.random() * 360);
    setRotationDegrees(prev => prev + extraSpins);

    setTimeout(() => {
      const winner = drawLottery(scheme.currentMonth);
      setIsSpinning(false);
      setSelectedWinner(winner);

      // Multi-burst confetti celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 350);
    }, 3800);
  };

  const sliceColors = [
    '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
    '#EC4899', '#EF4444', '#14B8A6', '#F97316',
    '#6366F1', '#84CC16', '#06B6D4', '#E11D48'
  ];

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose}>
      <div className="lottery-modal-card" onClick={e => e.stopPropagation()}>
        {/* Top Bar with Language Toggle & Close Button */}
        <div className="login-modal-top-bar">
          <LanguageToggle />
          <button type="button" className="btn-modal-close static" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Header */}
        <div className="lottery-modal-header text-center">
          <div className="lottery-header-icon mx-auto">
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <h2 className="lottery-title">
            {language === 'te' 
              ? `నెల ${scheme.currentMonth} చిట్టీల లక్కీ డ్రా (Digital Lucky Draw)` 
              : `Month ${scheme.currentMonth} Digital Lottery Draw`}
          </h2>
          <p className="lottery-subtitle">
            {language === 'te'
              ? 'ఈ నెల ఎవరూ చిట్ ఎత్తకపోతే, మిగిలిన అర్హులైన సభ్యుల మధ్య పారదర్శక లక్కీ డ్రా'
              : 'Automated fair digital draw among members who have not yet lifted the chit'}
          </p>

          {/* Strict Exclusion Guarantee Banner */}
          <div className="exclusion-notice-pill">
            <CheckCircle size={16} className="text-emerald-400" />
            <span>
              {language === 'te'
                ? 'గతంలో చిట్ ఎత్తినవారు మినహాయించబడ్డారు (కేవలం కొత్తవారికి మాత్రమే అవకాశం)'
                : 'Strict Rule: Members who already lifted are excluded from draw'}
            </span>
          </div>
        </div>

        {/* Lottery Stage */}
        <div className="lottery-body">
          {/* Active Participants Count */}
          <div className="eligible-count-bar">
            <Users size={18} />
            <span>
              {language === 'te'
                ? `ఈ డ్రాలో పాల్గొనే అర్హులైన సభ్యులు: ${eligibleMembers.length} మంది`
                : `Eligible Draw Participants: ${eligibleMembers.length} Members`}
            </span>
          </div>

          {/* Interactive Wheel Canvas */}
          <div className="wheel-stage">
            <div className="wheel-pointer">▼</div>
            <div 
              className={`wheel-disc ${isSpinning ? 'spinning' : ''}`}
              style={{ transform: `rotate(${rotationDegrees}deg)` }}
            >
              {eligibleMembers.slice(0, 12).map((m, idx) => {
                const totalSlice = Math.min(eligibleMembers.length, 12);
                const angle = (360 / totalSlice) * idx;
                return (
                  <div 
                    key={m.id}
                    className="wheel-slice"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      background: sliceColors[idx % sliceColors.length]
                    }}
                  >
                    <span className="slice-label">
                      {language === 'te' ? m.nameTe.split(' ')[0] : m.name.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
              <div className="wheel-center-hub">
                <Dices size={28} className="text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mt-4">
            <button
              type="button"
              className="btn-spin-lottery"
              onClick={handleSpin}
              disabled={isSpinning || eligibleMembers.length === 0}
            >
              <Sparkles size={20} />
              <span>
                {isSpinning 
                  ? (language === 'te' ? 'లక్కీ డ్రా తిరుగుతోంది...' : 'Spinning Lucky Wheel...') 
                  : (language === 'te' ? '🎲 లక్కీ డ్రా తిప్పండి (Spin Wheel)' : '🎲 Spin Lucky Wheel')}
              </span>
            </button>
          </div>

          {/* Winner Announcement Card */}
          {selectedWinner && (
            <div className="winner-announcement-card animate-bounce-short">
              <div className="winner-badge">
                <Award size={20} />
                <span>{language === 'te' ? `నెల ${scheme.currentMonth} చిట్ విజేత!` : `Month ${scheme.currentMonth} Chit Winner!`}</span>
              </div>
              <h3 className="winner-name">
                {language === 'te' ? selectedWinner.nameTe : selectedWinner.name}
              </h3>
              <p className="winner-sub">
                {language === 'te' 
                  ? `సభ్యత్వ సంఖ్య: #${selectedWinner.memberNo} • ఫోన్: ${selectedWinner.phone}` 
                  : `Member #${selectedWinner.memberNo} • Phone: ${selectedWinner.phone}`}
              </p>
              <div className="winner-amount-box">
                <span className="amount-label">{language === 'te' ? 'చిట్ మొత్తం' : 'Chit Value'}:</span>
                <span className="amount-val">₹2,00,000</span>
              </div>
              <p className="winner-note">
                {language === 'te'
                  ? '✅ ఈ సభ్యుడు ఇకపై లక్కీ డ్రాలో పాల్గొనరు. వచ్చే నెల నుండి స్థిర వాయిదా ₹11,500 వర్తిస్తుంది.'
                  : '✅ This member is now marked as lifted. Next month onward their installment is fixed at ₹11,500.'}
              </p>
            </div>
          )}

          {/* Lists Accordion: Eligible vs Excluded Members */}
          <div className="lottery-members-audit">
            {/* Eligible List */}
            <div className="audit-section eligible">
              <div className="audit-header">
                <Users size={16} className="text-emerald-400" />
                <h4>
                  {language === 'te' 
                    ? `అర్హులైన సభ్యుల జాబితా (${eligibleMembers.length})` 
                    : `Eligible Members List (${eligibleMembers.length})`}
                </h4>
              </div>
              <div className="audit-chips-wrap">
                {eligibleMembers.map(m => (
                  <span key={m.id} className="member-chip eligible">
                    #{m.memberNo} {language === 'te' ? m.nameTe : m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Excluded List */}
            <div className="audit-section excluded">
              <div className="audit-header">
                <ShieldAlert size={16} className="text-amber-400" />
                <h4>
                  {language === 'te' 
                    ? `మినహాయించిన సభ్యులు - గతంలో చిట్ ఎత్తినవారు (${excludedMembers.length})` 
                    : `Excluded Members - Already Lifted (${excludedMembers.length})`}
                </h4>
              </div>
              <div className="audit-chips-wrap">
                {excludedMembers.map(m => (
                  <span key={m.id} className="member-chip excluded">
                    #{m.memberNo} {language === 'te' ? m.nameTe : m.name} 
                    <small> ({language === 'te' ? `నెల ${m.liftedMonth}` : `Month ${m.liftedMonth}`})</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
