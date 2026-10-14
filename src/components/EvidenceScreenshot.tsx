import React from 'react';
import { AlertCircle, CheckCircle2, ShoppingBag, ShieldAlert, Clock, ArrowRight, X } from 'lucide-react';

interface EvidenceScreenshotProps {
  type?: 'cart' | 'payment' | 'urgency_product' | 'cancellation_flow' | 'confirm_shaming' | 'bug_counter' | 'genuine_stock';
  url?: string;
  variant?: 'before' | 'after' | 'standard';
  highlightLabel?: string;
  className?: string;
  interactive?: boolean;
}

export const EvidenceScreenshot: React.FC<EvidenceScreenshotProps> = ({
  type = 'cart',
  url,
  variant = 'standard',
  highlightLabel,
  className = '',
  interactive = false
}) => {
  return (
    <div className={`relative border border-[#D6E0EA] rounded-lg overflow-hidden bg-white shadow-xs text-[#1B2B45] font-sans select-none ${className}`}>
      {/* Mock Browser Title Bar */}
      <div className="bg-[#F1F5F9] px-3 py-1.5 border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#5B6B82]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]"></div>
          <span className="ml-2 font-mono text-[11px] text-[#475569] truncate max-w-[220px]">
            https://freshcart-demo.store/{type}
          </span>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FA3]"></span>
          <span>Viewport 1440x900</span>
        </div>
      </div>

      {/* Render Real Screenshot if url exists, otherwise wireframe */}
      {url ? (
        <div className="bg-[#0F172A] p-2 min-h-[220px] flex items-center justify-center">
          <img
            src={url}
            alt={highlightLabel || 'Playwright Evidence Capture'}
            className="w-full h-auto object-contain max-h-[380px] rounded border border-slate-700 shadow-sm"
          />
        </div>
      ) : (
        <div className="p-4 bg-[#F8FAFC] min-h-[220px] flex flex-col justify-center">
          {type === 'cart' && (
          <div className="bg-white rounded border border-[#E2E8F0] p-3 max-w-sm mx-auto w-full text-xs">
            <div className="font-semibold text-sm pb-2 border-b border-[#F1F5F9] flex justify-between items-center">
              <span>FreshCart Bag (3 items)</span>
              <span className="text-[#5B6B82] text-[11px]">Bangalore North</span>
            </div>
            
            <div className="py-2 space-y-1.5 text-[#334155]">
              <div className="flex justify-between">
                <span>Aashirvaad Atta 5kg</span>
                <span className="tabular-nums font-mono font-medium">₹260</span>
              </div>
              <div className="flex justify-between">
                <span>Tata Sampann Toor Dal 1kg</span>
                <span className="tabular-nums font-mono font-medium">₹140</span>
              </div>
              <div className="flex justify-between">
                <span>Amul Butter 500g</span>
                <span className="tabular-nums font-mono font-medium">₹99</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
              <div className="flex justify-between text-[#5B6B82]">
                <span>Items Subtotal</span>
                <span className="tabular-nums font-mono">₹499</span>
              </div>

              {variant === 'before' ? (
                <div className="p-1.5 rounded bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-start gap-1.5 my-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Fee Concealed:</span> Cart total displays ₹499. ₹49 delivery fee withheld until payment step!
                  </div>
                </div>
              ) : (
                <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between my-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Standard Delivery Fee</span>
                  </div>
                  <span className="font-mono font-semibold tabular-nums">₹49</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-[#E2E8F0]">
                <span>Total Payable</span>
                <span className="tabular-nums font-mono text-[#102A56]">
                  {variant === 'before' ? '₹499' : '₹548'}
                </span>
              </div>
            </div>

            <button className="mt-3 w-full bg-[#102A56] text-white py-1.5 rounded text-xs font-medium hover:bg-[#183A73]">
              Proceed to Checkout
            </button>
          </div>
        )}

        {type === 'payment' && (
          <div className="bg-white rounded border border-[#E2E8F0] p-3 max-w-sm mx-auto w-full text-xs">
            <div className="font-semibold text-sm pb-1.5 border-b border-[#F1F5F9] flex justify-between items-center">
              <span>Checkout Payment Gateway</span>
              <span className="font-mono text-[11px] text-[#2F6FA3]">Order #FC-890241</span>
            </div>

            <div className="py-2 space-y-1.5 text-[#334155]">
              <div className="flex justify-between text-[#5B6B82]">
                <span>Cart Order Value</span>
                <span className="tabular-nums font-mono">₹499</span>
              </div>
              <div className="flex justify-between text-[#5B6B82]">
                <span>Delivery & Handling</span>
                <span className="tabular-nums font-mono">₹49</span>
              </div>

              {/* Basket sneaking box */}
              {variant === 'before' ? (
                <div className="p-2 bg-red-50 border border-dashed border-red-400 rounded my-1.5">
                  <div className="flex items-start gap-1.5 text-red-900 font-medium">
                    <input type="checkbox" checked readOnly className="mt-0.5 accent-red-600" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span>Donate ₹10 to Farmers Care</span>
                        <span className="font-mono tabular-nums">+₹10</span>
                      </div>
                      <div className="text-[10px] text-red-700 font-normal">
                        Pre-ticked without explicit consent (Basket sneaking violation)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded my-1.5">
                  <div className="flex items-start gap-1.5 text-[#334155]">
                    <input type="checkbox" className="mt-0.5 accent-[#2F6FA3]" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span>Donate ₹10 to Farmers Care (Optional)</span>
                        <span className="font-mono tabular-nums text-[#64748B]">+₹10</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Default state unticked
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-[#E2E8F0]">
                <span>Amount to Pay</span>
                <span className="tabular-nums font-mono text-[#102A56]">
                  {variant === 'before' ? '₹558' : '₹548'}
                </span>
              </div>
            </div>

            <button className="mt-2 w-full bg-[#1E7B53] text-white py-1.5 rounded text-xs font-medium hover:bg-[#166041]">
              Pay Now via UPI / Netbanking
            </button>
          </div>
        )}

        {type === 'urgency_product' && (
          <div className="bg-white rounded border border-[#E2E8F0] p-3 max-w-sm mx-auto w-full text-xs">
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-[#E2E8F0] rounded flex items-center justify-center text-[#64748B] text-xs font-mono shrink-0">
                Wheat Atta 5kg
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#102A56]">Aashirvaad Superior MP Atta</div>
                <div className="text-[#5B6B82] text-[11px] mb-1">100% Whole Wheat, Zero Maida</div>
                <div className="text-sm font-semibold tabular-nums font-mono">₹260 <span className="text-[#94A3B8] line-through font-normal text-xs">₹310</span></div>
                
                {/* False urgency alert */}
                <div className="mt-1.5 p-1.5 bg-red-50 border border-dashed border-red-500 rounded text-red-900 text-[11px]">
                  <div className="font-bold flex items-center gap-1 text-red-700">
                    <AlertCircle className="w-3 h-3" /> "Only 2 left in stock!"
                  </div>
                  <div className="text-[10px] text-red-600 mt-0.5">
                    Warehouse ERP audit: <span className="font-mono font-bold">178 units</span> available in distribution center.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex-1 bg-[#102A56] text-white py-1.5 rounded font-medium">Add to Cart</button>
              <button className="px-3 border border-[#CBD5E1] rounded text-[#475569]">Save</button>
            </div>
          </div>
        )}

        {type === 'cancellation_flow' && (
          <div className="bg-white rounded border border-[#E2E8F0] p-3 max-w-md mx-auto w-full text-xs">
            <div className="font-semibold text-xs pb-1.5 border-b border-[#F1F5F9] text-[#102A56]">
              Subscription Asymmetry Analysis (CP-04)
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                <div className="font-semibold text-emerald-900 text-[11px] mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Join FreshCart Plus
                </div>
                <div className="text-[11px] text-[#334155] bg-white p-1.5 rounded border border-emerald-100 mb-1">
                  Single click on home banner:
                </div>
                <div className="text-[10px] font-mono text-emerald-800 bg-emerald-100/50 p-1 rounded">
                  1-Click Instant Activation
                </div>
              </div>

              <div className="p-2 rounded bg-red-50 border border-dashed border-red-300">
                <div className="font-semibold text-red-900 text-[11px] mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600" /> Cancel Plus Membership
                </div>
                <div className="text-[10px] text-[#475569] space-y-1">
                  <div className="bg-white p-1 rounded border border-red-200">1. Hidden footer account link</div>
                  <div className="bg-white p-1 rounded border border-red-200">2. Mandatory 4-step survey</div>
                  <div className="bg-white p-1 rounded border border-red-200">3. Retention discount popup</div>
                  <div className="bg-white p-1 rounded border border-red-200 font-mono text-red-700">4. Type "CANCEL" in all-caps</div>
                </div>
                <div className="text-[10px] font-bold text-red-800 mt-1">
                  Total: 6 clicks across 4 screens
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'confirm_shaming' && (
          <div className="bg-white rounded border border-[#E2E8F0] p-3 max-w-sm mx-auto w-full text-xs">
            <div className="border border-red-300 rounded p-2.5 bg-red-50/50 relative">
              <div className="absolute top-2 right-2 text-red-400">
                <X className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-[#102A56] mb-1">
                Save ₹150 Every Month with Plus!
              </div>
              <p className="text-[11px] text-[#475569] mb-3">
                Enjoy unlimited free deliveries, exclusive flash pricing, and instant refunds on fresh dairy & staples.
              </p>

              <div className="space-y-2">
                <button className="w-full bg-[#102A56] text-white py-1.5 rounded text-xs font-semibold hover:bg-[#183A73]">
                  Yes, I want to save money!
                </button>
                
                {/* Guilt dismissal */}
                <div className="text-center pt-1 border border-dashed border-red-400 p-1.5 rounded bg-white">
                  <span className="text-[11px] text-[#64748B] underline cursor-pointer hover:text-red-700">
                    "No thanks, I like paying extra"
                  </span>
                  <div className="text-[10px] text-red-700 font-semibold mt-0.5">
                    CP-05 Confirm Shaming: Emotional guilt penalty
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'bug_counter' && (
          <div className="bg-white rounded border border-[#CBD5E1] p-3 max-w-sm mx-auto w-full text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <span className="font-semibold text-sm">Header Navigation State</span>
              <div className="flex items-center gap-2">
                <div className="relative p-1.5 bg-[#F1F5F9] rounded border border-[#E2E8F0]">
                  <ShoppingBag className="w-4 h-4 text-[#102A56]" />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#475569] text-white text-[9px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 p-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[#334155]">
              <div className="font-semibold text-xs text-[#334155] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#475569]" /> Classification: Likely Bug (D1)
              </div>
              <p className="text-[11px] text-[#5B6B82] mt-1">
                Line items in cart incremented to 4, but header badge displays stale value of 3. Evaluated as client state sync bug, zero consumer harm or deceptive intent.
              </p>
            </div>
          </div>
        )}

        {type === 'genuine_stock' && (
          <div className="bg-white rounded border border-[#E2E8F0] p-3 max-w-sm mx-auto w-full text-xs">
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-emerald-50 rounded flex items-center justify-center text-emerald-800 text-xs font-mono shrink-0 border border-emerald-200">
                Fresh Paneer 200g
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#102A56]">Fresh Malai Paneer 200g</div>
                <div className="text-sm font-semibold tabular-nums font-mono mt-0.5">₹85</div>
                
                {/* Verified stock badge */}
                <div className="mt-2 p-1.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-[11px]">
                  <div className="font-semibold flex items-center gap-1 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> "Only 2 left in stock!"
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    Warehouse check: <span className="font-mono font-bold">2 units available</span>. Scarcity claim verified genuine (Cleared).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Caption & Annotation Footer */}
      {highlightLabel && (
        <div className="px-3 py-1.5 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs">
          <div className="text-[11px] font-medium text-[#1B2B45] truncate">
            {highlightLabel}
          </div>
          <span className="text-[10px] font-mono text-[#5B6B82]">
            Evidence Frame #{type}
          </span>
        </div>
      )}
    </div>
  );
};
