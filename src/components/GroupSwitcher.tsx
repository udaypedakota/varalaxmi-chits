import React, { useState, useRef, useEffect } from 'react';
import { useChit } from '../context/ChitContext';
import { Layers, ChevronDown, Plus, Check, Sparkles, Shield, Lock } from 'lucide-react';

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
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <>
      <div className="group-switcher-wrap" ref={dropdownRef}>
        <button
          type="button"
          className="btn-group-switcher"
          onClick={() => {
            if (isOrganizer || visibleGroups.length > 1) {
              setIsOpen(!isOpen);
            }
          }}
          style={{ cursor: isOrganizer || visibleGroups.length > 1 ? 'pointer' : 'default' }}
          title={isOrganizer ? (language === 'te' ? 'చిట్ గ్రూప్ మార్చండి' : 'Switch Chit Group') : undefined}
        >
          <Layers size={15} className="group-icon text-amber-400" />
          <span className="group-active-name">
            <span className="group-name-short">{activeGroup.id === 'grp-2' ? (language === 'te' ? 'గ్రూప్ B' : 'Group B') : (language === 'te' ? 'గ్రూప్ A' : 'Group A')}</span>
            <span className="group-name-full">{language === 'te' ? activeGroup.nameTe : activeGroup.name}</span>
          </span>
          {isOrganizer || visibleGroups.length > 1 ? (
            <ChevronDown size={14} className={`arrow-icon ${isOpen ? 'rotate' : ''}`} />
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 ml-1">
              {language === 'te' ? 'మీ గ్రూప్' : 'Your Group'}
            </span>
          )}
        </button>

        {isOpen && (isOrganizer || visibleGroups.length > 1) && (
          <div className="group-dropdown-card animate-fade">
            <div className="group-dropdown-header">
              <Sparkles size={14} className="text-yellow-400" />
              <span>{language === 'te' ? 'మీ చిట్ గ్రూపులు (Chit Groups)' : 'Active Chit Groups'}</span>
            </div>

            <div className="group-list">
              {visibleGroups.map(g => {
                const isActive = g.id === activeGroupId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`group-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveGroupId(g.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="group-item-info">
                      <strong className="group-item-title">
                        {language === 'te' ? g.nameTe : g.name}
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
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-amber-400" />
                <span>{language === 'te' ? 'కొత్త చిట్ గ్రూప్ ప్రారంభించండి' : 'Create New Chit Group'}</span>
              </h3>
              <button 
                type="button"
                className="text-gray-400 hover:text-white p-1"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 font-semibold mb-1 block">
                  {language === 'te' ? 'గ్రూప్ పేరు (ఇంగ్లీష్):' : 'Group Name (English):'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Varalaxmi Chits (Group C)"
                  className="form-input text-xs w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-semibold mb-1 block">
                  {language === 'te' ? 'గ్రూప్ పేరు (తెలుగు):' : 'Group Name (Telugu):'}
                </label>
                <input
                  type="text"
                  placeholder="ఉదా: శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ C)"
                  className="form-input text-xs w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white"
                  value={nameTe}
                  onChange={e => setNameTe(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 font-semibold mb-1 block">
                    {language === 'te' ? 'మొత్తం చిట్ విలువ (₹):' : 'Total Chit Value (₹):'}
                  </label>
                  <input
                    type="number"
                    value={totalValue}
                    onChange={e => setTotalValue(Number(e.target.value))}
                    className="form-input text-xs w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-semibold mb-1 block">
                    {language === 'te' ? 'మొత్తం నెలలు (వ్యవధి):' : 'Duration (Months):'}
                  </label>
                  <input
                    type="number"
                    value={totalMonths}
                    onChange={e => setTotalMonths(Number(e.target.value))}
                    className="form-input text-xs w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full luxury-btn py-2.5 text-xs font-bold mt-4"
              >
                <span>{language === 'te' ? 'గ్రూప్ సృష్టించండి' : 'Create Group'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
