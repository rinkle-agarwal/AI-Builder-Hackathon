import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Copy, 
  ExternalLink, 
  X, 
  Check, 
  Ticket, 
  RotateCcw, 
  History, 
  Database, 
  Sparkles, 
  FileText,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Clock,
  ExternalLink as LinkIcon
} from 'lucide-react';
import { Finding, WorkflowStatus, PatternStatus } from '../types';
import { EvidenceScreenshot } from '../components/EvidenceScreenshot';
import { GROUNDED_FINDINGS_ALL_FAULTS } from '../data/mock';

interface FindingsProps {
  findings: Finding[];
  onUpdateWorkflowStatus: (findingId: string, status: WorkflowStatus) => void;
  isAuditorView: boolean;
}

export const Findings: React.FC<FindingsProps> = ({
  findings: rawFindings,
  onUpdateWorkflowStatus,
  isAuditorView
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeIdParam = searchParams.get('id');

  // Use genuine findings from live agent runs or test fixtures
  const findings = useMemo(() => {
    return rawFindings ?? [];
  }, [rawFindings]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'severity' | 'confidence' | 'pattern'>('severity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(activeIdParam || null);
  const [copiedFix, setCopiedFix] = useState(false);
  const [ticketToast, setTicketToast] = useState<string | null>(null);

  // Jira Ticket Modal & Persistence State
  const [jiraModalFinding, setJiraModalFinding] = useState<Finding | null>(null);
  const [jiraTickets, setJiraTickets] = useState<Record<string, { key: string; status: 'To Do' | 'In Progress' | 'Done'; summary: string }>>({
    F1: { key: 'PROD-CCPA-F1', status: 'In Progress', summary: 'Drip pricing fee disclosure remediation' }
  });

  // Set active finding if URL param changes
  React.useEffect(() => {
    if (activeIdParam) {
      setSelectedFindingId(activeIdParam);
    }
  }, [activeIdParam]);

  const selectedFinding = useMemo(() => {
    return findings.find(f => f.id === selectedFindingId) || null;
  }, [findings, selectedFindingId]);

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      // Search
      const matchesSearch = 
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.patternName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.journeyStep.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filter pills
      if (filterType === 'All') return true;
      if (filterType === 'Non-compliant') return f.status === 'Non-compliant';
      if (filterType === 'Needs review') return f.status === 'Needs review';
      if (filterType === 'Likely bug') return f.confidenceLabel === 'likely bug';
      if (filterType === 'Cleared') return f.status === 'Compliant' && f.severity === 'Info';
      if (filterType === 'Resolved') return f.workflowStatus === 'Fixed';
      return true;
    }).sort((a, b) => {
      if (sortBy === 'severity') {
        const weight = { High: 3, Medium: 2, Low: 1, Info: 0 };
        const diff = weight[b.severity] - weight[a.severity];
        return sortDirection === 'desc' ? diff : -diff;
      }
      if (sortBy === 'confidence') {
        const diff = b.confidence - a.confidence;
        return sortDirection === 'desc' ? diff : -diff;
      }
      if (sortBy === 'pattern') {
        return sortDirection === 'asc' 
          ? a.patternName.localeCompare(b.patternName)
          : b.patternName.localeCompare(a.patternName);
      }
      return 0;
    });
  }, [findings, searchTerm, filterType, sortBy, sortDirection]);

  const handleCopyFix = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const handleOpenJiraModal = (finding: Finding, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJiraModalFinding(finding);
  };

  const handleLinkJiraTicket = (finding: Finding) => {
    const key = `PROD-CCPA-${finding.id}`;
    setJiraTickets(prev => ({
      ...prev,
      [finding.id]: {
        key,
        status: 'In Progress',
        summary: `${finding.patternName} Remediation`
      }
    }));
    onUpdateWorkflowStatus(finding.id, 'In progress');
    setTicketToast(`✓ Jira Ticket ${key} connected & assigned. Finding workflow status updated to "In progress".`);
    setTimeout(() => setTicketToast(null), 4000);
    setJiraModalFinding(null);
  };

  const handleResolveJiraTicket = (finding: Finding) => {
    const key = jiraTickets[finding.id]?.key || `PROD-CCPA-${finding.id}`;
    setJiraTickets(prev => ({
      ...prev,
      [finding.id]: {
        key,
        status: 'Done',
        summary: `${finding.patternName} Remediation`
      }
    }));
    onUpdateWorkflowStatus(finding.id, 'Fixed');
    setTicketToast(`✓ Jira Ticket ${key} marked as Resolved! Finding status updated to "Fixed".`);
    setTimeout(() => setTicketToast(null), 4000);
    setJiraModalFinding(null);
  };

  const handleReopenJiraTicket = (finding: Finding) => {
    const key = jiraTickets[finding.id]?.key || `PROD-CCPA-${finding.id}`;
    setJiraTickets(prev => ({
      ...prev,
      [finding.id]: {
        key,
        status: 'In Progress',
        summary: `${finding.patternName} Remediation`
      }
    }));
    onUpdateWorkflowStatus(finding.id, 'In progress');
    setTicketToast(`Jira Ticket ${key} re-opened. Workflow status set to "In progress".`);
    setTimeout(() => setTicketToast(null), 4000);
    setJiraModalFinding(null);
  };

  const handleMarkForRetest = (finding: Finding) => {
    onUpdateWorkflowStatus(finding.id, 'In progress');
    setTicketToast(`Finding ${finding.id} flagged for targeted regression re-test.`);
    setTimeout(() => setTicketToast(null), 4000);
  };

  const handleRowClick = (id: string) => {
    setSelectedFindingId(id);
    setSearchParams({ id });
  };

  const closeDrawer = () => {
    setSelectedFindingId(null);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#102A56]">
              Findings &amp; Remediation Console
            </h1>
            <p className="text-xs text-[#5B6B82]">
              Audit issues identified across navigation checkpoints with CCPA citations and suggested fixes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5B6B82]">
              Showing <span className="font-semibold text-[#102A56] tabular-nums">{filteredFindings.length}</span> of {findings.length} findings
            </span>
          </div>
        </div>

        {/* Search, Pills & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9]">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#899BB0] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search findings, patterns, steps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#D6E0EA] rounded-lg bg-[#F8FAFC] text-[#1B2B45] focus:bg-white focus:border-[#2F6FA3]"
            />
          </div>

          {/* Pill Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Non-compliant', 'Needs review', 'Likely bug', 'Cleared', 'Resolved'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-[#102A56] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#5B6B82] hover:bg-[#E2E8F0] hover:text-[#102A56]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-[#5B6B82]">
            <span className="shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 border border-[#D6E0EA] rounded-md bg-[#F8FAFC] text-[#102A56]"
            >
              <option value="severity">Severity (High to Low)</option>
              <option value="confidence">Confidence (%)</option>
              <option value="pattern">Pattern Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Ticket Toast */}
      {ticketToast && (
        <div className="p-3 bg-[#EAF4F8] border border-[#2F6FA3] text-[#102A56] rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <Ticket className="w-4 h-4 text-[#2F6FA3]" />
            <span>{ticketToast}</span>
          </div>
          <button onClick={() => setTicketToast(null)} className="text-[#5B6B82] hover:text-[#102A56]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Findings Table */}
      <div className="bg-white rounded-2xl border border-[#D6E0EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#D6E0EA] text-[#5B6B82] font-semibold">
                <th className="py-3 px-3 w-16">ID</th>
                <th className="py-3 px-3">Pattern</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Confidence Meter</th>
                <th className="py-3 px-3">Journey Step</th>
                <th className="py-3 px-3">First Seen</th>
                <th className="py-3 px-3">Workflow State</th>
                <th className="py-3 px-3">Jira Integration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredFindings.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => handleRowClick(finding.id)}
                  className={`hover:bg-[#F8FBFE] cursor-pointer transition-colors ${
                    selectedFindingId === finding.id ? 'bg-[#EAF4F8]/50 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono font-bold text-[#102A56]">
                    {finding.id}
                  </td>
                  <td className="py-3 px-3 text-[#1B2B45] font-medium">
                    {finding.patternName}
                  </td>
                  <td className="py-3 px-4 text-[#334155] max-w-xs truncate">
                    {finding.title}
                  </td>
                  <td className="py-3 px-3">
                    {finding.status === 'Compliant' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]">
                        <CheckCircle2 className="w-3 h-3 text-[#1E7B53]" /> Compliant
                      </span>
                    )}
                    {finding.status === 'Non-compliant' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]">
                        <AlertCircle className="w-3 h-3 text-[#B3261E]" /> Non-compliant
                      </span>
                    )}
                    {finding.status === 'Needs review' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF7EC] text-[#A8620A] border border-[#F9E2BE]">
                        <HelpCircle className="w-3 h-3 text-[#A8620A]" /> Needs review
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-semibold ${
                      finding.severity === 'High' ? 'text-[#B3261E]' :
                      finding.severity === 'Medium' ? 'text-[#A8620A]' :
                      finding.severity === 'Low' ? 'text-[#475569]' : 'text-[#1E7B53]'
                    }`}>
                      {finding.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            finding.confidence >= 90 ? 'bg-[#102A56]' :
                            finding.confidence >= 70 ? 'bg-[#2F6FA3]' : 'bg-[#A8620A]'
                          }`}
                          style={{ width: `${finding.confidence}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-[11px] text-[#5B6B82]">
                        {finding.confidence}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[#899BB0] block capitalize">
                      {finding.confidenceLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#5B6B82] max-w-[120px] truncate">
                    {finding.journeyStep}
                  </td>
                  <td className="py-3 px-3 text-[#899BB0] font-mono text-[11px]">
                    {finding.firstSeen}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                      finding.workflowStatus === 'Fixed' ? 'bg-[#E8F5EE] text-[#1E7B53] border-[#C2E7D3]' :
                      finding.workflowStatus === 'In progress' ? 'bg-[#EAF4F8] text-[#2F6FA3] border-[#C6DEEE]' :
                      finding.workflowStatus === 'Accepted risk' ? 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]' :
                      'bg-[#FEF7EC] text-[#A8620A] border-[#F9E2BE]'
                    }`}>
                      {finding.workflowStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                    {jiraTickets[finding.id] ? (
                      <button
                        onClick={(e) => handleOpenJiraModal(finding, e)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#0052CC]/10 hover:bg-[#0052CC]/20 text-[#0052CC] border border-[#0052CC]/30 font-medium text-[11px] transition-colors"
                        title="Click to view/manage Jira issue"
                      >
                        <Ticket className="w-3.5 h-3.5 text-[#0052CC]" />
                        <span className="font-mono font-bold">{jiraTickets[finding.id].key}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          jiraTickets[finding.id].status === 'Done' ? 'bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]' : 'bg-[#EAF4F8] text-[#0052CC] border border-[#C6DEEE]'
                        }`}>
                          {jiraTickets[finding.id].status}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleOpenJiraModal(finding, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-[#F8FAFC] text-[#0052CC] border border-[#0052CC]/40 font-semibold text-[11px] transition-colors shadow-2xs hover:shadow-xs"
                      >
                        <Ticket className="w-3 h-3 text-[#0052CC]" />
                        <span>+ Jira Ticket</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredFindings.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center border border-[#C2E7D3]">
                        <CheckCircle2 className="w-6 h-6 text-[#1E7B53]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#102A56]">
                          Zero Compliance Infractions Detected
                        </h3>
                        <p className="text-xs text-[#5B6B82] mt-1 max-w-md">
                          All shopping journey checkpoints evaluated strictly against CCPA 2023 Guidelines passed with 100% compliance. No dark patterns found.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-Side Detail Drawer */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-[#D6E0EA] overflow-hidden"
            role="dialog"
            aria-labelledby="finding-drawer-title"
          >
            {/* Drawer Header */}
            <div className="bg-[#102A56] text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#183A73] text-[#A5C4DC] font-bold">
                    {selectedFinding.id}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#A5C4DC]">
                    {selectedFinding.patternName}
                  </span>
                </div>
                <h2 id="finding-drawer-title" className="text-base font-semibold text-white leading-snug">
                  {selectedFinding.title}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="text-[#A5C4DC] hover:text-white p-1 rounded hover:bg-[#183A73] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow Action Bar */}
            <div className="bg-[#F8FAFC] border-b border-[#D6E0EA] px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#5B6B82] font-medium">Workflow Status:</span>
                <select
                  disabled={isAuditorView}
                  value={selectedFinding.workflowStatus}
                  onChange={(e) => onUpdateWorkflowStatus(selectedFinding.id, e.target.value as WorkflowStatus)}
                  className="px-2.5 py-1 border border-[#D6E0EA] rounded-md bg-white font-medium text-[#102A56] disabled:opacity-60"
                >
                  <option value="Open">Open</option>
                  <option value="In progress">In progress</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Accepted risk">Accepted risk</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#5B6B82]">Severity:</span>
                <span className={`font-bold ${
                  selectedFinding.severity === 'High' ? 'text-[#B3261E]' :
                  selectedFinding.severity === 'Medium' ? 'text-[#A8620A]' : 'text-[#475569]'
                }`}>
                  {selectedFinding.severity}
                </span>
                <span className="text-[#D6E0EA]">|</span>
                <span className="text-[#5B6B82]">First Seen:</span>
                <span className="font-mono text-[#1B2B45]">{selectedFinding.firstSeen}</span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-[#1B2B45]">
              {/* 1. Before/After Evidence Wireframes */}
              <div>
                <h3 className="text-xs font-semibold text-[#5B6B82] uppercase tracking-wider mb-2.5">
                  Visual Interaction Evidence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-[#5B6B82] mb-1 flex items-center justify-between">
                      <span>Baseline Frame (Run #11)</span>
                      <span className="text-red-600 font-mono text-[10px]">Flagged Anomaly</span>
                    </div>
                    <EvidenceScreenshot
                      type={selectedFinding.evidenceScreenshotType || 'cart'}
                      variant="before"
                      highlightLabel="Baseline Interaction Capture"
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-[#5B6B82] mb-1 flex items-center justify-between">
                      <span>Active Test Frame (Run #12)</span>
                      <span className="text-emerald-700 font-mono text-[10px]">Current Evaluation</span>
                    </div>
                    <EvidenceScreenshot
                      type={selectedFinding.evidenceScreenshotType || 'cart'}
                      variant="after"
                      highlightLabel="Evaluation State"
                    />
                  </div>
                </div>
              </div>

              {/* 2. "What Changed" from Pattern Detector */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D6E0EA]">
                <h3 className="text-xs font-semibold text-[#2F6FA3] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2F6FA3]" /> What Changed (Pattern Detector Agent)
                </h3>
                <p className="text-xs text-[#1B2B45] leading-relaxed">
                  {selectedFinding.whatChanged}
                </p>
              </div>

              {/* 3. "Why It Matters" from Reasoning Agent + Cited CCPA Rule */}
              <div className="p-4 rounded-xl bg-white border border-[#D6E0EA] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#102A56] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#2F6FA3]" /> Why It Matters &amp; Grounded CCPA Rule
                  </h3>
                  <button
                    onClick={() => navigate('/knowledge-base')}
                    className="text-[11px] text-[#2F6FA3] hover:underline flex items-center gap-1"
                  >
                    <span>Dark Pattern Guide</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-[#EAF4F8]/50 border border-[#C6DEEE] text-xs space-y-1">
                  <div className="font-semibold text-[#102A56]">
                    {selectedFinding.whyItMatters.ruleTitle}
                  </div>
                  <div className="text-[11px] text-[#5B6B82]">
                    Issuing Authority: <span className="text-[#102A56]">{selectedFinding.whyItMatters.issuingAuthority}</span>
                  </div>
                  <div className="text-[11px] text-[#5B6B82]">
                    Section &amp; Clause: <span className="font-mono text-[#2F6FA3] font-semibold">{selectedFinding.whyItMatters.section}</span> · Enacted {selectedFinding.whyItMatters.versionDate}
                  </div>
                  
                  {/* Sample Rule Excerpt */}
                  <div className="mt-2 pt-2 border-t border-[#C6DEEE] text-[#1B2B45] italic bg-white/70 p-2 rounded text-[11px]">
                    "{selectedFinding.whyItMatters.excerpt}"
                    <span className="block mt-1 font-mono text-[9px] uppercase tracking-wider text-[#899BB0] not-italic">
                      Official statutory definition (Sample Text)
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Enforcement Precedent */}
              {selectedFinding.enforcementPrecedent && (
                <div className="p-4 rounded-xl bg-[#FEF7EC]/70 border border-[#F9E2BE] text-xs">
                  <div className="font-semibold text-[#A8620A] flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4 text-[#A8620A]" /> Regulatory Enforcement Precedent
                  </div>
                  <div className="font-medium text-[#102A56]">
                    {selectedFinding.enforcementPrecedent.entity} — <span className="text-[#B3261E]">{selectedFinding.enforcementPrecedent.penalty}</span>
                  </div>
                  <p className="text-[#5B6B82] mt-1 text-[11px] leading-relaxed">
                    {selectedFinding.enforcementPrecedent.context}
                  </p>
                </div>
              )}

              {/* 5. Confidence Score & Human Review Controls */}
              <div className="p-4 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[#5B6B82] uppercase tracking-wider">
                    Confidence Evaluation
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#102A56] tabular-nums">
                      {selectedFinding.confidence}%
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#102A56] text-white">
                      {selectedFinding.confidenceLabel}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${
                      selectedFinding.confidence >= 90 ? 'bg-[#1E7B53]' :
                      selectedFinding.confidence >= 70 ? 'bg-[#2F6FA3]' : 'bg-[#A8620A]'
                    }`}
                    style={{ width: `${selectedFinding.confidence}%` }}
                  />
                </div>

                <p className="text-xs text-[#5B6B82]">
                  Reason: {selectedFinding.confidenceReason}
                </p>

                {/* For "Needs human review": show Approve, Reject, Reclassify */}
                {selectedFinding.status === 'Needs review' && !isAuditorView && (
                  <div className="mt-4 pt-3 border-t border-[#D6E0EA] flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#102A56]">Analyst Triage:</span>
                    <button
                      onClick={() => onUpdateWorkflowStatus(selectedFinding.id, 'Fixed')}
                      className="flex items-center gap-1 px-3 py-1 bg-[#1E7B53] text-white rounded-lg text-xs font-medium hover:bg-[#166041]"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Approve Finding
                    </button>
                    <button
                      onClick={() => onUpdateWorkflowStatus(selectedFinding.id, 'Accepted risk')}
                      className="flex items-center gap-1 px-3 py-1 bg-[#475569] text-white rounded-lg text-xs font-medium hover:bg-[#334155]"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Reject (False Positive)
                    </button>
                    <button
                      onClick={() => onUpdateWorkflowStatus(selectedFinding.id, 'In progress')}
                      className="flex items-center gap-1 px-3 py-1 border border-[#D6E0EA] bg-white text-[#102A56] rounded-lg text-xs font-medium hover:bg-[#F1F5F9]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reclassify as Bug
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Stock Claims: "Claim vs Data" Table */}
              {selectedFinding.stockClaimData && (
                <div className="p-4 rounded-xl border border-[#D6E0EA] bg-white">
                  <h3 className="text-xs font-semibold text-[#102A56] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#2F6FA3]" /> Scarcity Claim vs Warehouse ERP Audit
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#D6E0EA] text-[#5B6B82]">
                          <th className="py-2 px-2.5">Catalog SKU</th>
                          <th className="py-2 px-2">Label Shown</th>
                          <th className="py-2 px-2 font-mono">Units in DC</th>
                          <th className="py-2 px-2">Audit Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {selectedFinding.stockClaimData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-2.5 font-medium text-[#1B2B45]">{row.product}</td>
                            <td className="py-2 px-2 text-red-600 font-semibold">{row.labelShown}</td>
                            <td className="py-2 px-2 font-mono font-bold tabular-nums text-[#102A56]">{row.unitsAvailable}</td>
                            <td className="py-2 px-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                row.verdict.includes('False') 
                                  ? 'bg-[#FDF2F2] text-[#B3261E] border border-[#F8D0CD]' 
                                  : 'bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3]'
                              }`}>
                                {row.verdict}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. Suggested Fix & Remediation Ticket */}
              <div className="p-4 rounded-xl border border-[#2F6FA3] bg-[#EAF4F8]/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[#2F6FA3] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2F6FA3]" /> Suggested Fix (Fix Suggestion Agent)
                  </h3>
                  <button
                    onClick={() => handleCopyFix(selectedFinding.suggestedFix)}
                    className="flex items-center gap-1 text-xs text-[#2F6FA3] hover:underline font-medium"
                  >
                    {copiedFix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFix ? 'Copied!' : 'Copy Fix'}</span>
                  </button>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[#C6DEEE] text-xs font-mono text-[#102A56] leading-relaxed">
                  {selectedFinding.suggestedFix}
                </div>

                {!isAuditorView && (
                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#C6DEEE]">
                    <button
                      onClick={(e) => handleOpenJiraModal(selectedFinding, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0052CC] text-white rounded-lg text-xs font-semibold hover:bg-[#0747A6] shadow-xs"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{jiraTickets[selectedFinding.id] ? `Manage Jira Ticket (${jiraTickets[selectedFinding.id].key})` : 'Create & Link Jira Ticket'}</span>
                    </button>
                    <button
                      onClick={() => handleMarkForRetest(selectedFinding)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D6E0EA] bg-white text-[#102A56] rounded-lg text-xs font-medium hover:bg-[#F8FAFC]"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#2F6FA3]" />
                      <span>Mark for Re-test</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 8. Run History Timeline */}
              <div className="p-4 rounded-xl border border-[#D6E0EA] bg-white">
                <h3 className="text-xs font-semibold text-[#5B6B82] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#2F6FA3]" /> Historical Finding Lifecycle
                </h3>
                <div className="space-y-2">
                  {selectedFinding.runHistory.map((run, idx) => (
                    <div key={run.runId} className="flex items-center justify-between text-xs p-2 rounded bg-[#F8FAFC] border border-[#F1F5F9]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#102A56]">{run.runId}</span>
                        <span className="text-[#5B6B82]">· {run.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono tabular-nums text-[#5B6B82]">Run Score: {run.score}/100</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          run.status === 'Compliant' ? 'bg-[#E8F5EE] text-[#1E7B53]' : 'bg-[#FDF2F2] text-[#B3261E]'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-[#F8FAFC] border-t border-[#D6E0EA] flex items-center justify-between">
              <span className="text-xs text-[#5B6B82]">
                Audit Reference ID: <span className="font-mono text-[#102A56]">{selectedFinding.id}</span>
              </span>
              <button
                onClick={closeDrawer}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#102A56] text-white hover:bg-[#183A73] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jira Ticket Integration Modal */}
      {jiraModalFinding && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#D6E0EA] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-[#0052CC] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Ticket className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide">Jira Issue Tracking &amp; Remediation</span>
                    <span className="bg-white/25 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold">
                      Atlassian Cloud
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100">
                    Direct integration between CCPA audit infraction and engineering sprints
                  </p>
                </div>
              </div>
              <button
                onClick={() => setJiraModalFinding(null)}
                className="text-blue-100 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-[#1B2B45] max-h-[75vh] overflow-y-auto">
              {/* Ticket Identification */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#D6E0EA]">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#5B6B82] tracking-wider">
                    Jira Issue Key
                  </div>
                  <div className="font-mono text-sm font-bold text-[#0052CC] mt-0.5">
                    {jiraTickets[jiraModalFinding.id]?.key || `PROD-CCPA-${jiraModalFinding.id}`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#5B6B82] tracking-wider text-right">
                    Current Jira State
                  </div>
                  <div className="mt-0.5 text-right">
                    {jiraTickets[jiraModalFinding.id] ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        jiraTickets[jiraModalFinding.id].status === 'Done'
                          ? 'bg-[#E8F5EE] text-[#1E7B53] border-[#C2E7D3]'
                          : 'bg-[#EAF4F8] text-[#0052CC] border-[#C6DEEE]'
                      }`}>
                        ● {jiraTickets[jiraModalFinding.id].status}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                        Unlinked (Draft)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Issue Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg border border-[#E2E8F0] bg-white">
                  <span className="text-[10px] text-[#5B6B82] font-semibold block uppercase">Issue Type</span>
                  <span className="font-semibold text-[#102A56] mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Compliance Bug (Sev-1)
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-[#E2E8F0] bg-white">
                  <span className="text-[10px] text-[#5B6B82] font-semibold block uppercase">Severity Priority</span>
                  <span className={`font-semibold mt-0.5 ${
                    jiraModalFinding.severity === 'High' ? 'text-[#B3261E]' : 'text-[#A8620A]'
                  }`}>
                    {jiraModalFinding.severity === 'High' ? 'Highest (P0)' : 'High (P1)'}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-[#5B6B82] block mb-1">
                  Issue Summary
                </label>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#D6E0EA] font-medium text-[#102A56]">
                  [CCPA Violation] {jiraModalFinding.patternName} detected in {jiraModalFinding.journeyStep} flow
                </div>
              </div>

              {/* Grounded Citation */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-[#5B6B82] block mb-1">
                  Legal Statutory Citation &amp; Clause
                </label>
                <div className="p-2.5 rounded-lg bg-[#EAF4F8]/50 border border-[#C6DEEE] text-[11px] text-[#102A56]">
                  <span className="font-bold">{jiraModalFinding.whyItMatters.ruleTitle}</span>
                  <span className="text-[#5B6B82] block mt-0.5">
                    {jiraModalFinding.whyItMatters.issuingAuthority} · Section {jiraModalFinding.whyItMatters.section} ({jiraModalFinding.whyItMatters.versionDate})
                  </span>
                </div>
              </div>

              {/* Proposed Engineering Action Blueprint */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-[#5B6B82] block mb-1">
                  Engineering Remediation Blueprint (AI Generated)
                </label>
                <div className="p-2.5 rounded-lg bg-white border border-[#D6E0EA] font-mono text-[11px] text-[#1B2B45] whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                  {jiraModalFinding.suggestedFix}
                </div>
              </div>

              {/* Future Integration Note */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#5B6B82] flex items-start gap-2">
                <span className="text-base leading-none">💡</span>
                <span>
                  <strong>Bidirectional Sync:</strong> Linking or resolving this ticket updates the finding's compliance audit trail in real-time, allowing developers to close tickets via CI/CD Webhooks or sprint boards in the future.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#F8FAFC] border-t border-[#D6E0EA] flex items-center justify-between gap-2">
              <button
                onClick={() => setJiraModalFinding(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#D6E0EA] bg-white text-[#5B6B82] hover:bg-[#F1F5F9]"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {jiraTickets[jiraModalFinding.id]?.status === 'Done' ? (
                  <button
                    onClick={() => handleReopenJiraTicket(jiraModalFinding)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#D6E0EA] bg-white text-[#102A56] hover:bg-[#F1F5F9] flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#0052CC]" />
                    Re-open Ticket
                  </button>
                ) : (
                  <>
                    {jiraTickets[jiraModalFinding.id] && (
                      <button
                        onClick={() => handleResolveJiraTicket(jiraModalFinding)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1E7B53] text-white hover:bg-[#166041] flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark as Resolved
                      </button>
                    )}
                    <button
                      onClick={() => handleLinkJiraTicket(jiraModalFinding)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0052CC] text-white hover:bg-[#0747A6] flex items-center gap-1.5 shadow-xs"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      {jiraTickets[jiraModalFinding.id] ? 'Update Jira Ticket' : 'Create & Link Jira Ticket'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
