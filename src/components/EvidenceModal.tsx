import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { EvidenceWireframe } from '../types';
import { EvidenceScreenshot } from './EvidenceScreenshot';

interface EvidenceModalProps {
  checkpoints: EvidenceWireframe[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  checkpoints,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || checkpoints.length === 0) return null;

  const current = checkpoints[currentIndex] || checkpoints[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : checkpoints.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < checkpoints.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full border border-[#D6E0EA] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-labelledby="evidence-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-[#102A56] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#183A73] text-[#A5C4DC] border border-[#2F6FA3]">
              Checkpoint {currentIndex + 1} of {checkpoints.length}
            </span>
            <h2 id="evidence-modal-title" className="text-base font-semibold text-white truncate">
              {current.step}: {current.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded text-[#A5C4DC] hover:text-white hover:bg-[#183A73] transition-colors"
              aria-label="Previous checkpoint"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded text-[#A5C4DC] hover:text-white hover:bg-[#183A73] transition-colors"
              aria-label="Next checkpoint"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="ml-2 text-[#A5C4DC] hover:text-white p-1.5 rounded hover:bg-[#183A73] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#D6E0EA] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#5B6B82]">Timestamp:</span>
              <span className="font-mono font-medium text-[#1B2B45]">{current.timestamp} IST</span>
              <span className="text-[#D6E0EA]">|</span>
              <span className="text-[#5B6B82]">Capture Trigger:</span>
              <span className="text-[#102A56] font-medium">Playwright / Cloud Run Synthetic Session</span>
            </div>

            <div>
              {current.isFlagged ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD] font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Flagged Violation Area
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Compliant Interaction Checkpoint
                </span>
              )}
            </div>
          </div>

          {/* Screenshot Display */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <EvidenceScreenshot
              type={current.screenshotType}
              variant={current.isFlagged ? 'before' : 'after'}
              highlightLabel={current.highlightBox?.label}
              className="w-full"
            />
          </div>

          {/* Highlight & Anomaly details */}
          {current.highlightBox && (
            <div className={`p-4 rounded-xl border ${
              current.isFlagged ? 'bg-[#FDF2F2]/60 border-[#F8D0CD]' : 'bg-[#E8F5EE]/60 border-[#C2E7D3]'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {current.isFlagged ? (
                  <ShieldAlert className="w-4 h-4 text-[#B3261E]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#1E7B53]" />
                )}
                <h3 className={`text-sm font-semibold ${
                  current.isFlagged ? 'text-[#B3261E]' : 'text-[#1E7B53]'
                }`}>
                  {current.highlightBox.label}
                </h3>
              </div>
              <p className="text-xs text-[#1B2B45] leading-relaxed">
                {current.highlightBox.description}
              </p>

              {current.beforeAfterComparison && (
                <div className="mt-3 pt-3 border-t border-black/10 text-xs">
                  <span className="font-semibold text-[#102A56]">Differential Analysis: </span>
                  <span className="text-[#334155]">{current.beforeAfterComparison.detectedDiff}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Filmstrip selector */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#D6E0EA] flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {checkpoints.map((cp, idx) => (
              <button
                key={cp.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all shrink-0 ${
                  idx === currentIndex
                    ? 'border-[#2F6FA3] bg-[#EAF4F8] text-[#102A56] font-bold shadow-xs'
                    : 'border-[#D6E0EA] bg-white text-[#5B6B82] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>CP #{idx + 1}</span>
                {cp.isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#B3261E] rounded-full border-2 border-white"></span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#102A56] text-white hover:bg-[#183A73] transition-colors ml-4 shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
