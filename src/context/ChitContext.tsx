import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChitGroup, Member, PaymentRecord, LotteryRecord, ChitNotification, ChitLiftingRecord } from '../types/chit';
import { DEFAULT_GROUPS } from '../data/defaultGroups';
import { DEFAULT_MEMBERS } from '../data/defaultMembers';
import { DEFAULT_PAYMENTS, DEFAULT_LOTTERY_HISTORY } from '../data/defaultPayments';
import { DEFAULT_NOTIFICATIONS } from '../data/defaultNotifications';

interface DbStatus {
  isOnline: boolean;
  isMongoConnected: boolean;
  database: string;
}

interface ChitContextType {
  // Groups
  groups: ChitGroup[];
  activeGroupId: string;
  activeGroup: ChitGroup;
  scheme: ChitGroup; // alias for backwards compatibility
  setActiveGroupId: (id: string) => void;
  createGroup: (groupData: Partial<ChitGroup>) => void;

  // Members & Auth
  members: Member[];
  groupMembers: Member[];
  currentUser: Member | null;
  userChits: Member[];
  switchActiveChit: (memberId: string) => void;
  language: 'te' | 'en';
  setLanguage: (lang: 'te' | 'en') => void;
  login: (phone: string, pin: string, groupId?: string) => Promise<{ success: boolean; error?: string }>;
  registerMember: (memberData: { name: string; phone: string; pin: string; groupId?: string }) => { success: boolean; error?: string; member?: Member };
  logout: () => void;
  switchUser: (memberId: string) => void;
  addMember: (memberData: { name: string; nameTe?: string; phone: string; pin?: string; groupId?: string }) => Promise<Member>;
  deleteMember: (memberId: string) => void;
  updateMemberPin: (memberId: string, newPin: string) => void;

  // Payments
  payments: PaymentRecord[];
  groupPayments: PaymentRecord[];
  submitPayment: (
    month: number,
    amount: number,
    utr?: string,
    mode?: string,
    proofUrl?: string
  ) => PaymentRecord;
  approvePayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string) => void;

  // Monthly Chit Lifting & Auctions (పాట పాడుకున్నవారు)
  liftings: ChitLiftingRecord[];
  groupLiftings: ChitLiftingRecord[];
  recordChitLifting: (liftingData: Partial<ChitLiftingRecord>) => Promise<ChitLiftingRecord>;

  // Lottery
  lotteryHistory: LotteryRecord[];
  groupLotteryHistory: LotteryRecord[];
  getEligibleLotteryMembers: () => Member[];
  getExcludedLotteryMembers: () => Member[];
  drawLottery: (month: number) => Member | null;

  // Notifications & Real-Time Alerts
  notifications: ChitNotification[];
  unreadNotificationsCount: number;
  activeToast: ChitNotification | null;
  dismissToast: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  isPushSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  requestNotificationPermission: () => Promise<boolean>;
  showToast: (title: string, message: string, type?: 'info' | 'payment' | 'lottery' | 'alert') => void;

  // Control & Database
  dbStatus: DbStatus;
  setCurrentMonth: (month: number) => void;
  truncateAllData: () => Promise<void>;
  seedAllData: () => Promise<void>;
  resetAllData: () => void;
}

const ChitContext = createContext<ChitContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GROUPS: 'sv_chits_groups_v8',
  ACTIVE_GROUP: 'sv_chits_active_group_v8',
  MEMBERS: 'sv_chits_members_v8',
  PAYMENTS: 'sv_chits_payments_v8',
  LOTTERY: 'sv_chits_lottery_v8',
  LIFTINGS: 'sv_chits_liftings_v8',
  NOTIFICATIONS: 'sv_chits_notifs_v8',
  CURRENT_USER: 'sv_chits_user_v8',
  LANGUAGE: 'sv_chits_lang_v8'
};

