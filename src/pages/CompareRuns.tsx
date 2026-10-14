import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitCompare, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { TestRun } from '../types';
import { EvidenceScreenshot } from '../components/EvidenceScreenshot';
import { CCPA_PATTERNS_CATALOG } from '../data/mock';

interface CompareRunsProps {
  runs: TestRun[];
  onSelectRunForOverview: (runId: string) => void;
}

export const CompareRuns: React.FC<CompareRunsProps> = ({ runs, onSelectRunForOverview }) => {
  const navigate = useNavigate();

  // Find default run 11 and run 12 if available
  const [runAId, setRunAId] = useState<string>('RUN-011');
  const [runBId, setRunBId] = useState<string>('RUN-012');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('cart');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Fallbacks if RUN-011 isn't in memory yet, or use first two
  const runB = useMemo(() => {
    return runs.find(r => r.id === runBId) || runs[0];
  }, [runs, runBId]);

  // Synthetic or found Run A
  const runA = useMemo(() => {
    const found = runs.find(r => r.id === runAId);
    if (found) return found;
    // Synthesize Run #11 for pristine comparison if not in memory
    return {
      id: 'RUN-011',
      runNumber: 11,
      siteName: 'FreshCart (demo store)',
      targetUrl: 'https://freshcart-demo.store',
      journeyTemplate: 'Search > cart > checkout > cancel',
      runDate: '6 Oct 2026',
      formattedTime: '11:15:00 IST',
      status: 'Completed' as const,
      variant: 'All faults' as const,
      trigger: 'Release hook' as const,
      mode: 'Quick' as const,
      durationSeconds: 105,
      complianceScore: 16,
      previousRunScore: 48,
      nonCompliantCount: 5,
      previousNonCompliantCount: 3,
      compliantCount: 0,
      previousCompliantCount: 2,
      needsReviewCount: 1,
      previousNeedsReviewCount: 1,
      patternCoverage: '5 of 13 tested',
      previousRunId: 'RUN-010',
      stages: [],
      patterns: runB?.patterns.map(p => ({
        ...p,
        status: (p.patternId === 'CP-01' || p.patternId === 'CP-02' || p.patternId === 'CP-03' || p.patternId === 'CP-04' || p.patternId === 'CP-05') 
          ? ('Non-compliant' as const) 
          : ('Not tested' as const),
        changeVsLastRun: 'Still open' as const,
        note: 'Flagged violation'
      })) || [],
      findings: [],
      evidenceCheckpoints: [],
      logs: [],
      demoHarness: { seededFaultsTotal: 5, seededFaultsFound: 5, falseAlarms: 0, genuineStockCleared: false, decoyBugClassified: false }
    };
  }, [runs, runAId, runB]);

  // Score delta
  const scoreDiff = (runB?.complianceScore || 0) - (runA?.complianceScore || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#102A56] flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#2F6FA3]" />
            <span>Differential Run Comparator</span>
          </h1>
          <p className="text-xs text-[#5B6B82]">
            Audit two runs side-by-side to verify remediation success or detect regressions.
          </p>
        </div>

        {/* Run Selectors */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5B6B82] font-medium">Baseline (A):</span>
            <select
              value={runAId}
              onChange={(e) => setRunAId(e.target.value)}
              className="px-2.5 py-1.5 border border-[#D6E0EA] rounded-lg bg-[#F8FAFC] font-mono text-xs font-semibold text-[#102A56]"
            >
              <option value="RUN-011">Run #11 (6 Oct 2026 - Score 16)</option>
              <option value="RUN-010">Run #10 (29 Sep 2026 - Score 48)</option>
              <option value="RUN-009">Run #9 (22 Sep 2026 - Score 60)</option>
              {runs.map(r => (
                <option key={r.id} value={r.id}>
                  Run #{r.runNumber} ({r.runDate} - Score {r.complianceScore})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-[#899BB0]" />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5B6B82] font-medium">Comparison (B):</span>
            <select
              value={runBId}
              onChange={(e) => setRunBId(e.target.value)}
              className="px-2.5 py-1.5 border border-[#D6E0EA] rounded-lg bg-[#F8FAFC] font-mono text-xs font-semibold text-[#102A56]"
            >
              {runs.map(r => (
                <option key={r.id} value={r.id}>
                  Run #{r.runNumber} ({r.runDate} - Score {r.complianceScore})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Summary Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Run A Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                Baseline: Run #{runA.runNumber}
              </span>
              <div className="text-xs text-[#5B6B82] mt-1">{runA.runDate} · {runA.formattedTime}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-[#B3261E]">
                {runA.complianceScore}/100
              </div>
              <div className="text-[11px] text-[#5B6B82]">Baseline Score</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-[#FDF2F2] border border-[#F8D0CD]">
              <div className="font-bold font-mono text-[#B3261E]">{runA.nonCompliantCount}</div>
              <div className="text-[10px] text-[#B3261E]">Non-compliant</div>
            </div>
            <div className="p-2 rounded-lg bg-[#E8F5EE] border border-[#C2E7D3]">
              <div className="font-bold font-mono text-[#1E7B53]">{runA.compliantCount}</div>
              <div className="text-[10px] text-[#1E7B53]">Compliant</div>
            </div>
            <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#D6E0EA]">
              <div className="font-bold font-mono text-[#102A56]">{runA.variant}</div>
              <div className="text-[10px] text-[#5B6B82]">Test Variant</div>
            </div>
          </div>
        </div>

        {/* Run B Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#2F6FA3] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#EAF4F8] text-[#2F6FA3] border border-[#C6DEEE]">
                Comparison: Run #{runB.runNumber}
              </span>
              <div className="text-xs text-[#5B6B82] mt-1">{runB.runDate} · {runB.formattedTime}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-[#102A56] flex items-center justify-end gap-2">
                <span>{runB.complianceScore}/100</span>
                {scoreDiff >= 0 ? (
                  <span className="text-xs font-medium text-[#1E7B53] flex items-center">
                    <ArrowUpRight className="w-4 h-4" /> +{scoreDiff}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#B3261E] flex items-center">
                    <ArrowDownRight className="w-4 h-4" /> {scoreDiff}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#5B6B82]">Remediation Delta</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-[#FDF2F2] border border-[#F8D0CD]">
              <div className="font-bold font-mono text-[#B3261E]">{runB.nonCompliantCount}</div>
              <div className="text-[10px] text-[#B3261E]">Non-compliant</div>
            </div>
            <div className="p-2 rounded-lg bg-[#E8F5EE] border border-[#C2E7D3]">
              <div className="font-bold font-mono text-[#1E7B53]">{runB.compliantCount}</div>
              <div className="text-[10px] text-[#1E7B53]">Compliant (+2 Resolved)</div>
            </div>
            <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#D6E0EA]">
              <div className="font-bold font-mono text-[#102A56]">{runB.variant}</div>
              <div className="text-[10px] text-[#5B6B82]">Test Variant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Checkpoint Visual Slider / Comparison */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#102A56] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#2F6FA3]" />
              <span>Interactive Checkpoint Visual Comparison</span>
            </h3>
            <p className="text-xs text-[#5B6B82]">
              Select a checkout step to inspect visual modifications between Run #{runA.runNumber} and Run #{runB.runNumber}.
            </p>
          </div>

          {/* Step Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'cart', label: 'Cart (Drip Pricing)' },
              { id: 'payment', label: 'Payment (Basket Sneaking)' },
              { id: 'urgency_product', label: 'PDP (Scarcity Badge)' },
              { id: 'confirm_shaming', label: 'Plus Popup (Confirm Shaming)' }
            ].map((step) => (
              <button
                key={step.id}
                onClick={() => setSelectedCheckpoint(step.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedCheckpoint === step.id
                    ? 'bg-[#102A56] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#5B6B82] hover:bg-[#E2E8F0]'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-Side Wireframes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-[#5B6B82] mb-1.5 flex items-center justify-between">
              <span>Run #{runA.runNumber} (Before Fix)</span>
              <span className="text-[10px] text-red-700 font-mono">Original Violation</span>
            </div>
            <EvidenceScreenshot
              type={selectedCheckpoint as any}
              variant="before"
              highlightLabel={`Run #${runA.runNumber} Baseline Capture`}
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-[#5B6B82] mb-1.5 flex items-center justify-between">
              <span>Run #{runB.runNumber} (After Fix / Re-test)</span>
              <span className="text-[10px] text-emerald-700 font-mono">Audited State</span>
            </div>
            <EvidenceScreenshot
              type={selectedCheckpoint as any}
              variant="after"
              highlightLabel={`Run #${runB.runNumber} Verified Output`}
            />
          </div>
        </div>
      </div>

      {/* Per-Pattern Diff Table */}
      <div className="bg-white rounded-2xl border border-[#D6E0EA] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D6E0EA] bg-[#F8FAFC]">
          <h3 className="text-sm font-semibold text-[#102A56]">
            Per-Pattern Statutory Diff Matrix (CCPA 13)
          </h3>
          <p className="text-xs text-[#5B6B82]">
            Detailed comparison of determinations per dark pattern between selected runs.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#D6E0EA] text-[#5B6B82] font-semibold">
                <th className="py-2.5 px-3">Pattern</th>
                <th className="py-2.5 px-3">Run #{runA.runNumber} Status</th>
                <th className="py-2.5 px-3"></th>
                <th className="py-2.5 px-3">Run #{runB.runNumber} Status</th>
                <th className="py-2.5 px-3">Delta Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {CCPA_PATTERNS_CATALOG.map((pattern) => {
                const pB = runB.patterns.find(p => p.patternId === pattern.id);
                const statusB = pB?.status || 'Not tested';
                
                // For Run A baseline
                let statusA = 'Not tested';
                if (pattern.id === 'CP-01' || pattern.id === 'CP-02' || pattern.id === 'CP-03' || pattern.id === 'CP-04' || pattern.id === 'CP-05') {
                  statusA = 'Non-compliant';
                }

                const isResolved = statusA === 'Non-compliant' && statusB === 'Compliant';
                const isStillOpen = statusA === 'Non-compliant' && statusB === 'Non-compliant';

                return (
                  <tr key={pattern.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-3 font-medium text-[#1B2B45]">
                      <span className="font-mono text-[#899BB0] mr-1.5">{pattern.id}</span>
                      <span>{pattern.name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        statusA === 'Non-compliant' ? 'bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]' :
                        'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        {statusA}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#899BB0]">
                      <ArrowRight className="w-3.5 h-3.5 inline" />
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        statusB === 'Compliant' ? 'bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]' :
                        statusB === 'Non-compliant' ? 'bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]' :
                        statusB === 'Needs review' ? 'bg-[#FEF7EC] text-[#A8620A] border border-[#F9E2BE]' :
                        'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        {statusB}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {isResolved && (
                        <span className="font-semibold text-[#1E7B53] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resolved (+20 pts recovered)
                        </span>
                      )}
                      {isStillOpen && (
                        <span className="font-medium text-[#B3261E] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Unresolved (Penalty active)
                        </span>
                      )}
                      {!isResolved && !isStillOpen && (
                        <span className="text-[#899BB0]">Unchanged</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
