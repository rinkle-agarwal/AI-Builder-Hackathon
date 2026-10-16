import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { HeaderStrip } from './components/HeaderStrip';
import { RunModal } from './components/RunModal';
import { AuditReportModal } from './components/AuditReportModal';
import { Overview } from './pages/Overview';
import { Findings } from './pages/Findings';
import { CompareRuns } from './pages/CompareRuns';
import { ComplianceTrail } from './pages/ComplianceTrail';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Settings } from './pages/Settings';
import { useRunSimulation } from './hooks/useRunSimulation';
import { GROUNDED_FINDINGS_ALL_FAULTS } from './data/mock';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuditorView, setIsAuditorView] = useState(false);
  const [demoHarnessEnabled, setDemoHarnessEnabled] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const {
    currentRun,
    runsList,
    loading,
    speed,
    setSpeed,
    selectRun,
    startNewRun,
    updateFindingStatus,
    retryStage,
    resetPipeline
  } = useRunSimulation('RUN-001');

  const handleStartAnalysis = () => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    const fallbackTarget = origin ? `${origin}/freshcart.html` : '/freshcart.html';
    const targetUrl = (!currentRun?.targetUrl || currentRun.targetUrl.includes('freshcart-demo.store') || currentRun.targetUrl.includes('localhost'))
      ? fallbackTarget
      : currentRun.targetUrl;
    startNewRun({
      siteName: currentRun?.siteName ? currentRun.siteName.replace(/\s*\(Indiranagar Store\)/i, '') : 'FreshCart',
      targetUrl,
      targetType: 'URL',
      variant: 'All faults',
      journeyTemplate: currentRun?.journeyTemplate || 'Search > cart > checkout > cancel',
      mode: 'Quick',
      credentialsProvided: true
    });
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F4F7FB] text-[#1B2B45] font-sans">
        {/* Left Navigation */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isAuditorView={isAuditorView}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* Top Header Strip with Action Buttons */}
          <HeaderStrip
            currentRun={currentRun}
            onOpenRunModal={() => setRunModalOpen(true)}
            onStartAnalysis={() => setRunModalOpen(true)}
            onRetest={() => setRunModalOpen(true)}
            onResetPipeline={resetPipeline}
            isAuditorView={isAuditorView}
            onToggleAuditorView={() => setIsAuditorView(!isAuditorView)}
            speed={speed}
            onSetSpeed={setSpeed}
            onOpenReportModal={() => setReportModalOpen(true)}
          />

          {/* Viewport Scroll Area */}
          <main className="flex-1 overflow-y-auto px-6 py-6" role="main">
            {loading && !currentRun ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-28 bg-white rounded-2xl border border-[#D6E0EA] p-4 flex items-center justify-center text-[#5B6B82]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2F6FA3] mr-2" />
                  <span className="text-sm font-medium">Loading TrustLens compliance audit telemetry...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-32 bg-white rounded-2xl border border-[#D6E0EA]"></div>
                  ))}
                </div>
              </div>
            ) : currentRun ? (
              <Routes>
                <Route
                  path="/"
                  element={
                    <Overview
                      currentRun={currentRun}
                      onOpenRunModal={() => setRunModalOpen(true)}
                      onRetryStage={retryStage}
                      onResetPipeline={resetPipeline}
                      isAuditorView={isAuditorView}
                      demoHarnessEnabled={demoHarnessEnabled}
                      onToggleDemoHarness={() => setDemoHarnessEnabled(!demoHarnessEnabled)}
                    />
                  }
                />
                <Route
                  path="/findings"
                  element={
                    <Findings
                      findings={currentRun.findings ?? []}
                      onUpdateWorkflowStatus={updateFindingStatus}
                      isAuditorView={isAuditorView}
                    />
                  }
                />
                <Route
                  path="/compare"
                  element={
                    <CompareRuns
                      runs={runsList}
                      onSelectRunForOverview={selectRun}
                    />
                  }
                />
                <Route
                  path="/trail"
                  element={
                    <ComplianceTrail
                      runs={runsList}
                      onSelectRun={selectRun}
                    />
                  }
                />
                <Route
                  path="/knowledge-base"
                  element={<KnowledgeBase />}
                />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      isAuditorView={isAuditorView}
                      onToggleAuditorView={() => setIsAuditorView(!isAuditorView)}
                      demoHarnessEnabled={demoHarnessEnabled}
                      onToggleDemoHarness={() => setDemoHarnessEnabled(!demoHarnessEnabled)}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-[#D6E0EA] text-center">
                <p className="text-sm text-[#5B6B82]">No active run loaded.</p>
                <button
                  onClick={() => setRunModalOpen(true)}
                  className="mt-3 px-4 py-2 bg-[#2F6FA3] text-white rounded-lg text-xs font-semibold"
                >
                  Start New Run
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Run Analysis Modal (Global across all pages) */}
        <RunModal
          isOpen={runModalOpen}
          onClose={() => setRunModalOpen(false)}
          onSubmit={startNewRun}
        />

        {/* Official Executive Audit & Compliance Report Modal */}
        <AuditReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          run={currentRun}
        />
      </div>
    </BrowserRouter>
  );
}