// Purge any stale legacy localStorage items so old cached data never corrupts state
try {
  const legacyPrefixes = [
    'sv_chits_groups_v1', 'sv_chits_groups_v2', 'sv_chits_groups_v3', 'sv_chits_groups_v4', 'sv_chits_groups_v5', 'sv_chits_groups_v6', 'sv_chits_groups_v7',
    'sv_chits_notifs_v1', 'sv_chits_notifs_v2', 'sv_chits_notifs_v3', 'sv_chits_notifs_v4', 'sv_chits_notifs_v5', 'sv_chits_notifs_v6', 'sv_chits_notifs_v7',
    'sv_chits_members_v1', 'sv_chits_members_v2', 'sv_chits_members_v3', 'sv_chits_members_v4', 'sv_chits_members_v5', 'sv_chits_members_v6', 'sv_chits_members_v7',
    'sv_chits_payments_v5', 'sv_chits_payments_v6', 'sv_chits_payments_v7',
    'sv_chits_lottery_v5', 'sv_chits_lottery_v6', 'sv_chits_lottery_v7',
    'sv_chits_liftings_v5', 'sv_chits_liftings_v6', 'sv_chits_liftings_v7',
  ];
  legacyPrefixes.forEach(k => localStorage.removeItem(k));
} catch {}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const ChitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Groups State (Strictly Both ₹2,00,000 Schemes • 20 Months • Organizer Siva 8790859546)
  const [groups, setGroups] = useState<ChitGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    const parsed = saved ? JSON.parse(saved) : DEFAULT_GROUPS;
    return (parsed && parsed.length > 0 ? parsed : DEFAULT_GROUPS).map((g: ChitGroup) => ({
      ...g,
      totalValue: 200000,
      totalMonths: 20,
      totalMembers: 20,
      monthlyInstallment: 10000,
      fixedTakenInstallment: 11500,
      organizerName: 'Siva (Organizer)',
      organizerPhone: '8790859546',
      organizerUpiId: '8790859546@ybl',
      name: g.id === 'grp-2' ? 'Sri Varalaxmi Chits (Group B)' : 'Sri Varalaxmi Chits (Group A)',
      nameTe: g.id === 'grp-2' ? 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ B)' : 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ A)'
    }));
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP);
    return saved || 'grp-1';
  });

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || DEFAULT_GROUPS[0];

  // 2. Members State (Pure 20 participants - Organizer is separate)
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS) || localStorage.getItem('sv_chits_members_v5');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
    return (parsed || []).filter((m: Member) => m.role !== 'organizer' && m.phone !== '8790859546');
  });

  // 3. Payments State (Clean Slate: Empty for live entry)
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS) || localStorage.getItem('sv_chits_payments_v5');
    return saved ? JSON.parse(saved) : DEFAULT_PAYMENTS;
  });

  // 4. Lottery History State (Clean Slate: Empty for live entry)
  const [lotteryHistory, setLotteryHistory] = useState<LotteryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOTTERY) || localStorage.getItem('sv_chits_lottery_v5');
    return saved ? JSON.parse(saved) : DEFAULT_LOTTERY_HISTORY;
  });

  // 5. Monthly Chit Liftings & Auctions State (పాట పాడుకున్నవారి వివరాలు)
  const [liftings, setLiftings] = useState<ChitLiftingRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LIFTINGS) || localStorage.getItem('sv_chits_liftings_v5');
    return saved ? JSON.parse(saved) : [];
  });

  // 6. Notifications State (Pure dynamic notifications only - no dummy entries)
  const [notifications, setNotifications] = useState<ChitNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const parsed = saved ? JSON.parse(saved) : [];
    return (parsed || []).filter((n: ChitNotification) =>
      !n.title?.includes('Month 3 installment') &&
      !n.message?.includes('Uday (#2) won a chit') &&
      !n.message?.includes('SVC-2026-02-002') &&
      !n.id?.startsWith('toast-')
    ).map((n: ChitNotification) => ({ ...n, isRead: true }));
  });

  // 7. Current User (Persisted so page refresh maintains login across localStorage & sessionStorage)
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 
                    sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER) ||
                    sessionStorage.getItem('sv_chits_user_session_v2') ||
                    localStorage.getItem('sv_chits_user_v5');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const currentUserRef = useRef<Member | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Web Push Notification State (Phone Lock-Screen Alerts like Badminton App)
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      setIsPushSupported(true);
      setPushPermission(Notification.permission);
    } else {
      setPushPermission('unsupported');
    }
  }, []);

  const registerPushForUser = async (userToRegister?: Member | null) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const VAPID_KEY = 'BHDCaC5ncvVC_rr8XwAL9YTG8oc79YXlAVPpOfyDWhAaFoxLSeVZZphYR6SiK5BEJl89dC_xwUIz2nASBzJo8zI';
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as unknown as BufferSource
        });
      }
      const targetUser = userToRegister || currentUser;
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          memberId: targetUser?.id || 'anonymous',
          phone: targetUser?.phone || '',
          role: targetUser?.role || 'member'
        })
      });
      console.log('[WebPush] Registered push subscription successfully for:', targetUser?.name || 'anonymous');
    } catch (e) {
      console.log('[WebPush Registration Error]', e);
    }
  };

  useEffect(() => {
    if (pushPermission === 'granted') {
      registerPushForUser(currentUser);
    }
  }, [currentUser, pushPermission]);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(
        language === 'te' ? 'నోటిఫికేషన్లు సపోర్ట్ చేయవు' : 'Notifications Not Supported',
        language === 'te' ? 'మీ బ్రౌజర్ వెబ్ పుష్ అలర్ట్‌లకు సపోర్ట్ చేయదు.' : 'Your browser does not support web push notifications.',
        'alert'
      );
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        await registerPushForUser(currentUser);
        // Send a test alert to phone lock screen immediately
        fetch('/api/notifications/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: currentUser?.id,
            role: currentUser?.role || 'member',
            title: language === 'te' ? '🔔 శ్రీ వరలక్ష్మి చిట్స్' : '🔔 Sri Varalaxmi Chits Alert',
            body: language === 'te'
              ? `స్వాగతం ${currentUser?.nameTe || currentUser?.name || ''}! ఫోన్ లాక్-స్క్రీన్ పుష్ అలర్ట్స్ ఆక్టివేట్ అయ్యాయి.`
              : `Welcome ${currentUser?.name || ''}! Phone lock-screen push alerts are active.`
          })
        }).catch(() => {});

        showToast(
          language === 'te' ? '🔔 ఫోన్ అలర్ట్స్ ఆక్టివేట్ అయ్యాయి!' : '🔔 Phone Push Alerts Active!',
          language === 'te' ? 'ఇకపై పేమెంట్లు మరియు చిట్ పాట ఫలితాలు మీ మొబైల్‌కు వస్తాయి.' : 'Chit auction results & payment alerts will now ring on your phone.',
          'info'
        );
        return true;
      } else {
        showToast(
          language === 'te' ? 'నోటిఫికేషన్ అనుమతి ఇవ్వలేదు' : 'Permission Not Granted',
          language === 'te' ? 'బ్రౌజర్ సెట్టింగ్స్‌లో నోటిఫికేషన్లను అనుమతించండి.' : 'Please allow notifications in your browser settings.',
          'alert'
        );
        return false;
      }
    } catch (e) {
      console.log('[Request Permission Error]', e);
      return false;
    }
  };

  // Floating Mobile Push Toast State
  const [activeToast, setActiveToast] = useState<ChitNotification | null>(null);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Play subtle audio chime for real mobile app feeling
  const playChimeAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}
  };

  const triggerToast = (notif: ChitNotification) => {
    setActiveToast(notif);
    playChimeAudio();
    // Broadcast instantly to sibling tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('sv_chits_cross_tab_sync');
        bc.postMessage({ type: 'NOTIFICATION_TOAST', notif });
        bc.close();
      }
    } catch {}
  };

  const showToast = (title: string, message: string, type: 'info' | 'payment' | 'lottery' | 'alert' = 'info') => {
    const notifType: 'due' | 'general' | 'lottery' | 'payment' = 
      type === 'payment' ? 'payment' : type === 'lottery' ? 'lottery' : 'general';
    const notif: ChitNotification = {
      id: `toast-${Date.now()}`,
      groupId: activeGroupId,
      title,
      titleTe: title,
      message,
      messageTe: message,
      type: notifType,
      date: new Date().toISOString().split('T')[0],
      isRead: true
    };
    triggerToast(notif);
  };

  // Cross-Tab instant message listener
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('sv_chits_cross_tab_sync');
    bc.onmessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_TOAST' && event.data.notif) {
        const incomingNotif: ChitNotification = event.data.notif;

        // TARGET FILTER: Do not show payment toasts to unrelated members!
        const user = currentUserRef.current;
        if (user) {
          if (user.role === 'organizer') {
            // Organizer sees all notifications
          } else {
            // Member only sees notifications meant for them or public announcements
            const isForMe = (incomingNotif.targetMemberId && incomingNotif.targetMemberId === user.id) ||
                            (incomingNotif.memberId && incomingNotif.memberId === user.id);
            const isPublic = incomingNotif.targetRole === 'all' || incomingNotif.type === 'lottery' || (!incomingNotif.targetRole && !incomingNotif.memberId && !incomingNotif.targetMemberId);
            if (!isForMe && !isPublic) {
              return; // Do NOT show toast to other members!
            }
          }
        }

        setActiveToast(incomingNotif);
        playChimeAudio();
        if (incomingNotif.id && !incomingNotif.id.startsWith('toast-')) {
          setNotifications(prev => {
            if (prev.some(n => n.id === incomingNotif.id)) return prev;
            return [incomingNotif, ...prev];
          });
        }
      }
    };
    return () => {
      bc.close();
    };
  }, []);

  // 8. Language
  const [language, setLanguageState] = useState<'te' | 'en'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return (saved as 'te' | 'en') || 'te';
  });

  // 9. DB Status (Live API check)
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    isOnline: false,
    isMongoConnected: false,
    database: 'Local Storage Sync'
  });

  // Real-Time Multi-Tab Sync: Poll MongoDB Atlas every 2.5s
  useEffect(() => {
    const syncData = async () => {
      try {
        const res = await fetch(`/api/status?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setDbStatus({
            isOnline: true,
            isMongoConnected: data.isMongoConnected,
            database: data.database
          });

          // Fetch Live Groups from Atlas (normalize Group B to 2L / 20 months)
          const grpRes = await fetch('/api/groups');
          if (grpRes.ok) {
            const apiGroups = await grpRes.json();
            if (apiGroups && apiGroups.length > 0) {
              const normalized = apiGroups.map((g: ChitGroup) => {
                if (g.id === 'grp-2') {
                  return {
                    ...g,
                    totalValue: 200000,
                    totalMonths: 20,
                    totalMembers: 20,
                    monthlyInstallment: 10000,
                    name: 'Sri Varalaxmi Chits (Group B)',
                    nameTe: 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ B)'
                  };
                }
                return {
                  ...g,
                  totalValue: 200000,
                  totalMonths: 20,
                  totalMembers: 20,
                  monthlyInstallment: 10000,
                  name: 'Sri Varalaxmi Chits (Group A)',
                  nameTe: 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ A)'
                };
              });
              setGroups(normalized);
            }
          }

          // Fetch Live Members across ALL groups from Atlas (strictly exclude organizer)
          const memRes = await fetch('/api/members');
          if (memRes.ok) {
            const apiMembers = await memRes.json();
            if (apiMembers && apiMembers.length > 0) {
              const validMembers = apiMembers.filter((m: Member) => m.role !== 'organizer' && m.phone !== '8790859546');
              // Retain any newly created local members that Atlas might still be writing
              setMembers(prev => {
                const apiIds = new Set(validMembers.map((m: Member) => m.id));
                const apiPhones = new Set(validMembers.map((m: Member) => `${m.groupId}_${m.phone}`));
                const recentLocal = prev.filter(m => 
                  !apiIds.has(m.id) && 
                  !apiPhones.has(`${m.groupId}_${m.phone}`) &&
                  m.id.startsWith('m-') && 
                  (Date.now() - Number(m.id.replace('m-', '')) < 25000)
                );
                return [...validMembers, ...recentLocal];
              });
              setCurrentUser(prev => {
                if (!prev || prev.role === 'organizer') return prev;
                // STRICT CHECK: Always match by ID first! If a member has 2 chits with the same phone, matching by phone flips ticket 2 back to ticket 1 every 2.5s!
                const refreshed = validMembers.find((m: Member) => m.id === prev.id)
                  || validMembers.find((m: Member) => (m.phone || '').replace(/\D/g, '') === (prev.phone || '').replace(/\D/g, ''));
                return refreshed ? { ...prev, ...refreshed } : prev;
              });
            }
          }

          // Fetch Live Payments from Atlas
          const payRes = await fetch(`/api/groups/${activeGroupId}/payments`);
          if (payRes.ok) {
            const apiPayments = await payRes.json();
            setPayments(apiPayments || []);
          }

          // Fetch Live Lottery from Atlas
          const lotRes = await fetch(`/api/groups/${activeGroupId}/lottery`);
          if (lotRes.ok) {
            const apiLottery = await lotRes.json();
            setLotteryHistory(apiLottery || []);
          }

          // Fetch Live Chit Liftings / Auctions from Atlas
          const liftRes = await fetch(`/api/groups/${activeGroupId}/liftings`);
          if (liftRes.ok) {
            const apiLiftings = await liftRes.json();
            setLiftings(apiLiftings || []);
          }

          // Fetch Live Notifications from Atlas
          const notifRes = await fetch(`/api/groups/${activeGroupId}/notifications`);
          if (notifRes.ok) {
            const apiNotifs: ChitNotification[] = await notifRes.json();
            if (apiNotifs && apiNotifs.length > 0) {
              setNotifications(prev => {
                const prevIds = new Set(prev.map(p => p.id));
                const freshNotifs = apiNotifs.filter(n => !prevIds.has(n.id));
                if (freshNotifs.length > 0) {
                  const newest = freshNotifs[0];
                  // Pop mobile push toast for the user
                  setActiveToast(newest);
                  playChimeAudio();
                }
                return [...freshNotifs, ...prev];
              });
            }
          }
        }
      } catch {
        setDbStatus({
          isOnline: false,
          isMongoConnected: false,
          database: 'Local Storage Hybrid'
        });
      }
    };

    syncData();
    const interval = setInterval(syncData, 2500);
    return () => clearInterval(interval);
  }, [activeGroupId]);

  // Sync session user across both storage layers
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } catch {}
    }
  }, [currentUser]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, activeGroupId);
  }, [activeGroupId]);

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
    localStorage.setItem(STORAGE_KEYS.LIFTINGS, JSON.stringify(liftings));
  }, [liftings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const setLanguage = (lang: 'te' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  // Group-Filtered Slices: strictly EXCLUDE organizer so groupMembers contains only the 20 real participants!
  const groupMembers = members.filter(m => m.role !== 'organizer' && (!m.groupId || m.groupId === activeGroupId));
  const groupPayments = payments.filter(p => !p.groupId || p.groupId === activeGroupId);
  const groupLotteryHistory = lotteryHistory.filter(l => !l.groupId || l.groupId === activeGroupId);
  const groupLiftings = liftings.filter(l => !l.groupId || l.groupId === activeGroupId);

  // All chits belonging to the current logged-in member's phone number
  const userChits = useMemo(() => {
    if (!currentUser || currentUser.role === 'organizer') return [];
    const cleanPhone = (currentUser.phone || '').trim().replace(/\D/g, '');
    if (!cleanPhone) return [currentUser];
    const matching = members.filter(m => m.role !== 'organizer' && (m.phone || '').trim().replace(/\D/g, '') === cleanPhone);
    return matching.length > 0 ? matching : [currentUser];
  }, [currentUser, members]);

  const switchActiveChit = (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    if (target) {
      setCurrentUser(target);
      if (target.groupId) {
        setActiveGroupId(target.groupId);
      }
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
      } catch {}
      const targetGroup = groups.find(g => g.id === target.groupId);
      const groupName = targetGroup ? (language === 'te' ? targetGroup.nameTe : targetGroup.name) : '';
      showToast(
        language === 'te' ? `🎟️ చిట్టీ #${target.memberNo} కి మారారు` : `🎟️ Switched to Chit #${target.memberNo}`,
        language === 'te' ? `${target.nameTe || target.name} • ${groupName}` : `${target.name} • ${groupName}`,
        'info'
      );
      registerPushForUser(target);
    }
  };

  // Group Actions
  const createGroup = (groupData: Partial<ChitGroup>) => {
    const newId = `grp-${Date.now()}`;
    const newGroup: ChitGroup = {
      id: newId,
      name: groupData.name || 'New Chit Group',
      nameTe: groupData.nameTe || groupData.name || 'కొత్త చిట్ గ్రూప్',
      totalValue: groupData.totalValue || 200000,
      totalMonths: groupData.totalMonths || 20,
      totalMembers: groupData.totalMembers || 20,
      monthlyInstallment: groupData.monthlyInstallment || 10000,
      fixedTakenInstallment: groupData.fixedTakenInstallment || 11500,
      commissionPercent: groupData.commissionPercent || 5,
      currentMonth: 1,
      paymentDueDay: 10,
      organizerName: 'Siva (Organizer)',
      organizerPhone: '8790859546',
      organizerUpiId: '8790859546@ybl',
      status: 'active',
      ...groupData
    };

    setGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newId);

    // Send backend sync if online
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup)
    }).catch(() => {});
  };

  const addMember = async (memberData: { name: string; nameTe?: string; phone: string; pin?: string; groupId?: string }): Promise<Member> => {
    const targetGroupId = memberData.groupId || activeGroupId;
    let cleanPhone = memberData.phone.trim().replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(2);
    if (cleanPhone.startsWith('0') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(1);
    const cleanPin = memberData.pin?.trim() || '1234';

    const realMembersInGroup = members.filter(m => m.groupId === targetGroupId && m.role !== 'organizer');
    const nextNo = realMembersInGroup.length + 1;

    const newMember: Member = {
      id: `m-${Date.now()}`,
      groupId: targetGroupId,
      memberNo: nextNo,
      name: memberData.name.trim(),
      nameTe: memberData.nameTe?.trim() || memberData.name.trim(),
      phone: cleanPhone,
      pin: cleanPin,
      role: 'member',
      hasLiftedChit: false,
      totalPaidSoFar: 0
    };

    // Optimistically update React state and LocalStorage immediately
    setMembers(prev => [...prev.filter(m => m.id !== newMember.id), newMember]);
    try {
      const currentSaved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const parsed = currentSaved ? JSON.parse(currentSaved) : [];
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([...parsed.filter((m: Member) => m.id !== newMember.id), newMember]));
    } catch {}

    // Save to Atlas Cloud
    try {
      const res = await fetch(`/api/groups/${targetGroupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.id) {
          setMembers(prev => prev.map(m => m.id === newMember.id ? saved : m));
          return saved;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Server error saving member:', errData);
      }
    } catch (err) {
      console.error('Network error saving member to cloud:', err);
    }

    return newMember;
  };

  const deleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    fetch(`/api/members/${memberId}`, { method: 'DELETE' }).catch(() => {});
  };

  const updateMemberPin = (memberId: string, newPin: string) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, pin: newPin } : m));
    fetch(`/api/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin })
    }).catch(() => {});
  };

  const registerMember = (memberData: { name: string; phone: string; pin: string; groupId?: string }): { success: boolean; error?: string; member?: Member } => {
    const trimmedPhone = memberData.phone.trim().replace(/\D/g, '');
    const targetGroupId = memberData.groupId || activeGroupId;
    const targetGroup = groups.find(g => g.id === targetGroupId) || activeGroup;

    const existing = members.find(m => m.phone === trimmedPhone && m.groupId === targetGroupId && m.role !== 'organizer');
    if (existing) {
      return {
        success: false,
        error: language === 'te' 
          ? 'ఈ మొబైల్ నంబర్ ఇప్పటికే ఈ చిట్ స్కీమ్‌లో ఉంది.' 
          : 'This mobile number is already in this scheme.'
      };
    }

    const realMembersInGroup = members.filter(m => m.groupId === targetGroupId && m.role !== 'organizer');
    if (realMembersInGroup.length >= targetGroup.totalMembers) {
      return {
        success: false,
        error: language === 'te'
          ? `ఈ చిట్ గ్రూప్ సభ్యుల గరిష్ట పరిమితి (${targetGroup.totalMembers}) పూర్తయింది.`
          : `This chit group has reached capacity (${targetGroup.totalMembers} members).`
      };
    }

    const nextNo = realMembersInGroup.length + 1;
    const newMember: Member = {
      id: `m-${Date.now()}`,
      groupId: targetGroupId,
      memberNo: nextNo,
      name: memberData.name.trim(),
      nameTe: memberData.name.trim(),
      phone: trimmedPhone,
      pin: memberData.pin.trim() || '1234',
      role: 'member',
      hasLiftedChit: false,
      totalPaidSoFar: 0
    };

    setMembers(prev => [...prev, newMember]);
    setCurrentUser(newMember);
    setActiveGroupId(targetGroupId);

    // Save to Atlas Cloud
    fetch(`/api/groups/${targetGroupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    }).catch(() => {});

    return { success: true, member: newMember };
  };

  const login = async (phone: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    let cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }
    const cleanPin = pin.trim();

    // 1. Organizer Login Check (Siva)
    if (cleanPhone === '8790859546' || cleanPhone === activeGroup.organizerPhone) {
      if (cleanPin !== '9546' && cleanPin !== '8329') {
        return {
          success: false,
          error: language === 'te'
            ? 'ఆర్గనైజర్ సెక్యూరిటీ పిన్ తప్పుగా ఉంది. (PIN: 9546)'
            : 'Incorrect organizer PIN. (PIN: 9546)'
        };
      }
      const orgUser: Member = {
        id: 'm-org-siva',
        groupId: activeGroupId,
        memberNo: 0,
        name: 'Siva (Organizer)',
        nameTe: 'శివ (ఆర్గనైజర్)',
        phone: '8790859546',
        pin: cleanPin,
        role: 'organizer',
        hasLiftedChit: false,
        totalPaidSoFar: 0
      };
      setCurrentUser(orgUser);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(orgUser));
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(orgUser));
      } catch {}
      showToast(
        language === 'te' ? '✨ స్వాగతం, శివ గారు!' : '✨ Welcome, Siva!',
        language === 'te' ? 'ఆర్గనైజర్ పోర్టల్ లోకి లాగిన్ అయ్యారు.' : 'Logged into Organizer Portal.',
        'info'
      );
      registerPushForUser(orgUser);
      return { success: true };
    }

    // 2. Member Login Check
    let memberMatches = members.filter(m => m.phone === cleanPhone && m.role !== 'organizer');

    // If not found in local memory, check live MongoDB Atlas database immediately!
    if (memberMatches.length === 0) {
      try {
        const res = await fetch(`/api/members/lookup?phone=${cleanPhone}`);
        if (res.ok) {
          const fetchedMembers: Member[] = await res.json();
          if (fetchedMembers && fetchedMembers.length > 0) {
            const valid = fetchedMembers.filter(m => m.role !== 'organizer');
            if (valid.length > 0) {
              memberMatches = valid;
              setMembers(prev => [...prev.filter(p => !valid.some(v => v.id === p.id)), ...valid]);
            }
          }
        }
      } catch (err) {
        console.error('Live member lookup error:', err);
      }
    }

    if (memberMatches.length === 0) {
      return {
        success: false,
        error: language === 'te'
          ? 'ఈ మొబైల్ నంబర్ ఏ చిట్ గ్రూప్‌లోనూ నమోదు కాలేదు. దయచేసి నిర్వాహకుడు శివ (8790859546) గారిని సంప్రదించండి.'
          : 'Mobile number not registered in any chit group. Please contact Organizer Siva (8790859546).'
      };
    }

    const matchedMember = memberMatches.find(m => m.pin === cleanPin) || memberMatches[0];
    if (matchedMember.pin !== cleanPin) {
      return {
        success: false,
        error: language === 'te'
          ? 'తప్పుడు పిన్! దయచేసి ఆర్గనైజర్ కేటాయించిన 4-అంకెల పిన్ నమోదు చేయండి.'
          : 'Incorrect PIN! Please enter the 4-digit PIN provided by the organizer.'
      };
    }

    // Success! Automatically route to the assigned group
    setCurrentUser(matchedMember);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(matchedMember));
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(matchedMember));
    } catch {}
    if (matchedMember.groupId) {
      setActiveGroupId(matchedMember.groupId);
    }
    const memberDisplayName = language === 'te' ? (matchedMember.nameTe || matchedMember.name) : matchedMember.name;
    const multiChitMsg = memberMatches.length > 1
      ? (language === 'te' ? ` (మొత్తం ${memberMatches.length} చిట్టీలు)` : ` (${memberMatches.length} Chits linked)`)
      : '';
    showToast(
      language === 'te' ? `✨ స్వాగతం, ${memberDisplayName} గారు!` : `✨ Welcome back, ${memberDisplayName}!`,
      language === 'te' ? `సభ్యత్వ సంఖ్య #${matchedMember.memberNo}${multiChitMsg}. మీ పాస్‌బుక్ సిద్ధంగా ఉంది.` : `Member #${matchedMember.memberNo}${multiChitMsg}. Passbook is ready.`,
      'info'
    );
    registerPushForUser(matchedMember);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem('sv_chits_user_session_v2');
    } catch {}
  };

  const switchUser = (memberId: string) => {
    const found = members.find(m => m.id === memberId);
    if (found) {
      setCurrentUser(found);
      if (found.groupId) {
        setActiveGroupId(found.groupId);
      }
    }
  };

  // Record Monthly Auction / Chit Lifting (పాట పాడుకున్నవారు)
  const recordChitLifting = async (liftingData: Partial<ChitLiftingRecord>): Promise<ChitLiftingRecord> => {
    const month = liftingData.month || activeGroup.currentMonth;
    const chitValue = activeGroup.totalValue || 200000;
    const bidDiscount = Number(liftingData.bidDiscount) || 0;
    const organizerCommission = (chitValue * (activeGroup.commissionPercent || 5)) / 100;
    const netDistributed = chitValue - bidDiscount;
    const targetMember = members.find(m => m.id === liftingData.memberId);
    
    // Remaining members dividend
    const remainingMembersCount = Math.max(1, (activeGroup.totalMembers || 20) - 1);
    const dividendPerMember = Math.max(0, Math.round((bidDiscount - organizerCommission) / remainingMembersCount));

    const newRecord: ChitLiftingRecord = {
      id: `lift-${Date.now()}`,
      groupId: activeGroupId,
      month,
      memberId: liftingData.memberId || '',
      memberName: targetMember?.name || liftingData.memberName || 'Member',
      memberNameTe: targetMember?.nameTe || targetMember?.name || liftingData.memberNameTe || 'సభ్యుడు',
      memberNo: targetMember?.memberNo,
      liftType: liftingData.liftType || 'auction',
      chitValue,
      bidDiscount,
      organizerCommission,
      netDistributedAmount: netDistributed,
      dividendPerMember,
      date: new Date().toISOString().split('T')[0],
      status: 'distributed',
      notes: liftingData.notes || '',
      createdAt: new Date().toISOString()
    };

    // Update local liftings state
    setLiftings(prev => {
      const filtered = prev.filter(l => !(l.groupId === activeGroupId && l.month === month));
      return [newRecord, ...filtered];
    });

    // Update member's lifted state
    setMembers(prev => prev.map(m => {
      if (m.id === liftingData.memberId) {
        return { ...m, hasLiftedChit: true, liftedMonth: month };
      }
      return m;
    }));

    if (currentUser && currentUser.id === liftingData.memberId) {
      setCurrentUser(prev => prev ? { ...prev, hasLiftedChit: true, liftedMonth: month } : null);
    }

    // Dynamic Notification for this lifting
    const notif: ChitNotification = {
      id: `notif-${Date.now()}`,
      groupId: activeGroupId,
      title: `Month ${month} Chit Winner: ${newRecord.memberName}`,
      titleTe: `🏆 నెల ${month} చిట్ పాట విజేత: ${newRecord.memberNameTe}`,
      message: `${newRecord.memberName} (#${newRecord.memberNo || ''}) lifted Month ${month} chit for ₹${netDistributed.toLocaleString('en-IN')} (${newRecord.liftType === 'auction' ? 'Auction Bid' : 'Lucky Draw'}).`,
      messageTe: `${newRecord.memberNameTe} (#${newRecord.memberNo || ''}) గారు నెల ${month} చిట్ ను ₹${netDistributed.toLocaleString('en-IN')} చేతికి తీసుకున్నారు (${newRecord.liftType === 'auction' ? 'వేలం పాట' : 'లక్కీ డ్రా'}).`,
      type: 'lottery',
      date: new Date().toISOString().split('T')[0],
      isRead: false
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);

    // Send to API Server / MongoDB Atlas
    fetch(`/api/groups/${activeGroupId}/liftings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).catch(() => {});

    return newRecord;
  };

  // Lottery helpers (for active group - strictly excludes any member who lifted in any month)
  const getEligibleLotteryMembers = (): Member[] => {
    const liftedIds = new Set([
      ...groupLiftings.map(l => l.memberId),
      ...lotteryHistory.filter(lot => !lot.groupId || lot.groupId === activeGroupId).map(lot => lot.winnerMemberId),
      ...groupMembers.filter(m => m.hasLiftedChit).map(m => m.id)
    ]);
    return groupMembers.filter(m => !liftedIds.has(m.id) && !m.hasLiftedChit && m.role !== 'organizer');
  };

  const getExcludedLotteryMembers = (): Member[] => {
    const liftedIds = new Set([
      ...groupLiftings.map(l => l.memberId),
      ...lotteryHistory.filter(lot => !lot.groupId || lot.groupId === activeGroupId).map(lot => lot.winnerMemberId),
      ...groupMembers.filter(m => m.hasLiftedChit).map(m => m.id)
    ]);
    return groupMembers.filter(m => (liftedIds.has(m.id) || m.hasLiftedChit) && m.role !== 'organizer');
  };

  const drawLottery = (month: number): Member | null => {
    const eligible = getEligibleLotteryMembers();
    if (eligible.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[randomIndex];

    // Mark winner
    setMembers(prev => prev.map(m => {
      if (m.id === winner.id) {
        return { ...m, hasLiftedChit: true, liftedMonth: month };
      }
      return m;
    }));

    const auditRef = `AUDIT-${activeGroupId.toUpperCase()}-M${month}-${Date.now().toString().slice(-6)}`;

    const newRecord: LotteryRecord = {
      id: 'lot-' + Date.now(),
      groupId: activeGroupId,
      month,
      winnerMemberId: winner.id,
      winnerName: winner.name,
      winnerNameTe: winner.nameTe,
      drawnAt: new Date().toISOString(),
      eligibleMemberCount: eligible.length,
      auditRef
    };

    setLotteryHistory(prev => [newRecord, ...prev]);

    // Also record this as a lifting record with type 'lottery'
    const liftingRecord: ChitLiftingRecord = {
      id: `lift-${Date.now()}`,
      groupId: activeGroupId,
      month,
      memberId: winner.id,
      memberName: winner.name,
      memberNameTe: winner.nameTe,
      memberNo: winner.memberNo,
      liftType: 'lottery',
      chitValue: activeGroup.totalValue || 200000,
      bidDiscount: 0,
      organizerCommission: (activeGroup.totalValue * (activeGroup.commissionPercent || 5)) / 100,
      netDistributedAmount: activeGroup.totalValue || 200000,
      dividendPerMember: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'distributed',
      notes: `Won via transparent lucky draw (Audit: ${auditRef})`,
      createdAt: new Date().toISOString()
    };
    setLiftings(prev => [liftingRecord, ...prev]);
    fetch(`/api/groups/${activeGroupId}/liftings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(liftingRecord)
    }).catch(() => {});

    // Dynamic Lucky Draw Notification
    const lotteryNotif: ChitNotification = {
      id: `notif-${Date.now()}`,
      groupId: activeGroupId,
      title: `Lucky Draw Winner (Month ${month})`,
      titleTe: `🏆 నెల ${month} లక్కీ డ్రా విజేత ప్రకటన`,
      message: `${winner.name} (#${winner.memberNo}) won Month ${month} lucky draw of ₹${activeGroup.totalValue.toLocaleString('en-IN')}! Congratulations!`,
      messageTe: `నెల ${month} లక్కీ డ్రాలో ${winner.nameTe || winner.name} (#${winner.memberNo}) ₹${activeGroup.totalValue.toLocaleString('en-IN')} చిట్ గెలుచుకున్నారు! శుభాకాంక్షలు!`,
      type: 'lottery',
      date: new Date().toISOString().split('T')[0],
      isRead: false
    };
    setNotifications(prev => [lotteryNotif, ...prev]);
    triggerToast(lotteryNotif);

    // Backend sync
    fetch(`/api/groups/${activeGroupId}/lottery/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month,
        winnerId: winner.id,
        winnerName: winner.name,
        winnerNameTe: winner.nameTe,
        eligibleCount: eligible.length,
        auditRef
      })
    }).catch(() => {});

    if (currentUser && currentUser.id === winner.id) {
      setCurrentUser({
        ...currentUser,
        hasLiftedChit: true,
        liftedMonth: month
      });
    }

    return winner;
  };

  // Submit Payment with optional Screenshot Proof
  const submitPayment = (
    month: number,
    amount: number,
    utr: string = '',
    mode: string = 'Cash',
    proofUrl?: string
  ): PaymentRecord => {
    const member = currentUser || groupMembers[1] || members[0];

    // Prevent duplicate submission if payment is already pending or approved for this month
    const existing = payments.find(p => (!p.groupId || p.groupId === activeGroupId) && p.memberId === member.id && p.month === month && (p.status === 'pending' || p.status === 'approved'));
    if (existing) {
      console.warn('Payment for this month already pending/approved:', existing);
      return existing;
    }

    const receiptNo = `SVC-${new Date().getFullYear()}-${String(month).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      groupId: activeGroupId,
      memberId: member.id,
      memberName: member.name,
      month,
      amount,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      utr: utr ? utr.trim() : (mode === 'Cash' ? 'Cash' : mode),
      proofUrl: proofUrl || undefined,
      paymentMode: mode,
      receiptNo
    };

    setPayments(prev => [newPayment, ...prev]);

    // Send in-app notification for organizer
    const modeLabelTe = mode === 'Cash' ? 'నగదు (Cash)' : mode === 'PhonePe' ? 'PhonePe / GPay' : 'ఇతర UPI';
    const refSnippet = utr && utr !== 'Cash' && utr !== mode ? ` (${utr})` : '';

    const newNotif: ChitNotification = {
      id: `notif-${Date.now()}`,
      groupId: activeGroupId,
      title: 'New Payment Received',
      titleTe: 'కొత్త పేమెంట్ వచ్చింది',
      message: `${member.name} (#${member.memberNo || ''}) paid Month ${month} installment ₹${amount.toLocaleString('en-IN')} via ${mode}${refSnippet}. Please verify and approve.`,
      messageTe: `${member.nameTe || member.name} (#${member.memberNo || ''}) నెల ${month} వాయిదా ₹${amount.toLocaleString('en-IN')} చెల్లించారు (విధానం: ${modeLabelTe}${refSnippet}). దయచేసి పరిశీలించి ఆమోదించండి.`,
      type: 'payment',
      date: new Date().toISOString().split('T')[0],
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    triggerToast(newNotif);

    // Backend sync
    fetch(`/api/groups/${activeGroupId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayment)
    }).catch(() => {});

    return newPayment;
  };

  const approvePayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        setMembers(mPrev => mPrev.map(m => {
          if (m.id === p.memberId) {
            const updated = m.totalPaidSoFar + p.amount;
            if (currentUser && currentUser.id === m.id) {
              setCurrentUser({ ...currentUser, totalPaidSoFar: updated });
            }
            return { ...m, totalPaidSoFar: updated };
          }
          return m;
        }));
        return { ...p, status: 'approved' };
      }
      return p;
    }));

    // Notification for member
    const newNotif: ChitNotification = {
      id: `notif-${Date.now()}`,
      groupId: activeGroupId,
      title: 'Payment Received & Approved',
      titleTe: 'పేమెంట్ స్వీకరించబడింది',
      message: 'Monthly chit payment confirmed. Official receipt issued.',
      messageTe: 'నెలసరి చిట్ చెల్లింపు స్వీకరించబడింది మరియు అధికారిక రసీదు జారీ చేయబడింది.',
      type: 'payment',
      date: new Date().toISOString().split('T')[0],
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    triggerToast(newNotif);

    fetch(`/api/payments/${paymentId}/approve`, { method: 'PUT' }).catch(() => {});
  };

  const rejectPayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected' } : p));

    const newNotif: ChitNotification = {
      id: `notif-${Date.now()}`,
      groupId: activeGroupId,
      title: 'Payment Not Received',
      titleTe: 'పేమెంట్ రాలేదు (తిరస్కరించబడింది)',
      message: 'Payment marked as not received by organizer. Please verify transaction details.',
      messageTe: 'ఖాతాలో జమ కాలేదని నిర్వాహకుడు మార్క్ చేశారు. దయచేసి వివరాలు సరిచూసుకోండి.',
      type: 'payment',
      date: new Date().toISOString().split('T')[0],
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    triggerToast(newNotif);

    fetch(`/api/payments/${paymentId}/reject`, { method: 'PUT' }).catch(() => {});
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const setCurrentMonth = (month: number) => {
    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, currentMonth: month } : g));
    fetch(`/api/groups/${activeGroupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentMonth: month })
    }).catch(() => {});
  };

  // Truncate / Clear Database (Clean Slate Month 1 as requested by user!)
  const truncateAllData = async () => {
    try {
      await fetch('/api/db/truncate', { method: 'POST' });
    } catch {}

    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.LOTTERY);
    localStorage.removeItem(STORAGE_KEYS.LIFTINGS);
    setPayments([]);
    setLotteryHistory([]);
    setLiftings([]);

    const cleanMembers = DEFAULT_MEMBERS.map(m => ({
      ...m,
      hasLiftedChit: false,
      liftedMonth: undefined,
      totalPaidSoFar: 0
    }));
    setMembers(cleanMembers);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(cleanMembers));

    const cleanGroups = DEFAULT_GROUPS.map(g => ({
      ...g,
      currentMonth: 1
    }));
    setGroups(cleanGroups);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(cleanGroups));

    // Never auto-login on truncate
    setCurrentUser(null);
    sessionStorage.removeItem('sv_chits_user_session_v2');
  };

  // Seed clean data (Month 1 fresh slate)
  const seedAllData = async () => {
    try {
      await fetch('/api/db/seed', { method: 'POST' });
    } catch {}

    localStorage.clear();
    setGroups(DEFAULT_GROUPS);
    setActiveGroupId('grp-1');
    setMembers(DEFAULT_MEMBERS);
    setPayments([]);
    setLotteryHistory([]);
    setLiftings([]);
    setNotifications(DEFAULT_NOTIFICATIONS);

    // Never auto-login on seed
    setCurrentUser(null);
    sessionStorage.removeItem('sv_chits_user_session_v2');
  };

  const resetAllData = () => {
    seedAllData();
  };

  return (
    <ChitContext.Provider
      value={{
        groups,
        activeGroupId,
        activeGroup,
        scheme: activeGroup, // alias
        setActiveGroupId,
        createGroup,
        members,
        groupMembers,
        currentUser,
        userChits,
        switchActiveChit,
        language,
        setLanguage,
        login,
        registerMember,
        logout,
        switchUser,
        addMember,
        deleteMember,
        updateMemberPin,
        payments,
        groupPayments,
        submitPayment,
        approvePayment,
        rejectPayment,
        liftings,
        groupLiftings,
        recordChitLifting,
        lotteryHistory,
        groupLotteryHistory,
        getEligibleLotteryMembers,
        getExcludedLotteryMembers,
        drawLottery,
        notifications,
        unreadNotificationsCount,
        activeToast,
        dismissToast,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isPushSupported,
        pushPermission,
        requestNotificationPermission,
        showToast,
        dbStatus,
        setCurrentMonth,
        truncateAllData,
        seedAllData,
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
