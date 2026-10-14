import React from 'react';
import { 
  Settings as SettingsIcon, 
  Eye, 
  FlaskConical, 
  KeyRound, 
  Cloud, 
  Database, 
  Bell, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface SettingsProps {
  isAuditorView: boolean;
  onToggleAuditorView: () => void;
  demoHarnessEnabled: boolean;
  onToggleDemoHarness: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isAuditorView,
  onToggleAuditorView,
  demoHarnessEnabled,
  onToggleDemoHarness
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs">
        <h1 className="text-xl font-semibold text-[#102A56] flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#2F6FA3]" />
          <span>System &amp; Workspace Configuration</span>
        </h1>
        <p className="text-xs text-[#5B6B82] mt-0.5">
          Manage evaluation harnesses, auditor role views, and cloud service bindings.
        </p>
      </div>

      {/* Evaluation & Governance Controls */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs space-y-5">
        <h2 className="text-sm font-semibold text-[#102A56] uppercase tracking-wider">
          Evaluation &amp; Governance Toggles
        </h2>

        {/* Auditor View Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC]">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-[#2F6FA3] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-[#102A56]">
                Auditor Read-Only Mode
              </div>
              <p className="text-xs text-[#5B6B82] mt-0.5">
                Renders the entire dashboard in read-only mode for regulatory scrutiny. Hides mutation triggers, triage buttons, and re-test actuators.
              </p>
            </div>
          </div>
          <button
            onClick={onToggleAuditorView}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isAuditorView ? 'bg-[#102A56]' : 'bg-[#CBD5E1]'
            }`}
            role="switch"
            aria-checked={isAuditorView}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isAuditorView ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Demo Test Harness Verification Card Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC]">
          <div className="flex items-start gap-3">
            <FlaskConical className="w-5 h-5 text-[#2F6FA3] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-[#102A56]">
                Demo Test Harness Verification Banner
              </div>
              <p className="text-xs text-[#5B6B82] mt-0.5">
                Displays the ground-truth benchmark card on the Overview page ("Seeded faults found: 5 of 5. False alarms: 0. Genuine stock label cleared. Decoy bug classified as bug").
              </p>
            </div>
          </div>
          <button
            onClick={onToggleDemoHarness}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              demoHarnessEnabled ? 'bg-[#2F6FA3]' : 'bg-[#CBD5E1]'
            }`}
            role="switch"
            aria-checked={demoHarnessEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                demoHarnessEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Cloud Service Architecture (Google Cloud Stubs) */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-[#102A56] uppercase tracking-wider">
          Cloud Infrastructure Bindings (Google Cloud)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC]">
            <div className="font-semibold text-[#102A56] flex items-center gap-1.5 mb-1">
              <Cloud className="w-4 h-4 text-[#2F6FA3]" /> Cloud Run Orchestrator
            </div>
            <p className="text-[#5B6B82]">
              Container image: <span className="font-mono text-[#102A56]">gcr.io/trustlens/navigator:v1.2</span>
            </p>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Headless Chromium Automation Active
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC]">
            <div className="font-semibold text-[#102A56] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#2F6FA3]" /> Vertex AI Gemini + RAG
            </div>
            <p className="text-[#5B6B82]">
              Model: <span className="font-mono text-[#102A56]">gemini-2.5-flash / rag-ccpa-2023</span>
            </p>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Grounded Regulatory Corpus Synchronized
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC]">
            <div className="font-semibold text-[#102A56] flex items-center gap-1.5 mb-1">
              <Database className="w-4 h-4 text-[#2F6FA3]" /> Firestore Audit Persistence
            </div>
            <p className="text-[#5B6B82]">
              Collection: <span className="font-mono text-[#102A56]">/compliance_runs</span>
            </p>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reactive onSnapshot listener ready
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC]">
            <div className="font-semibold text-[#102A56] flex items-center gap-1.5 mb-1">
              <KeyRound className="w-4 h-4 text-[#2F6FA3]" /> Secret Manager
            </div>
            <p className="text-[#5B6B82]">
              Secrets: <span className="font-mono text-[#102A56]">freshcart-test-auth-cookie</span>
            </p>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> IAM least-privilege binding enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
