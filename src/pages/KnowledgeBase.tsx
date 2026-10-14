import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Building,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CCPA_PATTERNS_CATALOG } from '../data/mock';
import { CCPAPatternInfo } from '../types';

export const KnowledgeBase: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTestedOnly, setFilterTestedOnly] = useState(false);
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>('CP-01');

  const filteredPatterns = useMemo(() => {
    return CCPA_PATTERNS_CATALOG.filter(p => {
      const matchesSearch = 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.commonOccurrence.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterTestedOnly && !p.testedByTrustLens) return false;
      return true;
    });
  }, [searchTerm, filterTestedOnly]);

  const toggleExpand = (id: string) => {
    setExpandedPatternId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#102A56] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2F6FA3]" />
            <span>Dark Pattern Guide &amp; CCPA Regulatory Corpus</span>
          </h1>
          <p className="text-xs text-[#5B6B82]">
            Statutory definitions, UX design anti-patterns, and precedent citations issued by the Central Consumer Protection Authority (CCPA), 2023.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#EAF4F8] text-[#2F6FA3] border border-[#C6DEEE]">
            Gazette Notification CG-DL-E-30112023
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D6E0EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#899BB0] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patterns, clauses, or examples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#D6E0EA] rounded-lg bg-[#F8FAFC] text-[#1B2B45] focus:bg-white focus:border-[#2F6FA3]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#102A56]">
            <input
              type="checkbox"
              checked={filterTestedOnly}
              onChange={(e) => setFilterTestedOnly(e.target.checked)}
              className="accent-[#2F6FA3]"
            />
            <span>Show Only "Tested by TrustLens" ({CCPA_PATTERNS_CATALOG.filter(p => p.testedByTrustLens).length} patterns)</span>
          </label>
        </div>
      </div>

      {/* Pattern Catalog Cards */}
      <div className="space-y-4">
        {filteredPatterns.map(pattern => {
          const isExpanded = expandedPatternId === pattern.id;
          return (
            <div
              key={pattern.id}
              className={`bg-white rounded-2xl border transition-all ${
                isExpanded ? 'border-[#2F6FA3] shadow-xs' : 'border-[#D6E0EA] hover:border-[#899BB0]'
              }`}
            >
              {/* Pattern Header row */}
              <div
                onClick={() => toggleExpand(pattern.id)}
                className="p-4 cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#102A56] text-white">
                    {pattern.id}
                  </span>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-semibold text-[#102A56]">
                        {pattern.name}
                      </h2>

                      {/* Badge: Tested by TrustLens */}
                      {pattern.testedByTrustLens ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F5EE] text-[#1E7B53] border border-[#C2E7D3] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tested by TrustLens
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                          Planned Coverage
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5B6B82] mt-1 line-clamp-1">
                      {pattern.definition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#899BB0] hidden sm:inline">
                    {pattern.annexureRef}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#5B6B82]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#5B6B82]" />
                  )}
                </div>
              </div>

              {/* Expanded Statutory Details */}
              {isExpanded && (
                <div className="p-5 border-t border-[#F1F5F9] bg-[#F8FAFC]/50 space-y-4 text-xs text-[#1B2B45]">
                  {/* Full Definition */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#5B6B82] uppercase tracking-wider mb-1">
                      Statutory Description
                    </h3>
                    <p className="text-xs text-[#102A56] leading-relaxed">
                      {pattern.definition}
                    </p>
                  </div>

                  {/* Sample Rule Text */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#C6DEEE] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#2F6FA3]">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Official Annexure Excerpt (Sample Rule Text)
                      </span>
                      <span className="font-mono text-[#899BB0] text-[10px] uppercase">
                        {pattern.annexureRef}
                      </span>
                    </div>

                    <p className="italic text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                      "{pattern.sampleGuidelineText}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-[#5B6B82]">
                      <div>
                        <span className="font-medium text-[#102A56]">Authority:</span> {pattern.issuingAuthority}
                      </div>
                      <div>
                        <span className="font-medium text-[#102A56]">Date Enacted:</span> {pattern.dateEnacted}
                      </div>
                      <div>
                        <span className="font-medium text-[#102A56]">Legal Source:</span> {pattern.officialClause}
                      </div>
                    </div>
                  </div>

                  {/* Common Occurrence */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#5B6B82] uppercase tracking-wider mb-1">
                      Common E-Commerce Occurrence
                    </h3>
                    <p className="text-xs text-[#334155] bg-white p-2.5 rounded border border-[#D6E0EA]">
                      {pattern.commonOccurrence}
                    </p>
                  </div>

                  {/* Precedents */}
                  {pattern.enforcementPrecedents && (
                    <div>
                      <h3 className="text-xs font-semibold text-[#A8620A] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Enforcement Precedent
                      </h3>
                      <p className="text-xs text-[#A8620A] bg-[#FEF7EC] p-2.5 rounded border border-[#F9E2BE] font-medium leading-relaxed">
                        {pattern.enforcementPrecedents}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
