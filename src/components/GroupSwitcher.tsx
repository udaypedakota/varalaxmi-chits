import React, { useState, useRef, useEffect } from 'react';
import { useChit } from '../context/ChitContext';
import { Layers, ChevronDown, Plus, Check, Sparkles } from 'lucide-react';

export const GroupSwitcher: React.FC = () => {
  const { groups, activeGroupId, activeGroup, setActiveGroupId, createGroup, currentUser, language } = useChit();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Group Form State
  const [name, setName] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [totalValue, setTotalValue] = useState(200000);
  const [totalMonths, setTotalMonths] = useState(20);
  const [commissionPercent, setCommissionPercent] = useState(5);
  const [fixedTakenInstallment, setFixedTakenInstallment] = useState(11500);

  // Group restriction: Organizer sees all groups. Regular member ONLY sees and accesses their assigned group!
  const isOrganizer = currentUser?.role === 'organizer';
  const visibleGroups = isOrganizer
    ? groups
    : groups.filter(g => !currentUser?.groupId || g.id === currentUser.groupId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createGroup({
      name: name.trim(),
      nameTe: nameTe.trim() || name.trim(),
      totalValue: Number(totalValue),
      totalMonths: Number(totalMonths),
      totalMembers: Number(totalMonths),
      monthlyInstallment: 10000,
      commissionPercent: Number(commissionPercent),
      fixedTakenInstallment: Number(fixedTakenInstallment)
    });

    setIsCreateModalOpen(false);
    setName('');
    setNameTe('');
  };

  // Clean, compact group label (e.g. "Group A" / "గ్రూప్ A") so it never collides on mobile
  const currentGroupShortLabel = activeGroup.id === 'grp-2' || activeGroup.name.includes('Group B') || activeGroup.nameTe?.includes('గ్రూప్ B')
    ? (language === 'te' ? 'గ్రూప్ B' : 'Group B')
    : (language === 'te' ? 'గ్రూప్ A' : 'Group A');

  return (
    <>
      <div className="group-switcher-wrap" ref={dropdownRef}>
        <button
          type="button"
          className="btn-group-switcher"
          onClick={(e) => {
            e.stopPropagation();
            if (isOrganizer || visibleGroups.length > 1) {
              setIsOpen((prev) => !prev);
            }
          }}
          style={{ cursor: isOrganizer || visibleGroups.length > 1 ? 'pointer' : 'default' }}
          title={isOrganizer ? (language === 'te' ? 'చిట్ గ్రూప్ మార్చండి' : 'Switch Chit Group') : undefined}
          aria-expanded={isOpen}
        >
          <Layers size={14} className="group-icon text-amber-400 shrink-0" />
          <span className="group-active-name">
            {currentGroupShortLabel}
          </span>
          {(isOrganizer || visibleGroups.length > 1) && (
            <ChevronDown size={14} className={`arrow-icon shrink-0 ${isOpen ? 'rotate' : ''}`} />
          )}
        </button>

        {isOpen && (isOrganizer || visibleGroups.length > 1) && (
          <div className="group-dropdown-card animate-fade" onClick={e => e.stopPropagation()}>
            <div className="group-dropdown-header">
              <Sparkles size={14} className="text-yellow-400" />
              <span>{language === 'te' ? 'చిట్ గ్రూపులు (Chit Groups)' : 'Chit Groups'}</span>
            </div>

            <div className="group-list">
              {visibleGroups.map(g => {
                const isActive = g.id === activeGroupId;
                const isGroupB = g.id === 'grp-2' || g.name.includes('Group B') || g.nameTe?.includes('గ్రూప్ B');
                const gTitle = isGroupB
                  ? (language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ B)' : 'Sri Varalaxmi Chits (Group B)')
                  : (language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ A)' : 'Sri Varalaxmi Chits (Group A)');

                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`group-item-btn ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveGroupId(g.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="group-item-info">
                      <strong className="group-item-title">
                        {gTitle}
                      </strong>
                      <span className="group-item-meta">
                        ₹{g.totalValue.toLocaleString('en-IN')} • {g.totalMonths} {language === 'te' ? 'నెలలు' : 'Months'} • {language === 'te' ? `నెల ${g.currentMonth}` : `Month ${g.currentMonth}`}
                      </span>
                    </div>
                    {isActive && <Check size={16} className="text-yellow-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Organizer Only: Add New Group Button */}
            {isOrganizer && (
              <div className="group-dropdown-footer">
                <button
                  type="button"
                  className="btn-add-group"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                >
                  <Plus size={15} />
                  <span>{language === 'te' ? '+ కొత్త గ్రూప్ చేర్చండి' : '+ Add New Group'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Organizer Create New Group Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop animate-fade" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-card luxury-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-400" />
                <span>{language === 'te' ? 'కొత్త చిట్ గ్రూప్ ప్రారంభించండి' : 'Create New Chit Group'}</span>
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {language === 'te' ? 'గ్రూప్ పేరు (English)' : 'Group Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Varalaxmi Chits (Group C)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {language === 'te' ? 'గ్రూప్ పేరు (తెలుగు)' : 'Group Name (Telugu)'}
                </label>
                <input
                  type="text"
                  placeholder="ఉదా: శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ C)"
                  value={nameTe}
                  onChange={e => setNameTe(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {language === 'te' ? 'మొత్తం చిట్ విలువ (₹)' : 'Total Chit Value (₹)'}
                  </label>
                  <input
                    type="number"
                    value={totalValue}
                    onChange={e => setTotalValue(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {language === 'te' ? 'నెలలు / సభ్యులు' : 'Total Months / Members'}
                  </label>
                  <input
                    type="number"
                    value={totalMonths}
                    onChange={e => setTotalMonths(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {language === 'te' ? 'స్థిర పాడిన వాయిదా (₹)' : 'Fixed Lifted Rate (₹)'}
                  </label>
                  <input
                    type="number"
                    value={fixedTakenInstallment}
                    onChange={e => setFixedTakenInstallment(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {language === 'te' ? 'కమిషన్ (%)' : 'Commission (%)'}
                  </label>
                  <input
                    type="number"
                    value={commissionPercent}
                    onChange={e => setCommissionPercent(Number(e.target.value))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 px-4 rounded-lg bg-slate-800 text-gray-300 hover:bg-slate-700 text-sm font-semibold"
                >
                  {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-yellow-400"
                >
                  {language === 'te' ? 'సృష్టించు' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
