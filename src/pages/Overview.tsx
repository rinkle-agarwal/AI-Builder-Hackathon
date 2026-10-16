import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ArrowRight,
  Terminal,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  Check,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  Filter,
  Play,
  Camera,
  ShieldAlert,
  Scale,
  FileText,
  RotateCcw
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot
} from 'recharts';
import { TestRun, AgentStage, PatternStatus, PatternComparisonSummary } from '../types';
import { RELEASE_MARKERS, MOCK_HISTORICAL_RUNS_SUMMARY, INITIAL_STANDBY_PATTERNS } from '../data/mock';
import { StageDrawer } from '../components/StageDrawer';
import { EvidenceModal } from '../components/EvidenceModal';
import { EvidenceScreenshot } from '../components/EvidenceScreenshot';

interface OverviewProps {
  currentRun: TestRun;
  onOpenRunModal: () => void;
  onRetryStage: (stageNumber: number) => void;
  onResetPipeline?: () => void;
  isAuditorView: boolean;
  demoHarnessEnabled: boolean;
  onToggleDemoHarness: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  currentRun,
  onOpenRunModal,
  onRetryStage,
  onResetPipeline,
  isAuditorView,
  demoHarnessEnabled,
  onToggleDemoHarness
}) => {
  const navigate = useNavigate();
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);
  const [stageDrawerOpen, setStageDrawerOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [patternFilter, setPatternFilter] = useState<'All' | PatternStatus>('All');
  const [logFilterStage, setLogFilterStage] = useState<number | 'all'>('all');

  const openStageDrawer = (stage: AgentStage) => {
    setSelectedStageNumber(stage.number);
    setStageDrawerOpen(true);
  };

  const activeStage = currentRun.stages.find(s => s.number === selectedStageNumber) || currentRun.stages[0];

  const openEvidenceModal = (index: number) => {
    setSelectedEvidenceIndex(index);
    setEvidenceModalOpen(true);
  };

  // KPI Calculations
  const isQueued = currentRun.status === 'Queued';
  const scoreChange = currentRun.complianceScore - currentRun.previousRunScore;
  const nonCompliantChange = currentRun.nonCompliantCount - currentRun.previousNonCompliantCount;
  const compliantChange = currentRun.compliantCount - currentRun.previousCompliantCount;

  // Filtered patterns table (with resilient fallback to all 13 CCPA statutory patterns)
  const patternsList = (currentRun.patterns && currentRun.patterns.length > 0)
    ? currentRun.patterns
    : INITIAL_STANDBY_PATTERNS;

  const highCount = patternsList.filter(p => p.status === 'Non-compliant' && p.severity === 'High').length;
  const medCount = patternsList.filter(p => p.status === 'Non-compliant' && p.severity === 'Medium').length;
  const lowCount = patternsList.filter(p => p.status === 'Non-compliant' && p.severity === 'Low').length;
  const totalDeduction = (highCount * 20) + (medCount * 12) + (lowCount * 6);
  const calculatedScore = Math.max(0, 100 - totalDeduction);
  const displayScore = currentRun.complianceScore !== undefined
    ? currentRun.complianceScore
    : calculatedScore;

  // Donut Chart Data
  const compliantCount = currentRun.compliantCount !== undefined
    ? currentRun.compliantCount
    : patternsList.filter(p => p.status === 'Compliant').length;
  const nonCompliantCount = currentRun.nonCompliantCount !== undefined
    ? currentRun.nonCompliantCount
    : patternsList.filter(p => p.status === 'Non-compliant').length;
  const needsReviewCount = currentRun.needsReviewCount !== undefined
    ? currentRun.needsReviewCount
    : patternsList.filter(p => p.status === 'Needs review').length;
  const notTestedCount = Math.max(0, 13 - compliantCount - nonCompliantCount - needsReviewCount);

  const donutData = [
    { name: 'Compliant', value: compliantCount, color: '#1E7B53' },
    { name: 'Non-compliant', value: nonCompliantCount, color: '#B3261E' },
    { name: 'Needs review', value: needsReviewCount, color: '#A8620A' },
    { name: 'Not tested', value: notTestedCount, color: '#CBD5E1' },
  ];

  const filteredPatterns = patternsList.filter(p => {
    if (patternFilter === 'All') return true;
    return p.status === patternFilter;
  });

  const effectiveScore = isQueued 
    ? 0 
    : (currentRun.complianceScore !== undefined ? currentRun.complianceScore : displayScore);
  const prevScore = currentRun.previousRunScore || 56;
  const effectiveScoreChange = effectiveScore - prevScore;
  const effectiveNeedsReview = currentRun.needsReviewCount ?? 0;

  // Score trend chart data
  const trendData = MOCK_HISTORICAL_RUNS_SUMMARY.map(r => ({
    name: `Run #${r.runNumber}`,
    runNumber: r.runNumber,
    date: r.date,
    score: r.score,
    release: RELEASE_MARKERS.find(m => m.date === r.fullDate)?.title || null,
    releaseNote: RELEASE_MARKERS.find(m => m.date === r.fullDate)?.description || null,
  }));

  // Filtered live feed logs
  const displayLogs = currentRun.logs.filter(l => {
    if (logFilterStage === 'all') return true;
    return l.stageNumber === logFilterStage;
  });

  return (
    <div className="space-y-6">
      {/* Aria Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentRun.status === 'Running'
          ? `Compliance test is currently running. Current score is ${effectiveScore}.`
          : `Run ${currentRun.id} completed with compliance score ${effectiveScore}.`}
      </div>

      {/* b) KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Compliance Score Card */}
        <div className="bg-white p-4 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#5B6B82]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Compliance Score</span>
            <span className="text-[11px] font-mono text-[#899BB0]">CCPA 2023</span>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#E2E8F0]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${isQueued ? 'text-[#C6DEEE]' :
                      effectiveScore >= 80 ? 'text-[#1E7B53]' :
                      effectiveScore >= 50 ? 'text-[#2F6FA3]' : 'text-[#B3261E]'
                    } transition-all duration-1000 ease-out`}
                  strokeDasharray={`${isQueued ? 0 : effectiveScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-bold tabular-nums text-[#102A56] leading-none">
                  {isQueued ? '--' : effectiveScore}
                </span>
                <span className="text-[9px] text-[#5B6B82] block leading-none">/100</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-medium text-[#102A56]">
                {isQueued ? 'Standby / Ready' : effectiveScore >= 80 ? 'Good Standing' : effectiveScore >= 50 ? 'Moderate Risk' : 'Severe Violations'}
              </div>
              <div className="text-[11px] mt-1 flex items-center justify-end gap-1 font-medium">
                {isQueued ? (
                  <span className="text-[#899BB0]">Ready to run pipeline</span>
                ) : effectiveScoreChange >= 0 ? (
                  <span className="text-[#1E7B53] flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{effectiveScoreChange} pts
                  </span>
                ) : (
                  <span className="text-[#B3261E] flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" /> {effectiveScoreChange} pts
                  </span>
                )}
                {!isQueued && (
                  <span className="text-[#899BB0]">vs Run #{currentRun.runNumber > 1 ? currentRun.runNumber - 1 : 12}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#5B6B82] pt-1 border-t border-[#F1F5F9]">
            {isQueued ? 'Penalties evaluated on completion' : (nonCompliantCount === 0 ? 'Zero deductions — 100% compliant' : `Penalties: High -20, Med -12 (${totalDeduction} pts total)`)}
          </div>
        </div>

        {/* Non-compliant patterns */}
        <div className="bg-white p-4 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#5B6B82]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Non-Compliant</span>
            <AlertCircle className="w-4 h-4 text-[#B3261E]" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tabular-nums text-[#B3261E]">
              {nonCompliantCount}
            </div>
            <div className="text-[11px] text-[#5B6B82] mt-0.5">
              Identified violations of CCPA clauses
            </div>
          </div>

          <div className="text-[11px] pt-1 border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-[#5B6B82]">Catalogue scope:</span>
            {isQueued ? (
              <span className="text-[#899BB0] font-medium">Standby</span>
            ) : (
              <span className={`font-medium ${nonCompliantCount > 0 ? 'text-[#B3261E]' : 'text-[#1E7B53]'}`}>
                {nonCompliantCount > 0 ? `${nonCompliantCount} infractions found` : '0 infractions detected'}
              </span>
            )}
          </div>
        </div>

        {/* Compliant patterns */}
        <div className="bg-white p-4 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#5B6B82]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Compliant</span>
            <CheckCircle2 className="w-4 h-4 text-[#1E7B53]" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tabular-nums text-[#1E7B53]">
              {compliantCount}
            </div>
            <div className="text-[11px] text-[#5B6B82] mt-0.5">
              {compliantCount > 0 
                ? `${compliantCount} verified compliant interaction steps` 
                : 'All evaluated steps had dark patterns'}
            </div>
          </div>

          <div className="text-[11px] pt-1 border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-[#5B6B82]">Statutory status:</span>
            {isQueued ? (
              <span className="text-[#899BB0] font-medium">Standby</span>
            ) : (
              <span className="font-medium text-[#1E7B53]">
                {8 + compliantCount} of 13 CCPA clauses clear
              </span>
            )}
          </div>
        </div>

        {/* Needs human review */}
        <div className="bg-white p-4 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#5B6B82]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Needs Review</span>
            <HelpCircle className="w-4 h-4 text-[#A8620A]" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tabular-nums text-[#A8620A]">
              {effectiveNeedsReview}
            </div>
            <div className="text-[11px] text-[#5B6B82] mt-0.5">
              {effectiveNeedsReview > 0 
                ? 'Countdown timer zero-point unconfirmed' 
                : 'All 5 infractions confirmed & isolated'}
            </div>
          </div>

          <div className="text-[11px] pt-1 border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-[#5B6B82]">Triage Queue:</span>
            <span className="font-medium text-[#102A56]">
              {effectiveNeedsReview > 0 ? `${effectiveNeedsReview} Pending Analyst` : '0 Pending (All Grounded)'}
            </span>
          </div>
        </div>

        {/* Pattern Coverage */}
        <div className="bg-white p-4 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#5B6B82]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Pattern Coverage</span>
            <Layers className="w-4 h-4 text-[#2F6FA3]" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tabular-nums text-[#102A56]">
              {currentRun.patternCoverage}
            </div>
            <div className="text-[11px] text-[#5B6B82] mt-0.5">
              Checkout &amp; membership journey scope
            </div>
          </div>

          <div className="text-[11px] pt-1 border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-[#5B6B82]">Untested Patterns:</span>
            <span className="font-medium text-[#899BB0]">8 Out of Journey Scope</span>
          </div>
        </div>
      </div>

      {/* c) Agent Pipeline Row */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F1F5F9] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#102A56] flex items-center gap-2">
              <span>Autonomous Multi-Agent Pipeline</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAF4F8] text-[#2F6FA3] border border-[#C6DEEE] font-normal">
                5 Stages Sequenced
              </span>
            </h2>
            <p className="text-xs text-[#5B6B82] mt-0.5">
              Click any agent card to inspect real-time execution logs, Playwright captures, and Vertex AI reasoning.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#5B6B82] font-mono">
              Total Elapsed: <span className="text-[#102A56] font-semibold tabular-nums">{currentRun.durationSeconds}s</span>
            </div>
            {onResetPipeline && (currentRun.status === 'Completed' || currentRun.status === 'Failed') && (
              <button
                onClick={onResetPipeline}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#F1F5F9] text-[#102A56] text-xs font-semibold rounded-lg border border-[#D6E0EA] transition-colors shadow-xs cursor-pointer"
                title="Reset pipeline back to standby state"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#2F6FA3]" />
                <span>Reset Pipeline</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Callout Banner */}
        {currentRun.status === 'Completed' && (
          <div className="mt-4 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#166534]">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
              <div>
                <span className="font-semibold block text-[13px]">
                  Autonomous Compliance Pipeline Completed
                </span>
                <span className="text-[#15803D] text-[11px]">
                  All 5 stages evaluated. CCPA violations classified, legal rulings grounded, and tamper-proof SHA-256 ledger sealed.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onResetPipeline && (
                <button
                  onClick={onResetPipeline}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#DCFCE7] text-[#166534] font-semibold rounded-lg border border-[#86EFAC] transition-colors shadow-xs cursor-pointer"
                  title="Reset pipeline back to fresh standby mode"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Reset Pipeline</span>
                </button>
              )}
            </div>
          </div>
        )}

        {currentRun.status === 'Queued' && (
          <div className="mt-4 p-3.5 bg-[#F0F7FB] border border-[#C6DEEE] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#102A56]">
              <Clock className="w-5 h-5 text-[#2F6FA3] shrink-0" />
              <div>
                <span className="font-semibold block text-[13px]">
                  Pipeline in Standby Mode
                </span>
                <span className="text-[#5B6B82] text-[11px]">
                  Chromium headless navigator and multi-agent compliance pipeline ready. Click &quot;Run analysis&quot; to begin.
                </span>
              </div>
            </div>
            <button
              onClick={onOpenRunModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2F6FA3] hover:bg-[#265B86] text-white font-semibold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run analysis</span>
            </button>
          </div>
        )}

        {/* Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-4">
          {currentRun.stages.map((stage, idx) => {
            const isStageRunning = stage.status === 'Running';
            return (
              <div
                key={stage.number}
                onClick={() => openStageDrawer(stage)}
                className={`relative rounded-xl border p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:border-[#2F6FA3] hover:shadow-sm ${isStageRunning
                    ? 'border-[#2F6FA3] bg-[#F8FBFE] ring-1 ring-[#2F6FA3]'
                    : stage.status === 'Completed'
                      ? 'border-[#D6E0EA] bg-white'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
              >
                {/* Stage Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#102A56] text-white text-[11px] font-bold flex items-center justify-center">
                        {stage.number}
                      </span>
                      <span className="font-semibold text-xs text-[#102A56] truncate">
                        {stage.name}
                      </span>
                    </div>

                    {/* Status Pill */}
                    {stage.status === 'Completed' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3] flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Done
                      </span>
                    )}
                    {stage.status === 'Running' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Running
                      </span>
                    )}
                    {stage.status === 'Queued' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#64748B]">
                        Queued
                      </span>
                    )}
                    {stage.status === 'Failed' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]">
                        Failed
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#5B6B82] line-clamp-1 mb-2">
                    {stage.role}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full transition-all duration-300 ${stage.status === 'Completed' ? 'bg-[#1E7B53]' : 'bg-[#2F6FA3]'
                        }`}
                      style={{ width: `${stage.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#899BB0] mb-2 font-mono">
                    <span className="truncate">{stage.progressCount}</span>
                    <span className="tabular-nums">{stage.elapsedTime}</span>
                  </div>

                  {/* Key Output Sentence */}
                  <div className="text-[11px] text-[#1B2B45] font-medium line-clamp-2 bg-[#F8FAFC] p-2 rounded border border-[#EDF2F7]">
                    {stage.keyOutput}
                  </div>
                </div>

                {/* Stage 1 Screenshots Counter */}
                {/* Stage 1 Shopping Journey Viewports Button */}
                {stage.number === 1 && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      openStageDrawer(stage);
                    }}
                    className="mt-2 text-[10px] flex items-center justify-between font-mono bg-[#EAF4F8] hover:bg-[#D9EAF5] text-[#2F6FA3] px-2 py-1 rounded border border-[#C6DEEE] cursor-pointer transition-colors"
                    title="Click to inspect Playwright customer shopping journey viewports"
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      <Camera className="w-3 h-3 text-[#2F6FA3]" />
                      {stage.status === 'Running'
                        ? `${stage.screenshots?.length || 0} / 10 Capturing...`
                        : stage.status === 'Queued'
                        ? '0 / 10 Ready to Capture'
                        : `${stage.screenshots ? stage.screenshots.length : (currentRun.screenshots?.length || 10)} Journey Viewports`}
                    </span>
                    <span className="text-[#102A56] font-bold group-hover:underline">
                      {stage.status === 'Queued' ? 'Inspect Agent →' : 'View Steps →'}
                    </span>
                  </div>
                )}

                {/* Stage 2 Candidate Anomalies Badge */}
                {stage.number === 2 && stage.status !== 'Locked' && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      openStageDrawer(stage);
                    }}
                    className={`mt-2 text-[10px] flex items-center justify-between font-mono ${
                      (nonCompliantCount === 0 || stage.anomalies?.length === 0)
                        ? 'bg-[#E8F5EE] hover:bg-[#D5EFE1] text-[#1E7B53] border border-[#C2E7D3]'
                        : 'bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#B42318] border border-[#FECDCA]'
                    } px-2 py-1 rounded cursor-pointer transition-colors`}
                    title="Click to view candidate dark pattern anomalies detected by Vision AI"
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      {(nonCompliantCount === 0 || stage.anomalies?.length === 0) ? (
                        <ShieldCheck className="w-3 h-3 text-[#1E7B53]" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-[#D92D20]" />
                      )}
                      {stage.status === 'Running'
                        ? 'Analyzing with Vision AI...'
                        : (nonCompliantCount === 0 || stage.anomalies?.length === 0)
                        ? '0 Anomalies Isolated'
                        : `${stage.anomalies?.length || nonCompliantCount || 5} Anomalies Detected`}
                    </span>
                    <span className="font-bold group-hover:underline">
                      {(nonCompliantCount === 0 || stage.anomalies?.length === 0) ? 'View Inspection →' : 'View Anomalies →'}
                    </span>
                  </div>
                )}

                {/* Stage 3 Legal Rulings Badge */}
                {stage.number === 3 && stage.status !== 'Locked' && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      openStageDrawer(stage);
                    }}
                    className={`mt-2 text-[10px] flex items-center justify-between font-mono ${
                      (nonCompliantCount === 0 || stage.rulings?.length === 0)
                        ? 'bg-[#E8F5EE] hover:bg-[#D5EFE1] text-[#1E7B53] border border-[#C2E7D3]'
                        : 'bg-[#FAF5F5] hover:bg-[#F5EAEA] text-[#7A271A] border border-[#F0D5D5]'
                    } px-2 py-1 rounded cursor-pointer transition-colors`}
                    title="Click to view statutory legal compliance rulings grounded against CCPA 2023"
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      <Scale className={`w-3 h-3 ${(nonCompliantCount === 0 || stage.rulings?.length === 0) ? 'text-[#1E7B53]' : 'text-[#7A271A]'}`} />
                      {stage.status === 'Running'
                        ? 'Grounding against CCPA...'
                        : (nonCompliantCount === 0 || stage.rulings?.length === 0)
                        ? '0 Legal Infractions Grounded'
                        : `${stage.rulings?.length || nonCompliantCount || 5} Legal Rulings Grounded`}
                    </span>
                    <span className="font-bold group-hover:underline">
                      {(nonCompliantCount === 0 || stage.rulings?.length === 0) ? 'View Legal Matrix →' : 'View Rulings →'}
                    </span>
                  </div>
                )}

                {/* Stage 4 Fix Suggestions Badge */}
                {stage.number === 4 && stage.status !== 'Locked' && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      openStageDrawer(stage);
                    }}
                    className={`mt-2 text-[10px] flex items-center justify-between font-mono ${
                      (nonCompliantCount === 0 || stage.fixes?.length === 0)
                        ? 'bg-[#E8F5EE] hover:bg-[#D5EFE1] text-[#1E7B53] border border-[#C2E7D3]'
                        : 'bg-[#F4FBF7] hover:bg-[#E8F8EF] text-[#0E6238] border border-[#BDE8D0]'
                    } px-2 py-1 rounded cursor-pointer transition-colors`}
                    title="Click to view dual remediation specs (Compliance Fix + Ethical Business Alternatives)"
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3 text-[#1E7B53]" />
                      {stage.status === 'Running'
                        ? 'Synthesizing fixes...'
                        : (nonCompliantCount === 0 || stage.fixes?.length === 0)
                        ? '0 Fixes Required (Clean Store)'
                        : `${stage.fixes?.length || nonCompliantCount || 5} Dual Fixes Ready`}
                    </span>
                    <span className="font-bold group-hover:underline">
                      {(nonCompliantCount === 0 || stage.fixes?.length === 0) ? 'View Status →' : 'View Fixes →'}
                    </span>
                  </div>
                )}

                {/* Stage 5 Compliance Trail Badge */}
                {stage.number === 5 && stage.status !== 'Locked' && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      openStageDrawer(stage);
                    }}
                    className="mt-2 text-[10px] flex items-center justify-between font-mono bg-[#F0F7FB] hover:bg-[#E2F0F9] text-[#102A56] px-2 py-1 rounded border border-[#C6DEEE] cursor-pointer transition-colors"
                    title="Click to view regulatory audit ledger, tamper-proof SHA-256 seal, and chain-of-custody"
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3 h-3 text-[#2F6FA3]" />
                      {stage.status === 'Running'
                        ? 'Sealing audit ledger...'
                        : 'Audit Ledger Sealed'}
                    </span>
                    <span className="text-[#2F6FA3] font-bold group-hover:underline">
                      View Ledger &rarr;
                    </span>
                  </div>
                )}

                {/* Stage 5 Quick PDF Download Link */}
                {stage.number === 5 && stage.status !== 'Locked' && (
                  <a
                    href={`/api/run/${currentRun.id || 'RUN-012'}/report.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 text-[10px] flex items-center justify-between font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded border border-emerald-200 cursor-pointer transition-colors"
                    title="Download certified executive PDF audit report"
                  >
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-600" />
                      <span>Download PDF Report</span>
                    </span>
                    <span className="text-emerald-700 font-bold">&darr;</span>
                  </a>
                )}

                {/* Quick Action for Stage 1 (Navigator Agent) */}
                {stage.number === 1 && !isAuditorView && (
                  <div className="mt-2 pt-2 border-t border-[#F1F5F9]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRunModal();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#2F6FA3] hover:bg-[#265B86] text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                      title="Select store fixture and run Playwright analysis"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run analysis</span>
                    </button>
                  </div>
                )}

                {/* Footer Chip: Google Cloud Service */}
                <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#2F6FA3] font-mono border border-[#E2E8F0] truncate max-w-[150px]">
                    {stage.googleCloudService}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#899BB0]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* d) Compliance Summary Table & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Table (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-semibold text-[#102A56]">
                  CCPA 13 Dark Patterns Matrix
                </h3>
                <p className="text-xs text-[#5B6B82]">
                  India CCPA (Nov 2023 Guidelines) compliance status across evaluated journey checkpoints.
                </p>
              </div>

              {/* Pill Filters */}
              <div className="flex flex-wrap items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#D6E0EA] text-xs">
                {(['All', 'Non-compliant', 'Compliant', 'Needs review', 'Not tested'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setPatternFilter(filter)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${patternFilter === filter
                        ? 'bg-white text-[#102A56] shadow-xs'
                        : 'text-[#5B6B82] hover:text-[#102A56]'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D6E0EA] text-[#5B6B82] font-semibold">
                    <th className="py-2.5 px-3">Pattern</th>
                    <th className="py-2.5 px-2">Where Found</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Severity</th>
                    <th className="py-2.5 px-2">Confidence</th>
                    <th className="py-2.5 px-2 text-right">vs Last Run</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredPatterns.map(p => {
                    const isMuted = p.status === 'Not tested';
                    return (
                      <tr
                        key={p.patternId}
                        className={`hover:bg-[#F8FAFC] transition-colors ${isMuted ? 'opacity-50 bg-[#FAFAFA]' : ''}`}
                      >
                        <td className="py-2.5 px-3 font-medium text-[#1B2B45]">
                          <span className="font-mono text-[#899BB0] mr-1.5">{p.patternId}</span>
                          <span>{p.patternName}</span>
                        </td>
                        <td className="py-2.5 px-2 text-[#5B6B82]">
                          {p.whereFound}
                        </td>
                        <td className="py-2.5 px-2">
                          {p.status === 'Compliant' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]">
                              <CheckCircle2 className="w-3 h-3 text-[#1E7B53]" /> Compliant
                            </span>
                          )}
                          {p.status === 'Non-compliant' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]">
                              <AlertCircle className="w-3 h-3 text-[#B3261E]" /> Non-compliant
                            </span>
                          )}
                          {p.status === 'Needs review' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF7EC] text-[#A8620A] border border-[#F9E2BE]">
                              <HelpCircle className="w-3 h-3 text-[#A8620A]" /> Needs review
                            </span>
                          )}
                          {p.status === 'Not tested' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F5F9] text-[#64748B]">
                              Not tested
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`font-medium ${p.severity === 'High' ? 'text-[#B3261E]' :
                              p.severity === 'Medium' ? 'text-[#A8620A]' : 'text-[#5B6B82]'
                            }`}>
                            {p.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono tabular-nums text-[#334155]">
                          {p.confidence > 0 ? `${p.confidence}%` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`text-[11px] font-medium ${p.changeVsLastRun === 'Resolved' ? 'text-[#1E7B53]' :
                              p.changeVsLastRun === 'Still open' ? 'text-[#B3261E]' : 'text-[#899BB0]'
                            }`}>
                            {p.changeVsLastRun}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F5F9] text-xs text-[#5B6B82] flex justify-between items-center">
            <span>Showing {filteredPatterns.length} of 13 statutory patterns</span>
            <button
              onClick={() => navigate('/knowledge-base')}
              className="text-[#2F6FA3] hover:underline font-medium flex items-center gap-1"
            >
              <span>Explore full CCPA statutory definitions</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Donut Chart (1 col) - Grounded Audit Breakdown & Scoring Model */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-semibold text-[#102A56] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2F6FA3]" />
                  <span>Audit Breakdown</span>
                </h3>
                <p className="text-xs text-[#5B6B82]">
                  India CCPA 2023 Statutory Compliance Assessment
                </p>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                displayScore >= 80 ? 'bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]' :
                displayScore >= 50 ? 'bg-[#FEF7EC] text-[#A8620A] border border-[#F9E2BE]' :
                'bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]'
              }`}>
                {displayScore >= 80 ? 'Good Standing' : displayScore >= 50 ? 'Moderate Risk' : 'Severe Regulatory Risk'}
              </span>
            </div>

            {/* Circle Container with Centered Score & Dynamic Label */}
            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #D6E0EA' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Inside the Circle: Centered Score & Evaluation */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black font-mono text-[#102A56] leading-none">
                  {displayScore}
                </span>
                <span className="text-[10px] font-semibold text-[#5B6B82] leading-none mt-1">
                  / 100 Score
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1.5 ${
                  displayScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                  displayScore >= 50 ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {compliantCount} Pass • {nonCompliantCount} Violations
                </span>
              </div>
            </div>

            {/* Legend with Counts and Percentages */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[#334155] px-1.5 py-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                    <span className="text-[11px] truncate">{d.name}</span>
                  </div>
                  <div className="font-mono font-semibold tabular-nums text-[#102A56] text-[11px] shrink-0 ml-1">
                    {d.value} <span className="text-[#899BB0] font-normal text-[10px]">({Math.round((d.value / 13) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* How It Was Measured (Exact Deduction Formula) */}
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#102A56] text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-[#2F6FA3]" />
                  <span>How Score Was Measured</span>
                </span>
                <span className="font-mono text-[10px] text-[#5B6B82]">Base: 100 pts</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {highCount > 0 && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-50/70 border border-red-200/60 text-red-900">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      <span>High Infractions (-20 pts):</span>
                    </span>
                    <span className="font-mono font-bold">{highCount} &times; (-20) = -{highCount * 20} pts</span>
                  </div>
                )}

                {medCount > 0 && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      <span>Medium Infractions (-12 pts):</span>
                    </span>
                    <span className="font-mono font-bold">{medCount} &times; (-12) = -{medCount * 12} pts</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span>Compliant / Safe Checkpoints:</span>
                  </span>
                  <span className="font-mono font-bold">{13 - highCount - medCount} of 13</span>
                </div>
              </div>
            </div>

            {/* Statutory Exposure & Continuous Audit Seal */}
            <div className="p-3 bg-[#F0F7FB] rounded-xl border border-[#C6DEEE] text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-[#102A56] text-[11px]">
                <span>Statutory Penalty Exposure:</span>
                <span className="font-mono text-[#B3261E] font-bold">
                  {nonCompliantCount > 0 ? 'Up to ₹50 Lakhs' : '₹0 (Safe)'}
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B82] leading-relaxed">
                {nonCompliantCount > 0
                  ? `${nonCompliantCount} active dark pattern violations detected under CPA 2019 Section 89. Dual UX remediations formulated to mitigate exposure.`
                  : 'Zero CCPA violations detected. All evaluated customer journey checkpoints cleared.'}
              </p>
              <div className="pt-1.5 border-t border-[#C6DEEE]/60 flex items-center justify-between text-[10px] font-mono text-[#2F6FA3]">
                <span>SHA-256 Ledger: Certified</span>
                <button
                  onClick={() => openStageDrawer(currentRun.stages[4] || currentRun.stages[0])}
                  className="font-bold underline hover:text-[#102A56] cursor-pointer"
                >
                  View Audit Ledger &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* e) "What Changed Since Last Test" & Score Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Changed Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-semibold text-[#102A56]">
                  What Changed Since Last Test
                </h3>
                <p className="text-xs text-[#5B6B82]">
                  Differential comparison: Run #11 (6 Oct 2026) vs Run #12 (13 Oct 2026)
                </p>
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-4 gap-2 my-4">
              <div className="p-2.5 bg-[#E8F5EE] border border-[#C2E7D3] rounded-xl text-center">
                <div className="text-lg font-bold text-[#1E7B53] tabular-nums font-mono">2</div>
                <div className="text-[11px] font-medium text-[#1E7B53]">Resolved</div>
              </div>
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F8D0CD] rounded-xl text-center">
                <div className="text-lg font-bold text-[#B3261E] tabular-nums font-mono">3</div>
                <div className="text-[11px] font-medium text-[#B3261E]">Still Open</div>
              </div>
              <div className="p-2.5 bg-[#F1F5F9] border border-[#D6E0EA] rounded-xl text-center">
                <div className="text-lg font-bold text-[#5B6B82] tabular-nums font-mono">0</div>
                <div className="text-[11px] font-medium text-[#5B6B82]">New</div>
              </div>
              <div className="p-2.5 bg-[#F1F5F9] border border-[#D6E0EA] rounded-xl text-center">
                <div className="text-lg font-bold text-[#5B6B82] tabular-nums font-mono">0</div>
                <div className="text-[11px] font-medium text-[#5B6B82]">Regressed</div>
              </div>
            </div>

            {/* Change list */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#102A56] flex items-center gap-1.5">
                    <span>Drip Pricing (CP-01)</span>
                    <span className="text-[#899BB0]">·</span>
                    <span className="text-[10px] text-red-600 line-through">Non-compliant</span>
                    <ArrowRight className="w-3 h-3 text-[#1E7B53]" />
                    <span className="text-[10px] text-[#1E7B53] font-bold">Compliant</span>
                  </div>
                  <p className="text-[11px] text-[#5B6B82] mt-0.5">
                    ₹49 standard delivery fee now displayed upfront on cart page. Total matched with payment step.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#102A56] flex items-center gap-1.5">
                    <span>Basket Sneaking (CP-02)</span>
                    <span className="text-[#899BB0]">·</span>
                    <span className="text-[10px] text-red-600 line-through">Non-compliant</span>
                    <ArrowRight className="w-3 h-3 text-[#1E7B53]" />
                    <span className="text-[10px] text-[#1E7B53] font-bold">Compliant</span>
                  </div>
                  <p className="text-[11px] text-[#5B6B82] mt-0.5">
                    "Donate ₹10" charity add-on changed from pre-checked to opt-in unselected by default.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#102A56] flex items-center gap-1.5">
                    <span>False Urgency (CP-03)</span>
                    <span className="text-[#899BB0]">·</span>
                    <span className="text-[10px] text-[#B3261E] font-bold">Still Open</span>
                  </div>
                  <p className="text-[11px] text-[#5B6B82] mt-0.5">
                    "Only 2 left!" badges remain hardcoded on Atta and Dal while warehouse inventory contains 178+ units.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#102A56] flex items-center gap-1.5">
                    <span>Subscription Trap (CP-04)</span>
                    <span className="text-[#899BB0]">·</span>
                    <span className="text-[10px] text-[#B3261E] font-bold">Still Open</span>
                  </div>
                  <p className="text-[11px] text-[#5B6B82] mt-0.5">
                    Cancellation journey still requires 6 clicks across 4 screens with mandatory survey vs 1-click enroll.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex justify-between items-center text-xs">
            <span className="text-[#5B6B82]">Predecessor: Run #11 (Score: 16)</span>
            <button
              onClick={() => navigate('/compare')}
              className="text-[#2F6FA3] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Open Side-by-Side Run Comparison</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Score Trend Line Chart with Release Markers */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-semibold text-[#102A56]">
                  Compliance Score Trend (Last 6 Runs)
                </h3>
                <p className="text-xs text-[#5B6B82]">
                  Correlated with product release tags &amp; checkout hotfixes on timeline.
                </p>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#EAF4F8] text-[#2F6FA3] border border-[#C6DEEE]">
                Weekly Scans
              </span>
            </div>

            <div className="h-64 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 15, right: 20, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#5B6B82' }}
                    stroke="#D6E0EA"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#5B6B82' }}
                    stroke="#D6E0EA"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg border border-[#D6E0EA] shadow-md text-xs space-y-1">
                            <div className="font-semibold text-[#102A56]">{data.name} · {data.date}</div>
                            <div className="text-sm font-bold text-[#2F6FA3]">Score: {data.score}/100</div>
                            {data.release && (
                              <div className="pt-1 mt-1 border-t border-[#F1F5F9] text-[#B3261E] font-medium">
                                🚀 {data.release}
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
                  {/* Mark Release Points */}
                  <ReferenceDot x="Run #9" y={60} r={5} fill="#B3261E" stroke="#FFFFFF" />
                  <ReferenceDot x="Run #10" y={48} r={5} fill="#B3261E" stroke="#FFFFFF" />
                  <ReferenceDot x="Run #11" y={16} r={6} fill="#B3261E" stroke="#FFFFFF" />
                  <ReferenceDot x="Run #12" y={56} r={5} fill="#1E7B53" stroke="#FFFFFF" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-[#5B6B82] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
            <span className="font-semibold text-[#102A56]">Release Impact: </span>
            <span>Hotfix on 13 Oct recovered score from 16 to 56 by addressing drip pricing and pre-ticked donations.</span>
          </div>
        </div>
      </div>

      {/* g) Live Activity Feed */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#2F6FA3]" />
              <h3 className="text-base font-semibold text-[#102A56]">
                Live Activity Feed
              </h3>
            </div>

            {/* Filter by agent */}
            <select
              value={logFilterStage}
              onChange={(e) => setLogFilterStage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D6E0EA] bg-[#F8FAFC] text-[#102A56] font-medium"
            >
              <option value="all">All Agent Streams</option>
              <option value="1">1. Navigator Agent</option>
              <option value="2">2. Pattern Detector Agent</option>
              <option value="3">3. Reasoning Agent</option>
              <option value="4">4. Fix Suggestion Agent</option>
              <option value="5">5. Compliance Trail Agent</option>
            </select>
          </div>

          {/* Log list */}
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
            {displayLogs.map(log => (
              <div key={log.id} className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-[#102A56]">{log.stageName}</span>
                  <span className="font-mono text-[#899BB0] text-[10px] tabular-nums">{log.timestamp}</span>
                </div>
                <p className="text-[#334155] leading-relaxed">
                  {log.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#F1F5F9] text-xs text-[#5B6B82] flex justify-between items-center">
          <span>Streaming {displayLogs.length} continuous audit entries</span>
          <span className="font-mono text-[10px]">Cloud Run + Vertex AI</span>
        </div>
      </div>

      {/* i) Collapsible Demo Test Harness Card */}
      <div className="bg-white rounded-2xl border border-[#D6E0EA] shadow-xs overflow-hidden">
        <button
          onClick={onToggleDemoHarness}
          className="w-full p-4 flex items-center justify-between bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-4 h-4 text-[#2F6FA3]" />
            <div>
              <span className="font-semibold text-sm text-[#102A56]">
                Demo Test Harness Verification
              </span>
              <span className="text-xs text-[#5B6B82] ml-2">
                Ground truth benchmarking for simulated evaluations
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#1E7B53] font-medium bg-[#E8F5EE] px-2 py-0.5 rounded border border-[#C2E7D3]">
              5/5 Seeded Faults Verified
            </span>
            {demoHarnessEnabled ? <ChevronDown className="w-4 h-4 text-[#5B6B82]" /> : <ChevronRight className="w-4 h-4 text-[#5B6B82]" />}
          </div>
        </button>

        {demoHarnessEnabled && (
          <div className="p-5 border-t border-[#D6E0EA] bg-white text-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#E8F5EE] border border-[#C2E7D3]">
                <div className="font-semibold text-[#1E7B53] text-sm">Seeded Faults Found</div>
                <div className="text-xl font-bold font-mono text-[#1E7B53] mt-1">5 of 5 (100%)</div>
                <div className="text-[11px] text-[#1E7B53] mt-0.5">All synthetic violations isolated</div>
              </div>

              <div className="p-3 rounded-xl bg-[#E8F5EE] border border-[#C2E7D3]">
                <div className="font-semibold text-[#1E7B53] text-sm">False Alarms</div>
                <div className="text-xl font-bold font-mono text-[#1E7B53] mt-1">0</div>
                <div className="text-[11px] text-[#1E7B53] mt-0.5">Zero false positives emitted</div>
              </div>

              <div className="p-3 rounded-xl bg-[#EAF4F8] border border-[#C6DEEE]">
                <div className="font-semibold text-[#2F6FA3] text-sm">Genuine Stock Label</div>
                <div className="text-xl font-bold font-mono text-[#2F6FA3] mt-1">Cleared</div>
                <div className="text-[11px] text-[#2F6FA3] mt-0.5">Paneer 2-unit claim authenticated</div>
              </div>

              <div className="p-3 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1]">
                <div className="font-semibold text-[#475569] text-sm">Decoy UI Glitch</div>
                <div className="text-xl font-bold font-mono text-[#475569] mt-1">Classified Bug</div>
                <div className="text-[11px] text-[#475569] mt-0.5">Cart badge routed to Jira bug tracker</div>
              </div>
            </div>

            <p className="text-[#5B6B82] leading-relaxed pt-2 border-t border-[#F1F5F9]">
              The demo harness validates that TrustLens AI does not mindlessly penalize honest scarcity claims or superficial UI bugs. When warehouse inventory verifies that a product legitimately has low stock, the scarcity badge is cleared. When an un-synchronized cart count is detected, it is categorized as a likely bug rather than an illicit CCPA dark pattern.
            </p>
          </div>
        )}
      </div>

      {/* Stage Drawer Modal */}
      <StageDrawer
        stage={activeStage}
        isOpen={stageDrawerOpen}
        onClose={() => setStageDrawerOpen(false)}
        onRetry={onRetryStage}
        isAuditorView={isAuditorView}
        screenshots={currentRun.screenshots || []}
        evidenceCheckpoints={currentRun.evidenceCheckpoints || []}
        anomalies={currentRun.anomalies || activeStage?.anomalies || []}
        rulings={currentRun.rulings || activeStage?.rulings || []}
        fixes={currentRun.fixes || activeStage?.fixes || []}
        auditRecord={currentRun.auditRecord || activeStage?.auditRecord}
        complianceScore={currentRun.complianceScore}
        nonCompliantCount={currentRun.nonCompliantCount}
        runId={currentRun.id}
      />

      {/* Evidence Viewer Modal */}
      <EvidenceModal
        checkpoints={currentRun.evidenceCheckpoints}
        initialIndex={selectedEvidenceIndex}
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
      />
    </div>
  );
};
