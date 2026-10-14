import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  FileDown, 
  Eye, 
  EyeOff, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Clock,
  Compass,
  Database
} from 'lucide-react';
import { TestRun } from '../types';

interface HeaderStripProps {
  currentRun: TestRun | null;
  onOpenRunModal?: () => void;
  onStartAnalysis?: () => void;
  onRetest: () => void;
  onResetPipeline?: () => void;
  isAuditorView: boolean;
  onToggleAuditorView: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
  onOpenReportModal?: () => void;
}

export const HeaderStrip: React.FC<HeaderStripProps> = ({
  currentRun,
  onOpenRunModal,
  onStartAnalysis,
  onRetest,
  onResetPipeline,
  isAuditorView,
  onToggleAuditorView,
  speed,
  onSetSpeed,
  onOpenReportModal,
}) => {
  const [exporting, setExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExport = () => {
    if (onOpenReportModal) {
      onOpenReportModal();
    } else {
      window.open(`http://localhost:8000/api/run/${currentRun?.id || 'RUN-012'}/report.html`, '_blank');
    }
  };

  const isRunning = currentRun?.status === 'Running';

  return (
    <div className="bg-white border-b border-[#D6E0EA] px-6 py-3 shrink-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Context Zone */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-[#102A56]">
              {(currentRun?.siteName || 'FreshCart').replace(/\s*\(Indiranagar Store\)/i, '')}
            </span>
            <span className="text-[#899BB0]">/</span>
          </div>


          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono font-medium px-2 py-0.5 rounded bg-[#EAF4F8] text-[#2F6FA3] border border-[#C6DEEE]">
              {currentRun?.status === 'Queued' ? 'Standby' : `Run #${currentRun?.runNumber || 1}`}
            </span>

            {/* Status Pill */}
            {isRunning ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                <span>Running</span>
              </span>
            ) : currentRun?.status === 'Completed' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]">
                <CheckCircle2 className="w-3 h-3 text-[#1E7B53]" />
                <span>Completed</span>
              </span>
            ) : currentRun?.status === 'Queued' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF4F8] text-[#2F6FA3] border border-[#C6DEEE]">
                <Clock className="w-3 h-3 text-[#2F6FA3]" />
                <span>Standby / Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]">
                <AlertCircle className="w-3 h-3 text-[#B3261E]" />
                <span>Failed</span>
              </span>
            )}

            <span className="text-xs text-[#5B6B82] ml-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#899BB0]" />
              <span className="tabular-nums">{currentRun?.runDate} · {currentRun?.formattedTime}</span>
            </span>
          </div>
        </div>

        {/* Right Actions Zone */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* MongoDB Explorer Link */}
          <a
            href="http://localhost:8000/mongo-viewer"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
            title="Inspect all runs and raw screenshots stored in MongoDB at once"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>MongoDB (ss) Explorer</span>
          </a>

          {/* Export Report (Mock) */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#1B2B45] border border-[#D6E0EA] hover:bg-[#F8FAFC] transition-colors"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-[#2F6FA3]" />}
            <span>Export report</span>
          </button>

          {/* Secondary Action: Reset Pipeline (hidden in auditor view) */}
          {!isAuditorView && onResetPipeline && (
            <button
              onClick={onResetPipeline}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#102A56] border border-[#D6E0EA] hover:bg-[#F1F5F9] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              title="Reset pipeline back to fresh standby state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2F6FA3]" />
              <span>Reset Pipeline</span>
            </button>
          )}

          {/* Secondary Action: Re-test (hidden in auditor view) */}
          {!isAuditorView && (
            <button
              onClick={onRetest}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#1B2B45] border border-[#D6E0EA] hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2F6FA3]" />
              <span>Re-test</span>
            </button>
          )}

          {/* Primary Action: Run analysis (directly launches pipeline) */}
          {!isAuditorView && (
            <button
              onClick={onStartAnalysis || onOpenRunModal || onRetest}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#2F6FA3] hover:bg-[#265B86] text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Directly launch autonomous multi-agent compliance pipeline"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Running pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run analysis</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mt-2 py-1.5 px-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
