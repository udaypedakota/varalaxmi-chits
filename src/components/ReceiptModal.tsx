import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useChit } from '../context/ChitContext';
import { PaymentRecord, Member } from '../types/chit';
import { X, Printer, Share2, CheckCircle2, MessageSquare, Download, Loader2 } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { openDeviceSms, getPaymentReceiptSmsText } from '../utils/smsHelper';

interface ReceiptModalProps {
  payment: PaymentRecord | null;
  member?: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, member, isOpen, onClose }) => {
  const { scheme, language, showToast } = useChit();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptBlob = async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });
      return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
    } catch (err) {
      console.error('Failed to generate receipt image:', err);
      return null;
    }
  };

  const handleShareWhatsApp = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const shareCaption = language === 'te'
      ? `🧾 *శ్రీ వరలక్ష్మి చిట్స్ - అధికారిక డిజిటల్ రసీదు*\n` +
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
      : `🧾 *Sri Varalaxmi Chits - Official Digital Receipt*\n` +
        `-----------------------------------------\n` +
        `Receipt No: ${payment.receiptNo}\n` +
        `Member Name: ${member?.name || payment.memberName}\n` +
        `Installment: Month ${payment.month} of 20\n` +
        `Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}\n` +
        `Payment Date: ${payment.date}\n` +
        `UTR / Ref ID: ${payment.utr || 'Cash'}\n` +
        `Status: Verified & Approved\n` +
        `-----------------------------------------\n` +
        `Organizer: ${scheme.organizerName} (${scheme.organizerPhone})`;

    try {
      const blob = await generateReceiptBlob();
      const fileName = `Sri-Varalaxmi-Chits-Receipt-${payment.receiptNo}.png`;

      if (blob) {
        const file = new File([blob], fileName, { type: 'image/png' });

        // 1. Mobile Native Web Share API with Image File (iOS Safari & Android Chrome -> WhatsApp)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Receipt #${payment.receiptNo}`,
            text: shareCaption
          });
          setIsGenerating(false);
          return;
        }

        // 2. Desktop Fallback: Download image automatically + copy to clipboard if supported
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
          }
        } catch {}

        showToast(
          language === 'te' ? 'రసీదు ఫోటో డౌన్‌లోడ్ అయ్యింది!' : 'Receipt Image Downloaded!',
          language === 'te' ? 'రసీదు ఫోటో సేవ్ చేయబడింది. వాట్సాప్‌లో ఫోటోను అటాచ్ చేసి పంపండి.' : 'Receipt image downloaded. You can attach it in WhatsApp.',
          'info'
        );
      }
    } catch (e) {
      console.log('Share error:', e);
    } finally {
      setIsGenerating(false);
    }

    // Open WhatsApp Web with caption if native file share didn't open
    const encodedText = encodeURIComponent(shareCaption);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const handleDownloadImage = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const blob = await generateReceiptBlob();
      if (blob) {
        const fileName = `Sri-Varalaxmi-Chits-Receipt-${payment.receiptNo}.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(
          language === 'te' ? 'రసీదు సేవ్ అయింది!' : 'Receipt Image Saved!',
          language === 'te' ? 'రసీదు చిత్రం విజయవంతంగా డౌన్‌లోడ్ చేయబడింది.' : 'Receipt image downloaded successfully.',
          'info'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendSms = () => {
    const phone = member?.phone || '';
    const text = getPaymentReceiptSmsText({
      memberName: member?.name || payment.memberName,
      month: payment.month,
      amount: payment.amount,
      receiptNo: payment.receiptNo,
      organizerName: scheme.organizerName,
      organizerPhone: scheme.organizerPhone
    });
    openDeviceSms(phone, text);
  };

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose}>
      <div className="receipt-modal-container" onClick={e => e.stopPropagation()}>
        {/* Top Control Bar with Language Switcher */}
        <div className="receipt-top-controls no-print">
          <LanguageToggle />
          <button type="button" className="btn-modal-close static" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="official-receipt-card print-target" ref={receiptRef}>
          {/* Header */}
          <div className="receipt-header-banner">
            <div className="receipt-logo-wrap">
              <img 
                src="/chit-app-icon-192.png" 
                alt="Sri Varalaxmi Chits Logo" 
                className="receipt-logo-img" 
              />
            </div>
            <h2 className="receipt-org-title">{language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్' : 'Sri Varalaxmi Chits'}</h2>
            <h3 className="receipt-org-subtitle">SRI VARALAXMI CHITS (₹2,00,000 SCHEME)</h3>
            <p className="receipt-org-reg">
              {language === 'te' 
                ? '20 నెలల పరస్పర ప్రయోజన చిట్ ఫండ్ పథకం • 20-Month Mutual Benefit Chit' 
                : '20-Month Mutual Benefit Chit Fund Scheme • ₹2,00,000 Total Value'}
            </p>
            <div className="receipt-divider"></div>
          </div>

          {/* Receipt Meta Bar */}
          <div className="receipt-meta-grid">
            <div>
              <span className="meta-label">{language === 'te' ? 'రసీదు నంబర్ / Receipt No:' : 'Receipt No:'}</span>
              <strong className="meta-value text-amber-400">{payment.receiptNo}</strong>
            </div>
            <div className="text-right">
              <span className="meta-label">{language === 'te' ? 'తేదీ / Date:' : 'Date:'}</span>
              <strong className="meta-value">{payment.date}</strong>
            </div>
          </div>

          {/* Member Details */}
          <div className="receipt-member-box">
            <div className="receipt-row">
              <span className="row-label">{language === 'te' ? 'సభ్యుని పేరు / Member Name:' : 'Member Name:'}</span>
              <span className="row-value font-bold">
                {language === 'te' ? `${member?.nameTe || payment.memberName} (${member?.name || payment.memberName})` : (member?.name || payment.memberName)}
              </span>
            </div>
            <div className="receipt-row">
              <span className="row-label">{language === 'te' ? 'సభ్యత్వ సంఖ్య / Member No:' : 'Member No:'}</span>
              <span className="row-value font-bold">#{member?.memberNo || '---'}</span>
            </div>
            <div className="receipt-row">
              <span className="row-label">{language === 'te' ? 'వాయిదా నెల / Installment Month:' : 'Installment Month:'}</span>
              <span className="row-value font-bold">
                {language === 'te' ? `నెల ${payment.month} (Month ${payment.month} of 20)` : `Month ${payment.month} of 20`}
              </span>
            </div>
            <div className="receipt-row">
              <span className="row-label">{language === 'te' ? 'ట్రాన్సాక్షన్ / UTR ID:' : 'Transaction / UTR ID:'}</span>
              <span className="row-value font-mono">{payment.utr || 'Cash Payment'}</span>
            </div>
            <div className="receipt-row">
              <span className="row-label">{language === 'te' ? 'చెల్లింపు విధానం / Payment Mode:' : 'Payment Mode:'}</span>
              <span className="row-value">{payment.paymentMode}</span>
            </div>
          </div>

          {/* Amount Paid Callout */}
          <div className="receipt-amount-banner">
            <div className="amount-label-col">
              <span>{language === 'te' ? 'చెల్లించిన మొత్తం' : 'Amount Paid'}</span>
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
              <span>{language === 'te' ? 'చెల్లింపు విజయవంతమైంది (PAYMENT RECEIVED)' : 'PAYMENT RECEIVED & VERIFIED'}</span>
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
                <span className="sig-title">{language === 'te' ? 'ఆర్గనైజర్ / Organizer' : 'Organizer'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="receipt-action-bar no-print">
          <button type="button" className="btn-secondary" onClick={handlePrint} disabled={isGenerating}>
            <Printer size={18} />
            <span>{language === 'te' ? 'ప్రింట్ (PDF)' : 'Print (PDF)'}</span>
          </button>
          <button type="button" className="btn-sms-share" onClick={handleSendSms} disabled={isGenerating}>
            <MessageSquare size={18} />
            <span>{language === 'te' ? 'SMS రసీదు' : 'Send SMS'}</span>
          </button>
          <button type="button" className="btn-download-image" onClick={handleDownloadImage} disabled={isGenerating} title={language === 'te' ? 'రసీదు ఫోటోను సేవ్ చేసుకోండి' : 'Save receipt image'}>
            <Download size={18} />
            <span>{language === 'te' ? 'ఫోటో సేవ్' : 'Save Image'}</span>
          </button>
          <button type="button" className="btn-whatsapp-share" onClick={handleShareWhatsApp} disabled={isGenerating}>
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            <span>{isGenerating ? (language === 'te' ? 'తయారవుతోంది...' : 'Generating...') : (language === 'te' ? 'WhatsApp (ఫోటో)' : 'WhatsApp (Image)')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
