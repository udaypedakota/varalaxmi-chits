import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChitScheme, Member, PaymentRecord, LotteryRecord } from '../types/chit';
import { SCHEME_CONFIG } from '../data/scheduleData';
import { DEFAULT_MEMBERS } from '../data/defaultMembers';
import { DEFAULT_PAYMENTS, DEFAULT_LOTTERY_HISTORY } from '../data/defaultPayments';

interface ChitContextType {
  scheme: ChitScheme;
  members: Member[];
  payments: PaymentRecord[];
  lotteryHistory: LotteryRecord[];
  currentUser: Member | null;
  language: 'te' | 'en';
  setLanguage: (lang: 'te' | 'en') => void;
  login: (phone: string, pin: string) => boolean;
  logout: () => void;
  switchUser: (memberId: string) => void;
  getEligibleLotteryMembers: () => Member[];
  getExcludedLotteryMembers: () => Member[];
  drawLottery: (month: number) => Member | null;
  submitPayment: (month: number, amount: number, utr: string, mode: 'UPI' | 'Cash' | 'Bank Transfer') => PaymentRecord;
  approvePayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string) => void;
  setCurrentMonth: (month: number) => void;
  resetAllData: () => void;
}

const ChitContext = createContext<ChitContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MEMBERS: 'sv_chits_members_v1',
  PAYMENTS: 'sv_chits_payments_v1',
  LOTTERY: 'sv_chits_lottery_v1',
  CURRENT_USER: 'sv_chits_user_v1',
  CURRENT_MONTH: 'sv_chits_month_v1',
  LANGUAGE: 'sv_chits_lang_v1'
};

export const ChitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scheme, setScheme] = useState<ChitScheme>(() => {
    const savedMonth = localStorage.getItem(STORAGE_KEYS.CURRENT_MONTH);
    return {
      ...SCHEME_CONFIG,
      currentMonth: savedMonth ? parseInt(savedMonth, 10) : SCHEME_CONFIG.currentMonth
    };
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : DEFAULT_PAYMENTS;
  });

  const [lotteryHistory, setLotteryHistory] = useState<LotteryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOTTERY);
    return saved ? JSON.parse(saved) : DEFAULT_LOTTERY_HISTORY;
  });

  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) return JSON.parse(saved);
    // Default to Uday (Member) for instant demo experience
    return DEFAULT_MEMBERS[1];
  });

  const [language, setLanguageState] = useState<'te' | 'en'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return (saved as 'te' | 'en') || 'te'; // Default Telugu
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOTTERY, JSON.stringify(lotteryHistory));
  }, [lotteryHistory]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_MONTH, scheme.currentMonth.toString());
  }, [scheme.currentMonth]);

  const setLanguage = (lang: 'te' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  const login = (phone: string, pin: string): boolean => {
    const trimmedPhone = phone.trim();
    const found = members.find(m => m.phone === trimmedPhone && m.pin === pin);
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (memberId: string) => {
    const found = members.find(m => m.id === memberId);
    if (found) {
      setCurrentUser(found);
    }
  };

  // Strictly filter members who have NOT lifted the chit yet
  const getEligibleLotteryMembers = (): Member[] => {
    return members.filter(m => !m.hasLiftedChit);
  };

  // Members who already lifted the chit in previous months
  const getExcludedLotteryMembers = (): Member[] => {
    return members.filter(m => m.hasLiftedChit);
  };

  // Draw lottery among eligible members only
  const drawLottery = (month: number): Member | null => {
    const eligible = getEligibleLotteryMembers();
    if (eligible.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[randomIndex];

    // Mark winner as having lifted the chit
    setMembers(prev => prev.map(m => {
      if (m.id === winner.id) {
        return {
          ...m,
          hasLiftedChit: true,
          liftedMonth: month
        };
      }
      return m;
    }));

    // Record lottery win
    const newRecord: LotteryRecord = {
      id: 'lot-' + Date.now(),
      month,
      winnerMemberId: winner.id,
      winnerName: winner.name,
      winnerNameTe: winner.nameTe,
      drawnAt: new Date().toISOString(),
      eligibleMemberCount: eligible.length
    };
    setLotteryHistory(prev => [newRecord, ...prev]);

    // Update current user state if the current user is the winner
    if (currentUser && currentUser.id === winner.id) {
      setCurrentUser({
        ...currentUser,
        hasLiftedChit: true,
        liftedMonth: month
      });
    }

    return winner;
  };

  // Member payment submission
  const submitPayment = (
    month: number,
    amount: number,
    utr: string,
    mode: 'UPI' | 'Cash' | 'Bank Transfer'
  ): PaymentRecord => {
    const member = currentUser || members[1];
    const receiptNo = 'SVC-' + new Date().getFullYear() + '-' + String(month).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900);

    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      memberId: member.id,
      memberName: member.name,
      month,
      amount,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      utr: utr.trim(),
      paymentMode: mode,
      receiptNo
    };

    setPayments(prev => [newPayment, ...prev]);
    return newPayment;
  };

  // Organizer approves payment
  const approvePayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        // Increment member total paid
        setMembers(mPrev => mPrev.map(m => {
          if (m.id === p.memberId) {
            const updatedTotal = m.totalPaidSoFar + p.amount;
            if (currentUser && currentUser.id === m.id) {
              setCurrentUser({ ...currentUser, totalPaidSoFar: updatedTotal });
            }
            return { ...m, totalPaidSoFar: updatedTotal };
          }
          return m;
        }));
        return { ...p, status: 'approved' };
      }
      return p;
    }));
  };

  // Organizer rejects payment
  const rejectPayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected' } : p));
  };

  const setCurrentMonth = (month: number) => {
    setScheme(prev => ({ ...prev, currentMonth: month }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setMembers(DEFAULT_MEMBERS);
    setPayments(DEFAULT_PAYMENTS);
    setLotteryHistory(DEFAULT_LOTTERY_HISTORY);
    setCurrentUser(DEFAULT_MEMBERS[1]);
    setScheme(SCHEME_CONFIG);
  };

  return (
    <ChitContext.Provider
      value={{
        scheme,
        members,
        payments,
        lotteryHistory,
        currentUser,
        language,
        setLanguage,
        login,
        logout,
        switchUser,
        getEligibleLotteryMembers,
        getExcludedLotteryMembers,
        drawLottery,
        submitPayment,
        approvePayment,
        rejectPayment,
        setCurrentMonth,
        resetAllData
      }}
    >
      {children}
    </ChitContext.Provider>
  );
};

export const useChit = (): ChitContextType => {
  const context = useContext(ChitContext);
  if (!context) {
    throw new Error('useChit must be used within a ChitProvider');
  }
  return context;
};
