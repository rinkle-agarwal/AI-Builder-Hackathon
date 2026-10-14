import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  FileDown, 
  Calendar, 
  TrendingUp, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceDot 
} from 'recharts';
import { TestRun } from '../types';
import { RELEASE_MARKERS, MOCK_HISTORICAL_RUNS_SUMMARY } from '../data/mock';

interface ComplianceTrailProps {
  runs: TestRun[];
  onSelectRun: (runId: string) => void;
}

export const ComplianceTrail: React.FC<ComplianceTrailProps> = ({
  runs,
  onSelectRun
}) => {
  const navigate = useNavigate();
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Combine historical list with active memory runs
  const allRunsTable = [
    ...runs.map(r => ({
      id: r.id,
      runNumber: r.runNumber,
      date: r.runDate,
      time: r.formattedTime,
      trigger: r.trigger,
      variant: r.variant,
      score: r.complianceScore,
      nonCompliant: r.nonCompliantCount,
      changeVsPrev: r.complianceScore - r.previousRunScore,
      duration: `${r.durationSeconds}s`,
      status: r.status
    })),
    // Historical predecessors if not already in runs
    ...MOCK_HISTORICAL_RUNS_SUMMARY
      .filter(h => !runs.some(r => r.runNumber === h.runNumber))
      .map(h => ({
        id: h.id,
        runNumber: h.runNumber,
        date: h.date,
        time: '10:00:00 IST',
        trigger: h.trigger as any,
        variant: h.variant as any,
        score: h.score,
        nonCompliant: h.nonCompliant,
        changeVsPrev: h.runNumber === 7 ? 0 : (h.score - (MOCK_HISTORICAL_RUNS_SUMMARY.find(x => x.runNumber === h.runNumber - 1)?.score || h.score)),
        duration: h.duration,
        status: h.status as any
      }))
  ].sort((a, b) => b.runNumber - a.runNumber);

  // Score trend chart data
  const trendData = MOCK_HISTORICAL_RUNS_SUMMARY.map(r => ({
    name: `Run #${r.runNumber}`,
    runNumber: r.runNumber,
    date: r.date,
    score: r.score,
    release: RELEASE_MARKERS.find(m => m.date === r.fullDate)?.title || null,
    releaseNote: RELEASE_MARKERS.find(m => m.date === r.fullDate)?.description || null,
  }));

  const handleExportCSV = () => {
    const headers = ['Run_ID', 'Run_Number', 'Date', 'Trigger', 'Variant', 'Compliance_Score', 'Non_Compliant_Count', 'Score_Change', 'Duration', 'Status'];
    const rows = allRunsTable.map(r => [
      r.id,
      r.runNumber,
      `"${r.date}"`,
      r.trigger,
      `"${r.variant}"`,
      r.score,
      r.nonCompliant,
      r.changeVsPrev,
      r.duration,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrustLens_Compliance_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast('Compliance audit CSV exported successfully.');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleRowClick = (runId: string) => {
    onSelectRun(runId);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#102A56] flex items-center gap-2">
            <History className="w-5 h-5 text-[#2F6FA3]" />
            <span>Compliance Trail &amp; Regulatory Audit Ledger</span>
          </h1>
          <p className="text-xs text-[#5B6B82]">
            Immutable record of all synthetic customer runs, release regressions, and verified remediations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="http://localhost:8000/api/run/RUN-012/report.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            title="Download compiled executive regulatory PDF report"
          >
            <FileText className="w-4 h-4" />
            <span>Download Executive PDF</span>
          </a>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white text-[#102A56] border border-[#D6E0EA] hover:bg-[#F8FAFC] shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#2F6FA3]" />
            <span>Export Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {downloadToast && (
        <div className="p-3 bg-[#E8F5EE] border border-[#C2E7D3] text-[#1E7B53] rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1E7B53]" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Score Trend Chart with Release Markers */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-2">
          <div>
            <h3 className="text-base font-semibold text-[#102A56]">
              Continuous Compliance Trend &amp; Release Impact
            </h3>
            <p className="text-xs text-[#5B6B82]">
              Score history over time. Red pins indicate major feature rollouts that introduced non-compliant patterns.
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#EAF4F8] text-[#2F6FA3] border border-[#C6DEEE]">
            6 Evaluated Cycles
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 15, right: 20, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5B6B82' }} stroke="#D6E0EA" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5B6B82' }} stroke="#D6E0EA" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg border border-[#D6E0EA] shadow-md text-xs space-y-1">
                        <div className="font-semibold text-[#102A56]">{data.name} · {data.date}</div>
                        <div className="text-sm font-bold text-[#2F6FA3]">Compliance Score: {data.score}/100</div>
                        {data.release && (
                          <div className="pt-1 mt-1 border-t border-[#F1F5F9] text-[#B3261E] font-medium">
                            🏷️ {data.release}
                            <div className="text-[11px] text-[#5B6B82] font-normal">{data.releaseNote}</div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#2F6FA3" 
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#102A56', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#2F6FA3' }}
              />
              <ReferenceDot x="Run #9" y={60} r={5} fill="#B3261E" stroke="#FFFFFF" />
              <ReferenceDot x="Run #10" y={48} r={5} fill="#B3261E" stroke="#FFFFFF" />
              <ReferenceDot x="Run #11" y={16} r={6} fill="#B3261E" stroke="#FFFFFF" />
              <ReferenceDot x="Run #12" y={56} r={5} fill="#1E7B53" stroke="#FFFFFF" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Release Markers Legend */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-[#F1F5F9] text-xs">
          {RELEASE_MARKERS.map(m => (
            <div key={m.version} className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="font-semibold text-[#102A56] flex items-center justify-between">
                <span>{m.title}</span>
                <span className={`text-[10px] font-mono ${m.scoreImpact >= 0 ? 'text-[#1E7B53]' : 'text-[#B3261E]'}`}>
                  {m.scoreImpact >= 0 ? `+${m.scoreImpact} pts` : `${m.scoreImpact} pts`}
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B82] mt-0.5 line-clamp-2">
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Runs Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#D6E0EA] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D6E0EA] bg-[#F8FAFC] flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-[#102A56]">
              All Compliance Audit Sessions
            </h3>
            <p className="text-xs text-[#5B6B82]">
              Click any run row to load its complete multi-agent pipeline and findings in the Overview.
            </p>
          </div>
          <span className="text-xs font-mono text-[#899BB0]">
            {allRunsTable.length} Records Persisted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#D6E0EA] text-[#5B6B82] font-semibold">
                <th className="py-3 px-3">Run ID</th>
                <th className="py-3 px-3">Execution Date</th>
                <th className="py-3 px-3">Trigger Mode</th>
                <th className="py-3 px-3">Variant Condition</th>
                <th className="py-3 px-3">Compliance Score</th>
                <th className="py-3 px-3">Non-Compliant Count</th>
                <th className="py-3 px-3">Score Delta</th>
                <th className="py-3 px-3">Run Duration</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {allRunsTable.map(run => (
                <tr
                  key={run.id}
                  onClick={() => handleRowClick(run.id)}
                  className="hover:bg-[#F8FBFE] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-bold text-[#102A56]">
                    {run.id}
                  </td>
                  <td className="py-3 px-3 text-[#334155] font-medium">
                    {run.date}
                  </td>
                  <td className="py-3 px-3 text-[#5B6B82]">
                    <span className="px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#CBD5E1] text-[11px]">
                      {run.trigger}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#1B2B45] font-medium">
                    {run.variant}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold tabular-nums text-[#102A56]">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      run.score >= 80 ? 'bg-[#E8F5EE] text-[#1E7B53]' :
                      run.score >= 50 ? 'bg-[#EAF4F8] text-[#2F6FA3]' : 'bg-[#FDF2F2] text-[#B3261E]'
                    }`}>
                      {run.score}/100
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums text-[#B3261E] font-semibold">
                    {run.nonCompliant}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums">
                    {run.changeVsPrev > 0 ? (
                      <span className="text-[#1E7B53] font-medium">+{run.changeVsPrev} pts</span>
                    ) : run.changeVsPrev < 0 ? (
                      <span className="text-[#B3261E] font-medium">{run.changeVsPrev} pts</span>
                    ) : (
                      <span className="text-[#899BB0]">0 pts</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#5B6B82]">
                    {run.duration}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
