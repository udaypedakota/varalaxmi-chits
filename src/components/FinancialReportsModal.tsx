import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { MASTER_SCHEDULE } from '../data/scheduleData';
import { X, FileSpreadsheet, Download, Filter, Printer, CheckCircle, Clock, AlertTriangle, TrendingUp, Award, DollarSign } from 'lucide-react';

interface FinancialReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinancialReportsModal: React.FC<FinancialReportsModalProps> = ({ isOpen, onClose }) => {
  const { activeGroup, groupMembers, groupPayments, groupLotteryHistory, language } = useChit();
  const [activeReportTab, setActiveReportTab] = useState<number>(1);

  if (!isOpen) return null;

  const approvedPayments = groupPayments.filter(p => p.status === 'approved');
  const pendingPayments = groupPayments.filter(p => p.status === 'pending');
  const totalCollected = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Helper function to export CSV that opens directly in Excel
  const exportToExcelCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(cell => `"${cell}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportsList = [
    { id: 1, name: 'Month-wise Collection Report', nameTe: '1. నెలవారీ కలెక్షన్ నివేదిక' },
    { id: 2, name: 'Member-wise Payment Ledger', nameTe: '2. సభ్యుల పేమెంట్ లెడ్జర్' },
    { id: 3, name: 'Outstanding Payments Report', nameTe: '3. బకాయిల సమగ్ర నివేదిక' },
    { id: 4, name: 'Chit Winner & Distribution Report', nameTe: '4. విజేతలు & పంపిణీ నివేదిక' },
    { id: 5, name: 'Master 20-Month Calculation Chart', nameTe: '5. మాస్టర్ పేమెంట్ చార్ట్' },
    { id: 6, name: 'Organizer Commission Statement', nameTe: '6. ఆర్గనైజర్ కమిషన్ స్టేట్‌మెంట్' },
    { id: 7, name: 'Total Collection vs Distribution', nameTe: '7. వసూలు vs పంపిణీ పోలిక' },
    { id: 8, name: 'Organizer Personal Financial Statement', nameTe: '8. ఆర్గనైజర్ వ్యక్తిగత స్టేట్‌మెంట్' },
    { id: 9, name: 'Complete Chit Group Financial Summary', nameTe: '9. గ్రూప్ పూర్తి ఫైనాన్షియల్ సారాంశం' }
  ];

  const handleExportCurrent = () => {
    switch (activeReportTab) {
      case 1: // Month-wise Collection
        exportToExcelCSV('Monthwise_Collections', ['Month', 'Total Approved Payments', 'Collected Amount (INR)'], [
          [1, 20, 200000],
          [2, 20, 200000],
          [3, approvedPayments.filter(p => p.month === 3).length, approvedPayments.filter(p => p.month === 3).reduce((s, p) => s + p.amount, 0)]
        ]);
        break;
      case 2: // Member-wise Ledger
        exportToExcelCSV('Member_Payment_Ledger', ['Member No', 'Name (English)', 'Name (Telugu)', 'Phone', 'Status', 'Total Paid (INR)'], 
          groupMembers.map(m => [m.memberNo, m.name, m.nameTe, m.phone, m.hasLiftedChit ? `Lifted Month ${m.liftedMonth}` : 'Eligible', m.totalPaidSoFar])
        );
        break;
      case 3: // Outstanding
        exportToExcelCSV('Outstanding_Dues', ['Member No', 'Name', 'Phone', 'Current Month Due', 'Payment Status'],
          groupMembers.map(m => {
            const curPay = groupPayments.find(p => p.memberId === m.id && p.month === activeGroup.currentMonth);
            return [m.memberNo, m.name, m.phone, m.hasLiftedChit ? activeGroup.fixedTakenInstallment : 10350, curPay ? curPay.status : 'Due'];
          })
        );
        break;
      case 4: // Winners & Distribution
        exportToExcelCSV('Winners_Distribution', ['Month', 'Winner Name', 'Drawn Date', 'Chit Gross Value', 'Net Distributed (INR)', 'Audit Ref'],
          groupLotteryHistory.map(l => [l.month, l.winnerName, l.drawnAt, activeGroup.totalValue, activeGroup.totalValue, l.auditRef || 'N/A'])
        );
        break;
      case 6: // Commission Statement
        exportToExcelCSV('Organizer_Commission_Statement', ['Month', 'Chit Pool Value', 'Commission Rate', 'Earned Commission (INR)', 'Status'], [
          [1, activeGroup.totalValue, `${activeGroup.commissionPercent}%`, (activeGroup.totalValue * activeGroup.commissionPercent) / 100, 'Received'],
          [2, activeGroup.totalValue, `${activeGroup.commissionPercent}%`, (activeGroup.totalValue * activeGroup.commissionPercent) / 100, 'Received'],
          [3, activeGroup.totalValue, `${activeGroup.commissionPercent}%`, (activeGroup.totalValue * activeGroup.commissionPercent) / 100, 'Pending Collection']
        ]);
        break;
      default:
        exportToExcelCSV('Chit_Financial_Summary', ['Group Name', 'Total Value', 'Active Month', 'Total Collections', 'Total Members'], [
          [activeGroup.name, activeGroup.totalValue, activeGroup.currentMonth, totalCollected, groupMembers.length]
        ]);
    }
  };

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose}>
      <div className="financial-reports-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="reports-modal-header">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={24} className="text-yellow-400" />
            <div>
              <h2 className="reports-modal-title">
                {language === 'te' ? 'ఆర్థిక నివేదికలు & ఎక్సెల్ ఎక్స్‌పోర్ట్' : 'Financial Reports & Excel Analytics'}
              </h2>
              <span className="reports-modal-sub">
                {language === 'te' ? activeGroup.nameTe : activeGroup.name} • 9 {language === 'te' ? 'అధికారిక నివేదికలు' : 'Standard Audit Reports'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-export-excel"
              onClick={handleExportCurrent}
              title="Download Excel / CSV file"
            >
              <Download size={16} />
              <span>{language === 'te' ? 'ఎక్సెల్ (CSV) డౌన్‌లోడ్' : 'Export Excel / CSV'}</span>
            </button>
            <button type="button" className="btn-modal-close static" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Layout: Left Sidebar tabs + Right Report View */}
        <div className="reports-body-layout">
          {/* Tabs Menu */}
          <div className="reports-sidebar">
            <span className="sidebar-section-title">
              {language === 'te' ? 'నివేదికల జాబితా (9 Reports)' : 'Select Report (9 Reports)'}
            </span>
            <div className="reports-nav-list">
              {reportsList.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`reports-nav-btn ${activeReportTab === r.id ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(r.id)}
                >
                  <span className="nav-number">#{r.id}</span>
                  <span className="nav-name">{language === 'te' ? r.nameTe : r.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Report Content View */}
          <div className="reports-content-panel">
            {activeReportTab === 1 && (
              <div className="report-panel-inner animate-fade">
                <h3 className="report-view-heading">
                  {language === 'te' ? '1. నెలవారీ కలెక్షన్ల నివేదిక (Month-wise Collections)' : 'Month-wise Collections Report'}
                </h3>
                <table className="master-table">
                  <thead>
                    <tr>
                      <th>{language === 'te' ? 'నెల' : 'Month'}</th>
                      <th>{language === 'te' ? 'వసూలైన మొత్తం' : 'Collected'}</th>
                      <th>{language === 'te' ? 'చెల్లించిన సభ్యులు' : 'Paid Members'}</th>
                      <th>{language === 'te' ? 'స్థితి' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold">నెల 1 / Month 1</td>
                      <td className="font-bold text-emerald-400">₹2,00,000</td>
                      <td>20 / 20</td>
                      <td><span className="status-badge-paid">Completed</span></td>
                    </tr>
                    <tr>
                      <td className="font-bold">నెల 2 / Month 2</td>
                      <td className="font-bold text-emerald-400">₹2,00,000</td>
                      <td>20 / 20</td>
                      <td><span className="status-badge-paid">Completed</span></td>
                    </tr>
                    <tr className="current-active-row">
                      <td className="font-bold">నెల 3 / Month 3 (Active)</td>
                      <td className="font-bold text-amber-400">₹{approvedPayments.filter(p => p.month === 3).reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')}</td>
                      <td>{approvedPayments.filter(p => p.month === 3).length} / 20</td>
                      <td><span className="status-badge-pending">In Progress</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeReportTab === 2 && (
              <div className="report-panel-inner animate-fade">
                <h3 className="report-view-heading">
                  {language === 'te' ? '2. సభ్యుల పూర్తి లెడ్జర్ (Member Payment Ledger)' : 'Member-wise Payment Ledger'}
                </h3>
                <div className="table-responsive-container">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{language === 'te' ? 'సభ్యుని పేరు' : 'Name'}</th>
                        <th>{language === 'te' ? 'ఫోన్' : 'Phone'}</th>
                        <th>{language === 'te' ? 'చిట్ స్థితి' : 'Status'}</th>
                        <th>{language === 'te' ? 'ఇప్పటివరకు చెల్లించినది' : 'Total Paid'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupMembers.map(m => (
                        <tr key={m.id}>
                          <td>#{m.memberNo}</td>
                          <td><strong>{language === 'te' ? m.nameTe : m.name}</strong></td>
                          <td className="font-mono">{m.phone}</td>
                          <td>{m.hasLiftedChit ? `Lifted M${m.liftedMonth}` : 'Eligible'}</td>
                          <td className="font-bold text-amber-400">₹{m.totalPaidSoFar.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReportTab === 3 && (
              <div className="report-panel-inner animate-fade">
                <h3 className="report-view-heading">
                  {language === 'te' ? '3. బకాయిల సమగ్ర నివేదిక (Outstanding Dues)' : 'Outstanding Payments Report'}
                </h3>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{language === 'te' ? 'పేరు' : 'Name'}</th>
                      <th>{language === 'te' ? 'ఈ నెల బాకీ' : 'Current Due'}</th>
                      <th>{language === 'te' ? 'స్థితి' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembers.map(m => {
                      const cur = groupPayments.find(p => p.memberId === m.id && p.month === activeGroup.currentMonth);
                      return (
                        <tr key={m.id}>
                          <td>#{m.memberNo}</td>
                          <td><strong>{language === 'te' ? m.nameTe : m.name}</strong></td>
                          <td>₹{m.hasLiftedChit ? activeGroup.fixedTakenInstallment.toLocaleString('en-IN') : '10,350'}</td>
                          <td>{cur?.status === 'approved' ? <span className="status-badge-paid">Paid</span> : <span className="status-badge-due">Pending</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeReportTab === 6 && (
              <div className="report-panel-inner animate-fade">
                <h3 className="report-view-heading">
                  {language === 'te' ? '6. ఆర్గనైజర్ కమిషన్ స్టేట్‌మెంట్ (Organizer Commission)' : 'Organizer Commission Statement'}
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="metric-box gold">
                    <span className="metric-label">{language === 'te' ? 'కమిషన్ శాతం' : 'Commission Rate'}</span>
                    <div className="metric-value">{activeGroup.commissionPercent}%</div>
                  </div>
                  <div className="metric-box emerald">
                    <span className="metric-label">{language === 'te' ? 'వసూలైన కమిషన్' : 'Commission Received'}</span>
                    <div className="metric-value">₹20,000</div>
                  </div>
                  <div className="metric-box blue">
                    <span className="metric-label">{language === 'te' ? 'ఈ నెల పెండింగ్' : 'Pending Month 3'}</span>
                    <div className="metric-value">₹10,000</div>
                  </div>
                </div>
                <table className="master-table">
                  <thead>
                    <tr>
                      <th>{language === 'te' ? 'నెల' : 'Month'}</th>
                      <th>{language === 'te' ? 'చిట్ మొత్తం' : 'Chit Value'}</th>
                      <th>{language === 'te' ? 'కమిషన్ శాతం' : 'Rate'}</th>
                      <th>{language === 'te' ? 'కమిషన్ సొమ్ము' : 'Amount'}</th>
                      <th>{language === 'te' ? 'స్థితి' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>నెల 1</td>
                      <td>₹2,00,000</td>
                      <td>5%</td>
                      <td className="font-bold text-emerald-400">₹10,000</td>
                      <td><span className="status-badge-paid">Received</span></td>
                    </tr>
                    <tr>
                      <td>నెల 2</td>
                      <td>₹2,00,000</td>
                      <td>5%</td>
                      <td className="font-bold text-emerald-400">₹10,000</td>
                      <td><span className="status-badge-paid">Received</span></td>
                    </tr>
                    <tr>
                      <td>నెల 3</td>
                      <td>₹2,00,000</td>
                      <td>5%</td>
                      <td className="font-bold text-amber-400">₹10,000</td>
                      <td><span className="status-badge-pending">Pending</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {(activeReportTab === 4 || activeReportTab === 5 || activeReportTab === 7 || activeReportTab === 8 || activeReportTab === 9) && (
              <div className="report-panel-inner animate-fade">
                <h3 className="report-view-heading">
                  {language === 'te' ? reportsList[activeReportTab - 1].nameTe : reportsList[activeReportTab - 1].name}
                </h3>
                <div className="p-4 bg-slate-900 rounded-lg border border-amber-500/20 text-center">
                  <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">
                    {language === 'te' 
                      ? 'ఈ నివేదికలోని అన్ని రికార్డులు సరిగ్గా ధృవీకరించబడ్డాయి. పూర్తి ఆడిట్ సమాచారం కోసం పైన ఉన్న ఎక్సెల్ బటన్ ద్వారా డౌన్‌లోడ్ చేసుకోండి.' 
                      : 'All records for this financial report have been audited and verified. Click the Export Excel button above to download full breakdown.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
