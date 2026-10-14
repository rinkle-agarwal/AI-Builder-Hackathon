import React, { useState, useEffect } from 'react';
import { X, Play, Globe, UploadCloud, KeyRound, Database, ShieldCheck, Check, AlertTriangle, FileCode } from 'lucide-react';
import { StartRunInput, TestVariant } from '../types';

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: StartRunInput) => void;
}

interface FixtureItem {
  filename: string;
  url: string;
  label: string;
  description: string;
  tag: string;
  is_compliant: boolean;
  variant: TestVariant;
}

const DEFAULT_FIXTURES: FixtureItem[] = [
  {
    filename: 'freshcart.html',
    url: 'http://localhost:3000/freshcart.html',
    label: 'FreshCart Storefront',
    description: 'Grocery catalogue, cart drawer, promotional flash banner, and checkout journey.',
    tag: '',
    is_compliant: false,
    variant: 'All faults'
  },
  {
    filename: 'freshcart_fixed.html',
    url: 'http://localhost:3000/freshcart_fixed.html',
    label: 'FreshCart Storefront (v2)',
    description: 'Grocery catalogue, cart drawer, upfront pricing disclosures, and checkout journey.',
    tag: '',
    is_compliant: true,
    variant: 'Clean control'
  }
];

export const RunModal: React.FC<RunModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [siteName, setSiteName] = useState('FreshCart Storefront (v2)');
  const [targetType, setTargetType] = useState<'URL' | 'HTML'>('URL');
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000/freshcart_fixed.html');
  const [variant, setVariant] = useState<TestVariant>('Clean control');
  const [journeyTemplate, setJourneyTemplate] = useState('Search > cart > checkout > cancel');
  const [inventoryFileName, setInventoryFileName] = useState('');
  const [mode, setMode] = useState<'Quick' | 'Full'>('Quick');
  const [credentialsProvided, setCredentialsProvided] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const [fixtures, setFixtures] = useState<FixtureItem[]>(DEFAULT_FIXTURES);
  const [selectedFixture, setSelectedFixture] = useState<string>('freshcart_fixed.html');
  const [isCustomUrl, setIsCustomUrl] = useState<boolean>(false);

  // Fetch all available .html test stores from central public/ folder via backend
  useEffect(() => {
    if (isOpen) {
      fetch('/api/fixtures')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.fixtures) && data.fixtures.length > 0) {
            setFixtures(data.fixtures);
          }
        })
        .catch(() => {
          // Gracefully fallback to DEFAULT_FIXTURES
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectFixture = (f: FixtureItem) => {
    setSelectedFixture(f.filename);
    setIsCustomUrl(false);
    setTargetUrl(f.url);
    setSiteName(f.label);
    setVariant(f.variant);
    if (urlError) setUrlError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'URL') {
      try {
        const parsed = new URL(targetUrl);
        if (!parsed.protocol.startsWith('http')) {
          setUrlError('Please enter a valid HTTP or HTTPS web address.');
          return;
        }
      } catch {
        setUrlError('Please enter a valid format, e.g. http://localhost:3000/freshcart_fixed.html');
        return;
      }
    }

    setUrlError(null);
    onSubmit({
      siteName,
      targetUrl,
      targetType,
      variant,
      journeyTemplate,
      inventoryFileName: inventoryFileName || undefined,
      mode,
      credentialsProvided
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-xl w-full border border-[#D6E0EA] shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="run-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#102A56] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#A5C4DC]" />
            <h2 id="run-modal-title" className="text-base font-semibold text-white">
              Configure Autonomous Compliance Test
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5C4DC] hover:text-white p-1 rounded hover:bg-[#183A73] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm text-[#1B2B45]">
          {/* Central Test Fixture (.html) Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#5B6B82] uppercase tracking-wider">
                Select Store to Audit (.html Fixture)
              </label>
              <span className="text-[11px] text-[#2F6FA3] font-medium flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5" />
                Folder: public/*.html
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {fixtures.map((f) => {
                const isSelected = !isCustomUrl && (selectedFixture === f.filename || targetUrl.includes(f.filename));
                return (
                  <button
                    key={f.filename}
                    type="button"
                    onClick={() => handleSelectFixture(f)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#2F6FA3] bg-[#EAF4F8] ring-1 ring-[#2F6FA3]'
                        : 'border-[#D6E0EA] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-[#2F6FA3]/15 text-[#2F6FA3]' : 'bg-slate-100 text-[#5B6B82]'}`}>
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#102A56]">{f.label}</span>
                        </div>
                        <div className="text-[11px] text-[#5B6B82] mt-0.5 leading-snug">
                          {f.description}
                        </div>
                        <div className="text-[10px] font-mono text-[#2F6FA3] mt-1">
                          public/{f.filename} ➔ {f.url}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="p-1 rounded-full shrink-0 bg-[#2F6FA3] text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Custom URL Option */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomUrl(true);
                  setSelectedFixture('custom');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isCustomUrl
                    ? 'border-[#2F6FA3] bg-[#EAF4F8] ring-1 ring-[#2F6FA3]'
                    : 'border-[#D6E0EA] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[#102A56]">
                  <Globe className="w-3.5 h-3.5 text-[#2F6FA3]" />
                  <span>Custom URL / Third-Party Store</span>
                </div>
                {isCustomUrl && <Check className="w-3.5 h-3.5 text-[#2F6FA3]" />}
              </button>
            </div>
          </div>

          {/* Target URL Input (Editable if custom or reviewing exact URL) */}
          <div className="p-3 bg-[#F8FAFC] border border-[#D6E0EA] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1B2B45]">
                Target Web Endpoint for Playwright
              </label>
              <span className="text-[10px] font-mono text-[#5B6B82]">Live Chromium Window</span>
            </div>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                setIsCustomUrl(true);
                if (urlError) setUrlError(null);
              }}
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white font-mono text-xs focus:border-[#2F6FA3] ${
                urlError ? 'border-red-500 bg-red-50/30' : 'border-[#D6E0EA]'
              }`}
              placeholder="http://localhost:3000/freshcart_fixed.html"
            />
            {urlError && (
              <p className="text-xs text-red-600">{urlError}</p>
            )}
          </div>

          {/* Journey Template */}
          <div>
            <label className="block text-xs font-medium text-[#1B2B45] mb-1">
              Autonomous Journey Template
            </label>
            <select
              value={journeyTemplate}
              onChange={(e) => setJourneyTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6E0EA] rounded-lg text-sm bg-white focus:border-[#2F6FA3]"
            >
              <option value="Search > cart > checkout > cancel">
                Full Customer Flow: Search &gt; cart &gt; checkout &gt; cancel (7 checkpoints)
              </option>
              <option value="Cart > checkout > payment">
                Checkout Only: Cart itemization &gt; pricing drip &gt; payment add-ons (4 checkpoints)
              </option>
              <option value="Subscription join > account > cancellation">
                Membership Asymmetry: Join Plus &gt; manage plan &gt; cancellation journey (3 checkpoints)
              </option>
            </select>
          </div>

          {/* Inventory File Upload (Optional) */}
          <div className="p-3 bg-[#F8FAFC] border border-[#D6E0EA] rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1B2B45] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#2F6FA3]" />
                <span>Warehouse Inventory Feed (Optional)</span>
              </label>
              <span className="text-[11px] text-[#899BB0]">CSV / JSON</span>
            </div>
            <p className="text-[11px] text-[#5B6B82] mt-1">
              Used to verify stock claims such as "Only 2 left" against real physical DC inventory.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="mock_warehouse_inventory_oct2026.csv (bundled)"
                value={inventoryFileName}
                onChange={(e) => setInventoryFileName(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-[#D6E0EA] rounded text-xs bg-white text-[#475569]"
              />
              <button
                type="button"
                onClick={() => setInventoryFileName('mock_warehouse_inventory_oct2026.csv')}
                className="px-2.5 py-1.5 text-xs font-medium bg-[#EAF4F8] text-[#2F6FA3] rounded hover:bg-[#D6EAF3]"
              >
                Attach Mock Feed
              </button>
            </div>
          </div>

          {/* Test Mode Pills */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6B82] uppercase tracking-wider mb-1.5">
              Simulation Execution Mode
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('Quick')}
                className={`flex-1 p-2.5 rounded-lg border text-left transition-colors ${mode === 'Quick'
                    ? 'border-[#2F6FA3] bg-[#EAF4F8] text-[#102A56]'
                    : 'border-[#D6E0EA] text-[#5B6B82]'
                  }`}
              >
                <div className="font-semibold text-xs">Quick Mode (~3 min)</div>
                <div className="text-[11px] text-[#5B6B82] mt-0.5">
                  Standard checkpoint navigation; skips countdown zero-point wait.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('Full')}
                className={`flex-1 p-2.5 rounded-lg border text-left transition-colors ${mode === 'Full'
                    ? 'border-[#2F6FA3] bg-[#EAF4F8] text-[#102A56]'
                    : 'border-[#D6E0EA] text-[#5B6B82]'
                  }`}
              >
                <div className="font-semibold text-xs">Full Mode (~8 min)</div>
                <div className="text-[11px] text-[#5B6B82] mt-0.5">
                  Adds full countdown expiration observation to test timer resets.
                </div>
              </button>
            </div>
          </div>

          {/* Test Credentials (Optional) */}
          <div className="flex items-center justify-between pt-1 text-xs text-[#5B6B82]">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#899BB0]" />
              <span>Target auth credentials</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={credentialsProvided}
                onChange={(e) => setCredentialsProvided(e.target.checked)}
                className="accent-[#2F6FA3]"
              />
              <span>Stored in Google Secret Manager</span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[#D6E0EA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#5B6B82] hover:bg-[#F1F5F9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#2F6FA3] text-white hover:bg-[#265B86] shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Playwright Analysis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
