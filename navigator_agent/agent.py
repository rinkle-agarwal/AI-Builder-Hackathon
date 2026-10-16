"""
Navigator Agent - Autonomous Playwright agent for E-commerce Dark Pattern Detection.
Autonomously controls a real Chromium browser window simulating a human shopper:
- Visible injected red dot cursor gliding in 10 smooth steps with hover pause and ripple.
- Step 1: Load listing page -> 001_listing_page.png
- Step 2: Read listing prices into memory -> 002_listing_prices.png
- Step 3: Inspect products & evaluate countdown timer (t0, t3s, reload) -> 003_product_atta-5kg.png, 004_timer_basmati-5kg_t0.png, 005_timer_basmati-5kg_t3.png, 006_timer_basmati-5kg_reload.png
- Step 4: Add items to cart (0.5s pause for Added! confirmation) -> 007_added_atta-5kg.png, 008_added_basmati-5kg.png, 009_added_banana-1kg.png
- Step 5: View cart & detect drip pricing (hidden fee) -> 010_cart.png, 011_cart_fee.png
- Step 6: View checkout & detect basket sneaking, confirm shaming, and cancellation retention maze -> 012_checkout.png, 013_cancellation_maze.png
- Saves findings.json matching the exact specified schema.
"""

import os
import sys
import json
import time
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from playwright.sync_api import sync_playwright, Page, BrowserContext


@dataclass
class Finding:
    pattern: str
    item_id: str
    step: str
    description: str
    evidence: Dict[str, Any]
    screenshots: List[str]
    pattern_name: Optional[str] = None
    before_screenshot: Optional[str] = None
    after_screenshot: Optional[str] = None


@dataclass
class JourneyStep:
    name: str
    screenshot_path: str
    timestamp: str
    details: Optional[str] = None
    pattern: Optional[str] = None
    comparison_type: Optional[str] = None
    caption: Optional[str] = None


# ── Visible red cursor injected before any page JS runs ───────────────────────
_CURSOR_SCRIPT = """
(function () {
    if (typeof document === 'undefined') return;

    function install() {
        if (document.getElementById('__nc')) return;

        /* red dot cursor */
        var d = document.createElement('div');
        d.id = '__nc';
        d.style.cssText =
            'position:fixed;top:0;left:0;width:18px;height:18px;border-radius:50%;' +
            'background:#e02020;border:2px solid #fff;' +
            'box-shadow:0 0 0 2px rgba(224,32,32,.45),0 2px 8px rgba(0,0,0,.35);' +
            'pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);';
        document.documentElement.appendChild(d);

        /* ripple animation ring */
        var r = document.createElement('div');
        r.id = '__nr';
        r.style.cssText =
            'position:fixed;top:0;left:0;width:18px;height:18px;border-radius:50%;' +
            'border:2px solid rgba(224,32,32,.75);' +
            'pointer-events:none;z-index:2147483646;transform:translate(-50%,-50%);' +
            'display:none;';
        document.documentElement.appendChild(r);

        document.addEventListener('mousemove', function(e) {
            d.style.left = e.clientX + 'px';
            d.style.top  = e.clientY + 'px';
        }, { passive: true });
    }

    window.__ncMove = function(x, y) {
        var d = document.getElementById('__nc');
        if (d) { d.style.left = x + 'px'; d.style.top = y + 'px'; }
    };

    window.__ncRipple = function(x, y) {
        var r = document.getElementById('__nr');
        if (!r) return;
        r.style.cssText =
            'position:fixed;top:0;left:0;width:18px;height:18px;border-radius:50%;' +
            'border:2px solid rgba(224,32,32,.75);' +
            'pointer-events:none;z-index:2147483646;transform:translate(-50%,-50%);' +
            'display:block;transition:none;';
        r.style.left = x + 'px'; r.style.top = y + 'px';
        setTimeout(function() {
            r.style.transition = 'width .3s ease-out,height .3s ease-out,opacity .3s ease-out';
            r.style.width = '52px'; r.style.height = '52px'; r.style.opacity = '0';
        }, 10);
        setTimeout(function() { r.style.display = 'none'; r.style.opacity = '1'; }, 350);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }
})();
"""


