import React from 'react';
import { useChit } from '../context/ChitContext';
import { PaymentRecord, Member } from '../types/chit';
import { X, Printer, Share2, CheckCircle2, Sparkles } from 'lucide-react';

interface ReceiptModalProps {
  payment: PaymentRecord | null;
  member?: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, member, isOpen, onClose }) => {
  const { scheme, language } = useChit();

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🧾 *శ్రీ వరలక్ష్మి చిట్స్ - అధికారిక డిజిటల్ రసీదు*\n` +
      `-----------------------------------------\n` +
      `రసీదు నం: ${payment.receiptNo}\n` +
      `సభ్యుని పేరు: ${member?.nameTe || payment.memberName}\n` +
      `వాయిదా నెల: నెల ${payment.month} / 20\n` +
      `చెల్లించిన మొత్తం: ₹${payment.amount.toLocaleString('en-IN')}\n` +
      `చెల్లింపు తేదీ: ${payment.date}\n` +
      `UTR / ట్రాన్సాక్షన్ ID: ${payment.utr || 'Cash'}\n` +
      `స్థితి: ఆమోదించబడింది (Approved)\n` +
      `-----------------------------------------\n` +
      `నిర్వాహకుడు: ${scheme.organizerName} (${scheme.organizerPhone})`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose}>
      <div className="receipt-modal-container" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button type="button" className="btn-modal-close no-print" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Printable Official Receipt Body */}
        <div className="official-receipt-card print-target">
          {/* Header */}
          <div className="receipt-header-banner">
            <div className="receipt-logo-wrap">
              <Sparkles size={28} className="text-yellow-400" />
            </div>
            <h2 className="receipt-org-title">శ్రీ వరలక్ష్మి చిట్స్</h2>
            <h3 className="receipt-org-subtitle">SRI VARALAXMI CHITS (₹2,00,000 SCHEME)</h3>
            <p className="receipt-org-reg">20 నెలల పరస్పర ప్రయోజన చిట్ ఫండ్ పథకం • 20-Month Mutual Benefit Chit</p>
            <div className="receipt-divider"></div>
          </div>

          {/* Receipt Meta Bar */}
          <div className="receipt-meta-grid">
            <div>
              <span className="meta-label">రసీదు నంబర్ / Receipt No:</span>
              <strong className="meta-value text-amber-400">{payment.receiptNo}</strong>
            </div>
            <div className="text-right">
              <span className="meta-label">తేదీ / Date:</span>
              <strong className="meta-value">{payment.date}</strong>
            </div>
          </div>

          {/* Member Details */}
          <div className="receipt-member-box">
            <div className="receipt-row">
              <span className="row-label">సభ్యుని పేరు / Member Name:</span>
              <span className="row-value font-bold">{member?.nameTe || payment.memberName} ({member?.name || payment.memberName})</span>
            </div>
            <div className="receipt-row">
              <span className="row-label">సభ్యత్వ సంఖ్య / Member No:</span>
              <span className="row-value font-bold">#{member?.memberNo || '---'}</span>
            </div>
            <div className="receipt-row">
              <span className="row-label">వాయిదా నెల / Installment Month:</span>
              <span className="row-value font-bold">నెల {payment.month} (Month {payment.month} of 20)</span>
            </div>
            <div className="receipt-row">
              <span className="row-label">ట్రాన్సాక్షన్ / UTR ID:</span>
              <span className="row-value font-mono">{payment.utr || 'Cash Payment'}</span>
            </div>
            <div className="receipt-row">
              <span className="row-label">చెల్లింపు విధానం / Payment Mode:</span>
              <span className="row-value">{payment.paymentMode}</span>
            </div>
          </div>

          {/* Amount Paid Callout */}
          <div className="receipt-amount-banner">
            <div className="amount-label-col">
              <span>చెల్లించిన మొత్తం</span>
              <small>TOTAL RECEIVED AMOUNT</small>
            </div>
            <div className="amount-figure-col">
              ₹{payment.amount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Status & Watermark Seal */}
          <div className="receipt-footer-section">
            <div className="status-indicator-badge">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>చెల్లింపు విజయవంతమైంది (PAYMENT RECEIVED)</span>
            </div>

            <div className="receipt-seal-wrap">
              <div className="digital-stamp">
                <span>SRI VARALAXMI CHITS</span>
                <strong>★ VERIFIED ★</strong>
                <small>AUTHORIZED SIGN</small>
              </div>
              <div className="organizer-signature">
                <span className="sig-line"></span>
                <span className="sig-name">{scheme.organizerName}</span>
                <span className="sig-title">ఆర్గనైజర్ / Organizer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="receipt-action-bar no-print">
          <button type="button" className="btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            <span>{language === 'te' ? 'ప్రింట్ / డౌన్‌లోడ్ (PDF)' : 'Print / Download'}</span>
          </button>
          <button type="button" className="btn-whatsapp-share" onClick={handleShareWhatsApp}>
            <Share2 size={18} />
            <span>WhatsApp లో పంపండి</span>
          </button>
        </div>
      </div>
    </div>
  );
};