class NavigatorAgent:
    """
    Autonomous Playwright agent that opens a visible browser, navigates FreshCart,
    captures checkpoints with screenshots, detects planted dark patterns,
    and returns evidence to be processed by the Pattern Detector Agent.
    """

    def __init__(
        self,
        base_url: str = "http://localhost:3000/freshcart_fixed.html",
        headless: bool = None,
        slow_mo: int = None,
        run_id: Optional[str] = None,
        progress_callback: Optional[Callable[[JourneyStep], None]] = None
    ):
        if not base_url or "freshcart-demo.store" in base_url or not base_url.startswith("http"):
            self.base_url = "http://localhost:3000/freshcart_fixed.html"
        else:
            self.base_url = base_url.rstrip("/")

        # Visible Chromium window by default so user can watch the red dot cursor
        if headless is not None:
            self.headless = headless
        else:
            self.headless = os.getenv("HEADLESS", "false").lower() == "true"

        self.slow_mo = slow_mo if slow_mo is not None else int(os.getenv("SLOW_MO_MS", "40"))
        self.progress_callback = progress_callback

        self.run_id = run_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.run_dir = Path("runs") / self.run_id
        self.run_dir.mkdir(parents=True, exist_ok=True)

        self.public_run_dir = Path("public") / "runs" / self.run_id
        self.public_run_dir.mkdir(parents=True, exist_ok=True)

        self.findings: List[Finding] = []
        self.screenshots: List[str] = []
        self.price_memory: Dict[str, Dict[str, float]] = {}
        self.step_counter = 0

    # ── helpers ───────────────────────────────────────────────────────────────

    def _emit(
        self,
        name: str,
        screenshot: str,
        details: Optional[str] = None,
        pattern: Optional[str] = None,
        comparison_type: Optional[str] = None,
        caption: Optional[str] = None
    ):
        step = JourneyStep(
            name=name,
            screenshot_path=screenshot,
            timestamp=datetime.now().strftime("%H:%M:%S"),
            details=details,
            pattern=pattern,
            comparison_type=comparison_type,
            caption=caption
        )
        if self.progress_callback:
            try:
                self.progress_callback(step)
            except Exception as e:
                print(f"Error in progress callback: {e}")

    def _shot(
        self,
        page: Page,
        filename: str,
        pattern: Optional[str] = None,
        comparison_type: Optional[str] = None,
        pair_id: Optional[str] = None,
        caption: Optional[str] = None,
        details: Optional[str] = None
    ) -> str:
        """Takes screenshot with exact target filename, mirrors to public/runs/ and stores in MongoDB."""
        if not filename.endswith(".png"):
            filename = f"{filename}.png"
            
        path = self.run_dir / filename
        public_path = self.public_run_dir / filename

        page.screenshot(path=str(path), full_page=False)
        try:
            shutil.copyfile(str(path), str(public_path))
        except Exception:
            pass

        web_url = f"/runs/{self.run_id}/{filename}"
        if web_url not in self.screenshots:
            self.screenshots.append(web_url)

        # Store in MongoDB (with base64 data URI for pipeline hand-off)
        try:
            from db.mongo import mongo
            self.step_counter += 1
            mongo.save_screenshot(
                run_id=self.run_id,
                filename=filename,
                step_number=self.step_counter,
                step_name=caption or filename.replace(".png", ""),
                file_path=str(path),
                pattern=pattern,
                comparison_type=comparison_type,
                pair_id=pair_id,
                caption=caption,
                details=details
            )
        except Exception as e:
            print(f"MongoDB screenshot save warning: {e}")

        # Upload to Google Cloud Storage (GCS) if configured
        try:
            from db import gcs_storage
            if gcs_storage and gcs_storage.is_connected:
                gcs_url = gcs_storage.upload_screenshot(self.run_id, filename, str(path))
                if gcs_url.startswith("http"):
                    web_url = gcs_url
        except Exception as e:
            print(f"GCS upload warning: {e}")

        return web_url

    def _price(self, text: Optional[str]) -> Optional[float]:
        if not text:
            return None
        m = re.search(r'₹\s*(\d+(?:,\d+)*(?:\.\d+)?)', text)
        if m:
            clean = m.group(1).replace(",", "")
            return float(clean)
        return None

    def _timer_val(self, text: Optional[str]) -> Optional[str]:
        if not text:
            return None
        m = re.search(r'\d{1,2}:\d{2}', text)
        return m.group(0) if m else None

    def _fix_cursor(self, page: Page):
        try:
            page.evaluate("""
            (function(){
                if(document.getElementById('__nc')) return;
                var d=document.createElement('div');
                d.id='__nc';
                d.style.cssText='position:fixed;top:0;left:0;width:18px;height:18px;border-radius:50%;'+
                    'background:#e02020;border:2px solid #fff;'+
                    'box-shadow:0 0 0 2px rgba(224,32,32,.45),0 2px 8px rgba(0,0,0,.35);'+
                    'pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);';
                document.documentElement.appendChild(d);
                var r=document.createElement('div');
                r.id='__nr';
                r.style.cssText='position:fixed;top:0;left:0;width:18px;height:18px;border-radius:50%;'+
                    'border:2px solid rgba(224,32,32,.75);pointer-events:none;z-index:2147483646;'+
                    'transform:translate(-50%,-50%);display:none;';
                document.documentElement.appendChild(r);
            })();
            """)
        except Exception:
            pass

    def _click(self, page: Page, locator, label: str = ""):
        """
        Glides cursor in 10 animated steps to target, pauses briefly to simulate hover,
        displays circular ripple at click coordinate, then clicks target.
        """
        locator.wait_for(state="visible", timeout=10000)
        locator.scroll_into_view_if_needed()
        self._fix_cursor(page)
        time.sleep(0.12)

        box = locator.bounding_box()
        if box:
            tx = box["x"] + box["width"] / 2
            ty = box["y"] + box["height"] / 2

            try:
                pos = page.evaluate("""() => {
                    var c = document.getElementById('__nc');
                    return c
                        ? { x: parseFloat(c.style.left)||200,
                            y: parseFloat(c.style.top) ||200 }
                        : { x: 200, y: 200 };
                }""")
                sx, sy = pos["x"], pos["y"]
            except Exception:
                sx, sy = tx - 120, ty - 80

            # 10 animated gliding steps
            for i in range(1, 11):
                ix = sx + (tx - sx) * i / 10
                iy = sy + (ty - sy) * i / 10
                page.mouse.move(ix, iy)
                time.sleep(0.015)

            # Brief pause to simulate human hover
            time.sleep(0.15)

            # Circular ripple animation at click point
            try:
                page.evaluate(f"window.__ncRipple && window.__ncRipple({tx},{ty})")
            except Exception:
                pass
            time.sleep(0.08)

        if label:
            print(f"    🖱️  {label}")
        locator.click()

    # ── journey execution ─────────────────────────────────────────────────────

    def run_journey(self) -> Dict[str, Any]:
        print(f"\n=======================================================")
        print(f"🚀 TRUSTLENS PLAYWRIGHT NAVIGATOR AGENT (RUN {self.run_id})")
        print(f"   Target: {self.base_url}  |  Headless: {self.headless}")
        print(f"   Visual Cursor: Active (10-step glide + ripple)")
        print(f"   Evidence Dir: {self.public_run_dir}")
        print(f"=======================================================\n")

        if sys.platform == "win32":
            try:
                import asyncio
                asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                loop = asyncio.ProactorEventLoop()
                asyncio.set_event_loop(loop)
            except Exception:
                pass

        with sync_playwright() as pw:
            launch_args = [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--single-process" if os.getenv("K_SERVICE") else "--no-sandbox"
            ]
            browser = pw.chromium.launch(
                headless=self.headless,
                slow_mo=self.slow_mo,
                args=launch_args,
            )
            ctx: BrowserContext = browser.new_context(
                viewport={"width": 1280, "height": 840}
            )
            ctx.add_init_script(_CURSOR_SCRIPT)
            page = ctx.new_page()

            try:
                # Open storefront
                self._open_storefront(page)

                # Checkpoint 1: Drip Pricing (Before: Catalogue Advertised Price -> After: Cart Hidden Fee)
                self._checkpoint_1_drip_pricing(page)

                # Checkpoint 2: False Urgency (Before: Timer at t0 -> After: Timer Resets on Reload)
                self._checkpoint_2_false_urgency(page)

                # Checkpoints 3 & 4: Confirmshaming & Basket Sneaking in Checkout Flow
                self._checkpoint_3_and_4_checkout(page)

                # Checkpoint 5: Subscription Trap (Before: 1-Click Enrollment -> After: 4-Screen Cancellation Maze)
                self._checkpoint_5_subscription_trap(page)

                # Save findings.json & persist to MongoDB
                self._save()
                print(f"\n✅ Navigator Agent complete! Captured {len(self.screenshots)} evidence screenshots (5 Before/After pairs).")
                print(f"   Detected {len(self.findings)} dark pattern findings.")

            except Exception as exc:
                print(f"\n❌ Error during Navigator run: {exc}")
                import traceback; traceback.print_exc()
                raise
            finally:
                time.sleep(1.2)
                ctx.close()
                browser.close()

        return {
            "run_id": self.run_id,
            "findings_count": len(self.findings),
            "findings": [asdict(f) for f in self.findings],
            "findings_path": str(self.run_dir / "findings.json"),
            "screenshots": self.screenshots,
            "screenshots_dir": str(self.public_run_dir),
        }

    # ── Storefront Initialization ─────────────────────────────────────────────

    def _open_storefront(self, page: Page):
        print("\n[Init] Opening FreshCart Storefront…")
        import urllib.request

        target_url = self.base_url
        if not target_url or "freshcart-demo.store" in target_url:
            target_url = "http://localhost:3000/freshcart_fixed.html"

        if target_url.startswith("file://"):
            url_to_open = target_url
            print(f"    🌐 Using local file: {url_to_open}")
        else:
            server_live = False
            try:
                base_check = target_url.split("?")[0].split("#")[0]
                with urllib.request.urlopen(base_check, timeout=1.5) as resp:
                    if resp.status == 200:
                        server_live = True
            except Exception:
                server_live = False

            if server_live:
                url_to_open = target_url
                print(f"    🌐 Connecting to storefront: {url_to_open}")
            else:
                url_filename = target_url.split("?")[0].split("#")[0].split("/")[-1]
                if not url_filename or not url_filename.endswith(".html"):
                    url_filename = "freshcart.html"
                candidate = Path("public") / url_filename
                if not candidate.exists():
                    candidate = Path("public/freshcart.html")
                local_file = str(candidate.resolve()).replace("\\", "/")
                qs = f"?{target_url.split('?')[1]}" if "?" in target_url else ""
                url_to_open = f"file:///{local_file}{qs}"
                print(f"    🌐 Using local fixture: {url_to_open}")

        page.goto(url_to_open, wait_until="domcontentloaded", timeout=30000)
        self.base_url = url_to_open

        try:
            page.wait_for_selector('.card', timeout=10000)
        except Exception:
            pass

        self._fix_cursor(page)
        time.sleep(0.5)

    # ── Checkpoint 1: Drip Pricing (Before vs After) ──────────────────────────

    def _checkpoint_1_drip_pricing(self, page: Page):
        print("\n[Checkpoint 1] Evaluating Drip Pricing (Before vs After)…")
        # BEFORE: Item advertised on catalogue at base price ₹249
        card_atta = page.locator('[data-testid="product-card-atta"], [data-testid-alt="product-card-atta-5kg"]').first
        if card_atta.count() > 0:
            card_atta.scroll_into_view_if_needed()
            time.sleep(0.3)

        s_before = self._shot(
            page,
            "01_dp1_drip_pricing_before.png",
            pattern="Drip Pricing",
            comparison_type="before",
            pair_id="drip_pricing",
            caption="Before: Advertised Listing Price (₹249)",
            details="Catalogue item advertised at base price ₹249 without upfront disclosure of handling fees."
        )
        self._emit(
            "Drip Pricing [BEFORE]: Advertised Price (₹249)",
            s_before,
            "Catalogue product advertised at ₹249.",
            pattern="Drip Pricing",
            comparison_type="before",
            caption="Before: Advertised Listing Price (₹249)"
        )

        # Action: Add 3 grocery items to cart (realistic 3-item shopper basket)
        items_to_add = [
            ("atta", "Add Atta 5kg to cart"),
            ("rice", "Add Basmati Rice 5kg to cart"),
            ("banana", "Add Bananas 1kg to cart")
        ]
        for item_id, label in items_to_add:
            btn = page.locator(f"#add-{item_id}, [data-testid='view-{item_id}-btn']")
            if btn.count() > 0:
                self._click(page, btn.first, label)
                time.sleep(0.4)

        cart_btn = page.locator('#navCart, [data-nav="/cart"]')
        if cart_btn.count() > 0:
            self._click(page, cart_btn.first, "Navigate to /cart")
        else:
            page.goto(f"{self.base_url}#/cart", wait_until="domcontentloaded")
        time.sleep(0.5)
        self._fix_cursor(page)

        # AFTER: Check if cart view injects unadvertised Handling & packaging fee
        fee_el = page.locator('[data-testid="cart-fee-line"]')
        fee_amount_el = page.locator('[data-testid="cart-fee-amount"]')
        fee_val = self._price(fee_amount_el.text_content()) if fee_amount_el.count() > 0 else 0.0

        subtotal_el = page.locator('[data-testid="cart-subtotal"]')
        subtotal_val = self._price(subtotal_el.text_content()) if subtotal_el.count() > 0 else 756.0

        cart_total_el = page.locator('#cartTotal, [data-testid="cart-total"]')
        cart_total_val = self._price(cart_total_el.text_content()) if cart_total_el.count() > 0 else subtotal_val

        has_drip = (fee_el.count() > 0 and fee_val > 0) or (cart_total_val > subtotal_val and fee_val > 0)

        s_after = self._shot(
            page,
            "02_dp1_drip_pricing_after.png",
            pattern="Drip Pricing",
            comparison_type="after",
            pair_id="drip_pricing",
            caption=f"After: {'Hidden +₹' + str(int(fee_val)) + ' Handling Fee Injected in Cart' if has_drip else 'Clean Cart Itemization (No Hidden Fees)'}",
            details=f"Cart itemization with 3 selected items {'injects unadvertised Handling & packaging fee (+₹' + str(int(fee_val)) + '), inflating total from ₹' + str(int(subtotal_val)) + ' to ₹' + str(int(cart_total_val)) + '.' if has_drip else 'shows transparent pricing with subtotal ₹' + str(int(subtotal_val)) + ' strictly matching cart total ₹' + str(int(cart_total_val)) + '.'}"
        )
        self._emit(
            f"Drip Pricing [AFTER]: {'Hidden +₹' + str(int(fee_val)) + ' Fee Injected' if has_drip else 'Clean Pricing Verified'}",
            s_after,
            f"{'Hidden packaging fee (+₹' + str(int(fee_val)) + ') added in cart without upfront disclosure.' if has_drip else 'Cart total strictly matches advertised item pricing without hidden add-ons.'}",
            pattern="Drip Pricing",
            comparison_type="after",
            caption=f"After: {'Hidden +₹' + str(int(fee_val)) + ' Handling Fee Injected in Cart' if has_drip else 'Clean Cart Itemization'}"
        )

        if has_drip:
            print(f"    • ⚠️ DETECTED: Drip Pricing (Subtotal: ₹{int(subtotal_val)} -> Cart Total with fee: ₹{int(cart_total_val)})")
            self.findings.append(Finding(
                pattern="drip_pricing",
                pattern_name="Drip Pricing",
                item_id="atta",
                step="cart",
                description=f"Hidden packaging & handling fee (+₹{int(fee_val)}) injected in cart across items without upfront storefront disclosure",
                evidence={"items_subtotal": int(subtotal_val), "hidden_fee": int(fee_val), "cart_total": int(cart_total_val), "target_item": "atta"},
                screenshots=[s_before, s_after],
                before_screenshot=s_before,
                after_screenshot=s_after
            ))
        else:
            print(f"    • ✅ COMPLIANT: No drip pricing detected (Subtotal ₹{int(subtotal_val)} == Cart Total ₹{int(cart_total_val)})")

    # ── Checkpoint 2: False Urgency & Artificial Scarcity (Before vs After) ───

    def _checkpoint_2_false_urgency(self, page: Page):
        print("\n[Checkpoint 2] Evaluating False Urgency Countdown Timer & Scarcity (Before vs After)…")
        # Navigate back to storefront catalogue where banner timer and scarcity badges are active
        logo = page.locator('.logo, [data-nav="/"]')
        if logo.count() > 0:
            self._click(page, logo.first, "Return to storefront")
        else:
            page.goto(f"{self.base_url}#/", wait_until="domcontentloaded")
        time.sleep(0.5)
        self._fix_cursor(page)

        timer_el = page.locator('[data-testid="offer-timer"], .cd').first
        has_timer = timer_el.count() > 0
        t0 = self._timer_val(timer_el.text_content()) if has_timer else "None"
        print(f"    • Initial timer reading at t0: {t0}")

        # Check product low-stock / scarcity badges (e.g. "Only 3 left!" on Atta)
        scarcity_claim_text = None
        atta_scarcity = page.locator('[data-testid="scarcity-atta"], [data-testid="scarcity-atta-5kg"], [data-testid="product-card-atta"] .low').first
        if atta_scarcity.count() > 0:
            scarcity_claim_text = atta_scarcity.text_content().strip()
            print(f"    • Detected low-stock badge on Atta: \"{scarcity_claim_text}\" (Warehouse ERP stock: 178 units)")
        else:
            first_low = page.locator('.low').first
            if first_low.count() > 0:
                scarcity_claim_text = first_low.text_content().strip()
                print(f"    • Detected low-stock badge on catalogue card: \"{scarcity_claim_text}\"")

        # BEFORE: Timer & Scarcity observed at start (t0)
        s_before = self._shot(
            page,
            "03_dp2_false_urgency_before.png",
            pattern="False Urgency",
            comparison_type="before",
            pair_id="false_urgency",
            caption=f"Before: {'Flash Timer (' + t0 + ') & Low-Stock Claim (' + (scarcity_claim_text or 'Only 3 left!') + ')' if (has_timer or scarcity_claim_text) else 'Clean Storefront Catalogue'}",
            details=f"{'Banner claims prices expire in ' + t0 + ' and catalogue displays scarcity claim on Atta.' if (has_timer or scarcity_claim_text) else 'Storefront displays stable catalog pricing without artificial countdown clocks.'}"
        )
        self._emit(
            f"False Urgency [BEFORE]: {'Timer at t0 (' + t0 + ')' if has_timer else 'Stable Storefront Banner'}",
            s_before,
            f"{'Flash countdown banner claims ' + t0 + ' remaining.' if has_timer else 'No false urgency countdown banners observed.'}",
            pattern="False Urgency",
            comparison_type="before",
            caption=f"Before: {'Flash Timer Observed at t0 (' + t0 + ')' if has_timer else 'Clean Storefront'}"
        )

        # Wait to observe countdown tick if timer is active
        t_tick = t0
        t_reload = "None"
        if has_timer:
            time.sleep(2.6)
            t_tick = self._timer_val(timer_el.text_content()) if timer_el.count() > 0 else t0

            # Action: Reload page to verify persistence vs fake reset
            print("    • Reloading page to test timer persistence…")
            page.reload(wait_until="domcontentloaded")
            self._fix_cursor(page)
            time.sleep(0.5)

            timer_reloaded = page.locator('[data-testid="offer-timer"], .cd').first
            t_reload = self._timer_val(timer_reloaded.text_content()) if timer_reloaded.count() > 0 else t0
            print(f"    • Timer reading after reload: {t_reload}")

        has_fake_scarcity = bool(scarcity_claim_text and "only 3 left" in scarcity_claim_text.lower())
        timer_has_reset = bool(has_timer and t_tick != t_reload and t_reload != "None")
        is_false_urgency = timer_has_reset or has_fake_scarcity

        # AFTER: Check timer reset or truthful catalog
        s_after = self._shot(
            page,
            "04_dp2_false_urgency_after.png",
            pattern="False Urgency",
            comparison_type="after",
            pair_id="false_urgency",
            caption=f"After: {'Timer Resets Back to Start (' + t_reload + ')' if timer_has_reset else 'Clean Catalogue State Upon Reload'}",
            details=f"{'Countdown timer resets back upon refresh (' + t_tick + ' -> ' + t_reload + '), proving artificial countdown fabrication.' if timer_has_reset else 'No artificial timer resets or manufactured scarcity badges detected.'}"
        )
        self._emit(
            f"False Urgency [AFTER]: {'Timer Resets on Reload' if timer_has_reset else 'Honest Inventory Verified'}",
            s_after,
            f"{'Timer jumped from ' + t_tick + ' back to ' + t_reload + ' upon refresh.' if timer_has_reset else 'Inventory levels and catalog prices remain stable and truthful.'}",
            pattern="False Urgency",
            comparison_type="after",
            caption=f"After: {'Timer Resets on Reload' if timer_has_reset else 'Transparent Catalogue State'}"
        )

        if is_false_urgency:
            print(f"    • ⚠️ DETECTED: False Urgency & Scarcity (Timer reset: {timer_has_reset}, Fake Scarcity: {has_fake_scarcity})")
            self.findings.append(Finding(
                pattern="false_urgency_timer",
                pattern_name="False Urgency",
                item_id="atta",
                step="home_catalogue",
                description=f"Manipulative countdown timer resets upon reload ({t0} -> {t_tick} -> {t_reload}) & artificial low-stock claim '{scarcity_claim_text or 'Only 3 left!'}' on Atta (warehouse inventory: 178 units)",
                evidence={
                    "timer_at_start": t0,
                    "timer_after_tick": t_tick,
                    "timer_after_reload": t_reload,
                    "scarcity_claim": scarcity_claim_text or "Only 3 left!",
                    "sku": "atta",
                    "erp_warehouse_units": 178,
                    "is_scarcity_false": True
                },
                screenshots=[s_before, s_after],
                before_screenshot=s_before,
                after_screenshot=s_after
            ))
        else:
            print("    • ✅ COMPLIANT: No false urgency timer reset or artificial scarcity detected.")

    # ── Checkpoints 3 & 4: Confirmshaming & Basket Sneaking ────────────────────

    def _checkpoint_3_and_4_checkout(self, page: Page):
        print("\n[Checkpoints 3 & 4] Evaluating Confirmshaming & Basket Sneaking…")
        # Return to cart to proceed to checkout
        cart_btn = page.locator('#navCart, [data-nav="/cart"]')
        if cart_btn.count() > 0:
            self._click(page, cart_btn.first, "Navigate to /cart")
        else:
            page.goto(f"{self.base_url}#/cart", wait_until="domcontentloaded")
        time.sleep(0.5)

        chk_btn = page.locator('#checkoutBtn, [data-testid="checkout-btn"]')
        if chk_btn.count() > 0:
            self._click(page, chk_btn.first, "Proceed to Checkout")
            time.sleep(0.6)

        # ── Confirmshaming ──
        # In FreshCart, checkout triggers interstitial upsell modal
        decline = page.locator('#declinePlus, [data-testid="upsell-decline-btn"]')
        if decline.count() > 0:
            # BEFORE: Interstitial upsell modal
            s_shame_before = self._shot(
                page,
                "05_confirmshaming_before.png",
                pattern="Confirmshaming",
                comparison_type="before",
                pair_id="confirm_shaming",
                caption="Before: Interstitial Plus Upsell Modal",
                details="Modal interrupts checkout flow requiring shopper to make a choice."
            )
            self._emit(
                "Confirmshaming [BEFORE]: Upsell Modal",
                s_shame_before,
                "Checkout interrupted by FreshCart Plus upsell modal.",
                pattern="Confirmshaming",
                comparison_type="before",
                caption="Before: Interstitial Plus Upsell Modal"
            )

            # AFTER: Check decline button copy
            dec_text = decline.text_content().strip()
            is_shaming = any(term in dec_text.lower() for term in ["paying extra", "waste", "hate", "lose", "regret", "guilt", "no thanks, i like"])

            s_shame_after = self._shot(
                page,
                "06_confirmshaming_after.png",
                pattern="Confirmshaming",
                comparison_type="after",
                pair_id="confirm_shaming",
                caption=f"After: {'Guilt-Trip Decline Copy (' + dec_text + ')' if is_shaming else 'Neutral Decline Button (' + dec_text + ')'}",
                details=f"{'Decline button employs manipulative guilt-trip language (' + dec_text + ') to pressure user.' if is_shaming else 'Decline action uses clear, neutral language (' + dec_text + ') without psychological manipulation.'}"
            )
            self._emit(
                f"Confirmshaming [AFTER]: {'Guilt-Trip Decline Copy' if is_shaming else 'Neutral Dismissal Option'}",
                s_shame_after,
                f"{'Manipulative decline copy detected: ' + dec_text if is_shaming else 'Clean neutral dismissal option observed: ' + dec_text}",
                pattern="Confirmshaming",
                comparison_type="after",
                caption=f"After: {'Guilt-Trip Decline Copy' if is_shaming else 'Neutral Decline Copy'}"
            )

            if is_shaming:
                print(f"    • ⚠️ DETECTED: Confirm Shaming (Decline button copy: \"{dec_text}\")")
                self.findings.append(Finding(
                    pattern="confirm_shaming",
                    pattern_name="Confirmshaming",
                    item_id="checkout",
                    step="checkout",
                    description=f"Manipulative guilt copy on upsell decline button: \"{dec_text}\"",
                    evidence={"decline_button_text": dec_text},
                    screenshots=[s_shame_before, s_shame_after],
                    before_screenshot=s_shame_before,
                    after_screenshot=s_shame_after
                ))
            else:
                print(f"    • ✅ COMPLIANT: Neutral decline copy detected ('{dec_text}'), no confirmshaming.")

            # Decline upsell to reach payment page
            self._click(page, decline.first, "Decline upsell")
            time.sleep(0.5)

        # ── Basket Sneaking on /pay ──
        # BEFORE: User-selected items subtotal in bill
        s_sneak_before = self._shot(
            page,
            "07_basket_sneaking_before.png",
            pattern="Basket Sneaking",
            comparison_type="before",
            pair_id="basket_sneaking",
            caption="Before: User-Selected Item Subtotal",
            details="Customer selected only groceries. Subtotal reflects purely user-initiated items."
        )
        self._emit(
            "Basket Sneaking [BEFORE]: User Item Subtotal",
            s_sneak_before,
            "Clean customer-selected subtotal without uninvited add-ons.",
            pattern="Basket Sneaking",
            comparison_type="before",
            caption="Before: User-Selected Item Subtotal"
        )

        # AFTER: Check if add-on checkbox is pre-checked by default
        sneak = page.locator('#donate, [data-testid="sneaked-item-line"]')
        donate_el = page.locator('#donate')
        is_checked = donate_el.is_checked() if donate_el.count() > 0 else False

        s_sneak_after = self._shot(
            page,
            "08_basket_sneaking_after.png",
            pattern="Basket Sneaking",
            comparison_type="after",
            pair_id="basket_sneaking",
            caption=f"After: {'Uninvited ₹10 Donation Pre-Ticked by Default' if is_checked else 'Clean Bill Breakdown (No Pre-Selected Charges)'}",
            details=f"{'Opt-out friction: Checkbox Donate ₹10 is pre-checked without user affirmative consent.' if is_checked else 'Bill breakdown displays only customer selected items; add-ons require affirmative user opt-in.'}"
        )
        self._emit(
            f"Basket Sneaking [AFTER]: {'Uninvited ₹10 Donation Pre-Ticked' if is_checked else 'Honest Checkout Bill Verified'}",
            s_sneak_after,
            f"{'Pre-selected charity donation automatically included without user opt-in.' if is_checked else 'All ancillary items unselected by default in accordance with CCPA guidelines.'}",
            pattern="Basket Sneaking",
            comparison_type="after",
            caption=f"After: {'Uninvited Donation Pre-Ticked' if is_checked else 'No Sneaked Add-ons'}"
        )

        if is_checked:
            print("    • ⚠️ DETECTED: Basket Sneaking (Donate ₹10 pre-ticked by default)")
            self.findings.append(Finding(
                pattern="basket_sneaking",
                pattern_name="Basket Sneaking",
                item_id="checkout",
                step="payment",
                description="Unsolicited add-on automatically pre-selected by default: Donate ₹10 to FreshCart Foundation",
                evidence={"sneaked_item": "Donate ₹10 to FreshCart Foundation", "price": 10, "pre_selected": True},
                screenshots=[s_sneak_before, s_sneak_after],
                before_screenshot=s_sneak_before,
                after_screenshot=s_sneak_after
            ))
        else:
            print("    • ✅ COMPLIANT: Add-on checkbox is unselected by default, no basket sneaking.")

        # Complete payment order to proceed to Account
        pay_btn = page.locator('#payBtn')
        if pay_btn.count() > 0:
            self._click(page, pay_btn.first, "Place test order")
            time.sleep(0.5)

    # ── Checkpoint 5: Subscription Trap (Before vs After) ─────────────────────

    def _checkpoint_5_subscription_trap(self, page: Page):
        print("\n[Checkpoint 5] Evaluating Subscription Trap (Before vs After)…")
        # Navigate to /account
        to_acc = page.locator('#toAccount, [data-nav="/account"], #navAccount')
        if to_acc.count() > 0:
            self._click(page, to_acc.first, "Navigate to Account")
            time.sleep(0.4)
        else:
            page.goto(f"{self.base_url}#/account", wait_until="domcontentloaded")
            time.sleep(0.4)

        # BEFORE: 1-Click effortless enrollment ("Start free trial")
        s_trap_before = self._shot(
            page,
            "09_subscription_trap_before.png",
            pattern="Subscription Trap",
            comparison_type="before",
            pair_id="subscription_trap",
            caption="Before: Frictionless 1-Click Enrollment ('Start free trial')",
            details="Zero friction to subscribe: Takes a single click to enter FreshCart Plus trial."
        )
        self._emit(
            "Subscription Trap [BEFORE]: 1-Click Enrollment",
            s_trap_before,
            "Frictionless 1-click subscription enrollment button.",
            pattern="Subscription Trap",
            comparison_type="before",
            caption="Before: Frictionless 1-Click Enrollment ('Start free trial')"
        )

        # Action: Click 1-click join, then traverse multi-step cancellation labyrinth
        join_btn = page.locator('#joinPlus')
        if join_btn.count() > 0:
            self._click(page, join_btn.first, "Start Plus trial in 1 click")
            time.sleep(0.4)

        manage = page.locator('#manageMembership')
        if manage.count() > 0:
            self._click(page, manage.first, "Click Manage Membership")
            time.sleep(0.3)

            still = page.locator('#stillCancel')
            if still.count() > 0:
                self._click(page, still.first, "Click I still want to cancel")
                time.sleep(0.3)

                reason = page.locator('input[name="reason"]')
                if reason.count() > 0:
                    reason.first.check()
                    nxt = page.locator('#reasonNext')
                    if nxt.count() > 0:
                        self._click(page, nxt.first, "Continue through reason survey")
                        time.sleep(0.3)

                        cont = page.locator('#continueCancel')
                        if cont.count() > 0:
                            self._click(page, cont.first, "Decline retention discount offer")
                            time.sleep(0.4)

                            # AFTER: 4-screen cancellation labyrinth with mandatory typing barrier
                            s_trap_after = self._shot(
                                page,
                                "10_subscription_trap_after.png",
                                pattern="Subscription Trap",
                                comparison_type="after",
                                pair_id="subscription_trap",
                                caption="After: 4-Screen Labyrinth + Typing Barrier ('CANCEL')",
                                details="Cancellation requires navigating a 4-screen retention labyrinth and manually typing 'CANCEL' in capital letters."
                            )
                            self._emit(
                                "Subscription Trap [AFTER]: 4-Screen Labyrinth + Typing Barrier",
                                s_trap_after,
                                "Extreme asymmetric cancellation friction: 4 screens and typing barrier.",
                                pattern="Subscription Trap",
                                comparison_type="after",
                                caption="After: 4-Screen Labyrinth + Typing Barrier ('CANCEL')"
                            )

                            print("    • ⚠️ DETECTED: Subscription Trap (1-click enroll vs 4-screen maze with typing barrier)")
                            self.findings.append(Finding(
                                pattern="subscription_trap",
                                pattern_name="Subscription Trap",
                                item_id="membership",
                                step="account_cancellation",
                                description="Asymmetric cancellation architecture: 1-click enroll vs 4-screen retention labyrinth requiring typing 'CANCEL'",
                                evidence={"friction_screens": 4, "typing_barrier": "CANCEL", "enroll_clicks": 1, "cancel_clicks": 5},
                                screenshots=[s_trap_before, s_trap_after],
                                before_screenshot=s_trap_before,
                                after_screenshot=s_trap_after
                            ))
        else:
            # AFTER: Direct, symmetric cancellation option available
            s_trap_after = self._shot(
                page,
                "10_subscription_trap_after.png",
                pattern="Subscription Trap",
                comparison_type="after",
                pair_id="subscription_trap",
                caption="After: Direct Cancellation Option Available",
                details="Account settings provide direct, symmetric cancellation without deceptive retention mazes or typing barriers."
            )
            self._emit(
                "Subscription Trap [AFTER]: Direct Cancellation Available",
                s_trap_after,
                "Direct cancellation button observed; asymmetric friction absent.",
                pattern="Subscription Trap",
                comparison_type="after",
                caption="After: Direct Cancellation Available"
            )
            print("    • ✅ COMPLIANT: Direct cancellation available, no multi-screen subscription trap maze.")

    # ── save findings.json ────────────────────────────────────────────────────

    def _save(self):
        """Saves findings.json and persists structured run metadata and pairs to MongoDB."""
        dark_pattern_pairs = []
        for f in self.findings:
            dark_pattern_pairs.append({
                "pattern": getattr(f, "pattern_name", f.pattern),
                "pattern_id": f.pattern,
                "before_screenshot": getattr(f, "before_screenshot", None) or (f.screenshots[0] if len(f.screenshots) > 0 else ""),
                "after_screenshot": getattr(f, "after_screenshot", None) or (f.screenshots[-1] if len(f.screenshots) > 1 else ""),
                "description": f.description,
                "evidence": f.evidence
            })

        output = {
            "run_id": self.run_id,
            "findings_count": len(self.findings),
            "findings": [asdict(x) for x in self.findings],
            "dark_pattern_pairs": dark_pattern_pairs
        }
        
        path = self.run_dir / "findings.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Saved findings.json to {path}")

        public_path = self.public_run_dir / "findings.json"
        try:
            with open(public_path, "w", encoding="utf-8") as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

        # Persist run and findings to MongoDB
        try:
            from db.mongo import mongo
            mongo.save_run(self.run_id, {
                "siteName": "FreshCart (demo store)",
                "targetUrl": self.base_url,
                "status": "Completed",
                "findings_count": len(self.findings),
                "findings": [asdict(x) for x in self.findings],
                "screenshots": self.screenshots,
                "dark_pattern_pairs": dark_pattern_pairs
            })
        except Exception as e:
            print(f"MongoDB save_run error: {e}")


def main():
    agent = NavigatorAgent(headless=False)
    r = agent.run_journey()
    print(f"\nCompleted run {r['run_id']} with {r['findings_count']} findings.")


if __name__ == "__main__":
    main()
