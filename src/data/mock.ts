import { CCPAPatternInfo, ReleaseMarker, TestRun, Finding, EvidenceWireframe, AgentStage, StageLog, PatternComparisonSummary } from '../types';

export const CCPA_PATTERNS_CATALOG: CCPAPatternInfo[] = [
  {
    id: 'CP-01',
    name: 'Drip pricing',
    definition: 'Hiding or not revealing elements of the total price upfront, only revealing additional charges at final checkout stages after consumer commitment.',
    testedByTrustLens: true,
    officialClause: 'Section 5(1), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 3',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), Ministry of Consumer Affairs, Food & Public Distribution, New Delhi',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Drip pricing means a practice whereby elements of prices are not revealed upfront or at the start of the consumption cycle or features thereof are revealed surreptitiously at subsequent steps before confirmation of purchase, or where a price is presented as a lump sum without itemization of mandatory fees until the final payment step.',
    enforcementPrecedents: 'The CCPA imposed a penalty of ₹7 lakh on Zepto for delivery and handling fees disclosed only at checkout and pre-selected loyalty memberships.',
    commonOccurrence: 'Checkout total jumping due to unexpected packaging, handling, or platform surge fees not stated in the cart.'
  },
  {
    id: 'CP-02',
    name: 'Basket sneaking',
    definition: 'Inclusion of additional items, services, products, or donations to shopping cart or bill without explicit consumer consent, such as pre-checked boxes.',
    testedByTrustLens: true,
    officialClause: 'Section 5(2), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 4',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Basket sneaking means the inclusion of additional items such as products, services, payments to charity/donation, or fees at the time of checkout from a platform, without the express consent of the user, such that the amount payable is higher than the amount for products selected by the user.',
    enforcementPrecedents: 'State Consumer Disputes Redressal Commission ruled against a major ticketing portal for pre-checking ₹10 charity donations during booking flows.',
    commonOccurrence: 'Pre-ticked opt-ins for tip, donation, carbon offset, or warranty add-ons.'
  },
  {
    id: 'CP-03',
    name: 'False urgency',
    definition: 'Falsely stating or implying a sense of urgency, fake scarcity, or countdown pressure to nudge consumers into an immediate purchase decision.',
    testedByTrustLens: true,
    officialClause: 'Section 5(3), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 1',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'False urgency means the practice of falsely stating or implying the sense of urgency or scarcity to mislead a user into making an immediate purchase or taking an immediate action, including creating artificial countdown timers or displaying non-factual stock limits.',
    enforcementPrecedents: 'CCPA advisory issued against travel booking engines showing "Only 1 room left at this price!" when warehouse inventory or room blocks showed abundant availability.',
    commonOccurrence: 'Artificial "Only 2 left in stock!" labels when ERP inventory is high, or reset-loop countdown clocks.'
  },
  {
    id: 'CP-04',
    name: 'Subscription trap',
    definition: 'Making cancellation of a paid subscription or recurring service substantially more difficult, convoluted, or hidden than signing up.',
    testedByTrustLens: true,
    officialClause: 'Section 5(4), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 8',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Subscription trap means the process of making cancellation of a paid subscription impossible or a complex, lengthy, and convoluted journey; hiding the cancellation option; forcing a user to give payment details for auto-debit on free trials; or making cancellation buttons significantly harder to access than subscription enrollment buttons.',
    enforcementPrecedents: 'CCPA penalized McAfee India ₹1 lakh for asymmetric auto-renewal renewal cancellation flows requiring phone calls while sign-up was one-click.',
    commonOccurrence: 'One-click sign up vs. 6-step multi-page retention labyrinth requiring survey completion and typing confirmation phrases.'
  },
  {
    id: 'CP-05',
    name: 'Confirm shaming',
    definition: 'Using emotional manipulation, guilt, or humiliation to persuade the consumer to act or dissuade them from declining an offer or unsubscribing.',
    testedByTrustLens: true,
    officialClause: 'Section 5(5), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 5',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Confirm shaming means the practice of using a phrase, video, audio or any other means to create a sense of fear or shame or guilt or ridicule in the mind of the user, so as to nudge the user to purchase a product or service from the platform or a continue a subscription.',
    enforcementPrecedents: 'ASCI and CCPA joint scrutiny of e-commerce discount dismissals using copy like "No thanks, I prefer paying full price".',
    commonOccurrence: 'Dismiss buttons with text: "No thanks, I like paying extra" or "No, I do not care about savings".'
  },
  {
    id: 'CP-06',
    name: 'Forced action',
    definition: 'Compelling a user to buy an additional good, subscribe to an unrelated service, or share excessive personal data to complete their desired primary transaction.',
    testedByTrustLens: false,
    officialClause: 'Section 5(6), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 6',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Forced action means compelling a user to take an action that would require the user to buy any additional goods or sign up for an unrelated service, or share personal information in order to buy or subscribe to the product originally intended.',
    commonOccurrence: 'Mandatory newsletter signup or installing an ancillary app to read receipt details.'
  },
  {
    id: 'CP-07',
    name: 'Interface interference',
    definition: 'Visual or interactive design manipulation that highlights certain choices while obscuring, de-emphasizing, or hiding others to mislead the user.',
    testedByTrustLens: false,
    officialClause: 'Section 5(7), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 7',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Interface interference means a design element that manipulates the user interface in ways that point the user toward a specific action or obscures relevant information that would alter the decision.',
    commonOccurrence: 'Making the "Skip" button transparent light gray on white background while highlighting "Enroll Now" in vibrant contrasting color.'
  },
  {
    id: 'CP-08',
    name: 'Bait and switch',
    definition: 'Advertising a particular outcome or product based on consumer action, but deceptively serving a totally different outcome or altered product.',
    testedByTrustLens: false,
    officialClause: 'Section 5(8), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 2',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Bait and switch means the practice of advertising a particular outcome based on the user’s action, but deceptively serving a totally different outcome.',
    commonOccurrence: 'Displaying items at ₹99 in search cards, but redirecting to an updated listing at ₹299 claiming original stock finished.'
  },
  {
    id: 'CP-09',
    name: 'Disguised advertisement',
    definition: 'Masking promotional or sponsored advertisements as editorial content, user reviews, or organic search results without clear disclosure.',
    testedByTrustLens: false,
    officialClause: 'Section 5(9), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 9',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Disguised advertisement means a practice of posing, presenting, or placing advertisements within content or news or user evaluations in such a way that they appear organic without prominent disclosure.',
    commonOccurrence: 'Sponsored product results placed in top spots with microscopic or invisible "Ad" markers.'
  },
  {
    id: 'CP-10',
    name: 'Nagging',
    definition: 'Repeatedly disrupting and pestering the user with intrusive prompts, dialogs, or popups to accept an option they previously dismissed.',
    testedByTrustLens: false,
    officialClause: 'Section 5(10), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 10',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Nagging refers to a practice due to which a user is disrupted and pestered repeatedly with requests, information, options or interruptions to buy, subscribe, or permit permissions contrary to their earlier refusal.',
    commonOccurrence: 'Repeatedly asking for location or notifications permission on every screen after user tapped "Deny".'
  },
  {
    id: 'CP-11',
    name: 'Trick question',
    definition: 'Using deliberately confusing, double-negative, or ambiguous language in checkboxes or forms to misdirect consumer choices.',
    testedByTrustLens: false,
    officialClause: 'Section 5(11), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 11',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Trick question means the practice of using confusing or vague language, double negatives or other similar tricks to intentionally confuse the user or induce them to take a desired action.',
    commonOccurrence: '"Uncheck this box if you do not want to refrain from receiving promotional SMS."'
  },
  {
    id: 'CP-12',
    name: 'SaaS billing & recurring charges',
    definition: 'Undisclosed automatic rollover from a free or discounted trial to full paid recurring charges without timely notification or explicit consent.',
    testedByTrustLens: false,
    officialClause: 'Section 5(12), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 12',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Saas billing dark patterns refer to recurring subscription auto-debit transactions carried out without distinct reminders or without clear disclosure of recurrence rules.',
    commonOccurrence: 'Silent auto-debit activation with no pre-debit advisory 24 hours prior as mandated by RBI e-mandate guidelines.'
  },
  {
    id: 'CP-13',
    name: 'Rogue malwares',
    definition: 'Using deceptive techniques or false alerts (such as fake antivirus warnings) to prompt users into installing unauthorized software or ransomware.',
    testedByTrustLens: false,
    officialClause: 'Section 5(13), Guidelines for Prevention and Regulation of Dark Patterns, 2023',
    annexureRef: 'Annexure 1, Clause 13',
    issuingAuthority: 'Central Consumer Protection Authority (CCPA), India',
    dateEnacted: '30 November 2023',
    version: 'Gazette Notification CG-DL-E-30112023-250328',
    sampleGuidelineText: 'Rogue malwares means using ransomware or scareware to mislead or trick a user into believing their device is infected with virus and prompting downloads.',
    commonOccurrence: 'Popups mimicking operating system dialogs stating "Your phone has 3 viruses, clean now".'
  }
];

export const RELEASE_MARKERS: ReleaseMarker[] = [
  {
    date: '2026-09-22',
    version: 'v2.3',
    title: 'Release 2.3',
    description: 'Delivery fee moved to payment step; donation add-on introduced in cart checkout.',
    scoreImpact: -40
  },
  {
    date: '2026-09-29',
    version: 'v2.4',
    title: 'Release 2.4',
    description: 'Flash-sale countdown timers and low-stock badge logic activated across product grids.',
    scoreImpact: -12
  },
  {
    date: '2026-10-06',
    version: 'v2.5',
    title: 'Release 2.5',
    description: 'FreshCart Plus upsell popup; new 4-screen cancellation retention survey deployed.',
    scoreImpact: -32
  },
  {
    date: '2026-10-13',
    version: 'v2.5.1',
    title: 'Hotfix 2.5.1',
    description: 'Hotfix: Fee shown in cart breakdown, donation add-on pre-tick removed.',
    scoreImpact: 40
  }
];

export const MOCK_HISTORICAL_RUNS_SUMMARY = [
  { runNumber: 7, id: 'RUN-007', date: '8 Sep 2026', fullDate: '2026-09-08', score: 100, nonCompliant: 0, status: 'Completed', trigger: 'Scheduled', variant: 'Clean control', duration: '1m 08s' },
  { runNumber: 8, id: 'RUN-008', date: '15 Sep 2026', fullDate: '2026-09-15', score: 100, nonCompliant: 0, status: 'Completed', trigger: 'Scheduled', variant: 'Clean control', duration: '1m 14s' },
  { runNumber: 9, id: 'RUN-009', date: '22 Sep 2026', fullDate: '2026-09-22', score: 60, nonCompliant: 2, status: 'Completed', trigger: 'Release hook', variant: 'All faults', duration: '1m 24s' },
  { runNumber: 10, id: 'RUN-010', date: '29 Sep 2026', fullDate: '2026-09-29', score: 48, nonCompliant: 3, status: 'Completed', trigger: 'Release hook', variant: 'All faults', duration: '1m 32s' },
  { runNumber: 11, id: 'RUN-011', date: '6 Oct 2026', fullDate: '2026-10-06', score: 16, nonCompliant: 5, status: 'Completed', trigger: 'Release hook', variant: 'All faults', duration: '1m 45s' },
  { runNumber: 12, id: 'RUN-012', date: '13 Oct 2026', fullDate: '2026-10-13', score: 56, nonCompliant: 3, status: 'Completed', trigger: 'Manual', variant: 'Partly fixed', duration: '1m 38s' },
];

export const MOCK_CHECKPOINTS_RUN12: EvidenceWireframe[] = [
  {
    id: 'CP-1',
    step: '1. Home & Search',
    title: 'Catalog search & product listing',
    timestamp: '14:20:04',
    isFlagged: false,
    screenshotType: 'genuine_stock',
    url: '/evidence/run12_cp1_home.svg',
    highlightBox: {
      label: 'Search Results',
      description: 'Browsed staple groceries; organic query matching verified without forced re-directs.'
    }
  },
  {
    id: 'CP-2',
    step: '2. Product Page (Stock)',
    title: 'Item detail: Scarcity claim check',
    timestamp: '14:20:18',
    isFlagged: true,
    screenshotType: 'urgency_product',
    url: '/evidence/run12_cp2_urgency.svg',
    highlightBox: {
      label: 'False Urgency (CP-03)',
      description: 'Badge claims "Only 2 left!" despite 178 units in warehouse inventory.'
    },
    beforeAfterComparison: {
      beforeLabel: 'Product UI Badge',
      afterLabel: 'ERP Stock Level',
      detectedDiff: 'Discrepancy of 176 units between advertised stock and real inventory.'
    }
  },
  {
    id: 'CP-3',
    step: '3. Cart View',
    title: 'Cart review & itemized subtotal',
    timestamp: '14:20:31',
    isFlagged: false,
    screenshotType: 'cart',
    url: '/evidence/run12_cp3_cart.svg',
    highlightBox: {
      label: 'Drip Pricing Resolved',
      description: 'Delivery fee (₹49) now explicitly disclosed before proceeding to payment.'
    },
    beforeAfterComparison: {
      beforeLabel: 'Run #11 Cart Total',
      afterLabel: 'Run #12 Cart Total',
      detectedDiff: 'Fee was omitted in Run #11 cart (₹499 shown), now upfront in Run #12 (₹548).'
    }
  },
  {
    id: 'CP-4',
    step: '4. Upsell Modal',
    title: 'FreshCart Plus trial prompt',
    timestamp: '14:20:45',
    isFlagged: true,
    screenshotType: 'confirm_shaming',
    url: '/evidence/run12_cp4_modal.svg',
    highlightBox: {
      label: 'Confirm Shaming (CP-05)',
      description: 'Decline option uses guilt copy: "No thanks, I like paying extra".'
    },
    beforeAfterComparison: {
      beforeLabel: 'Primary CTA',
      afterLabel: 'Decline Link',
      detectedDiff: 'Asymmetric hierarchy: prominent vibrant primary button vs demeaning decline text.'
    }
  },
  {
    id: 'CP-5',
    step: '5. Payment Checkout',
    title: 'Final checkout payment gateway',
    timestamp: '14:21:02',
    isFlagged: false,
    screenshotType: 'payment',
    url: '/evidence/run12_cp5_payment.svg',
    highlightBox: {
      label: 'Price Consistency Verified',
      description: 'Final payment total matches cart total (₹548) exactly. Basket sneaking pre-check absent.'
    }
  },
  {
    id: 'CP-6',
    step: '6. Order Confirmation',
    title: 'Order invoice & status badge',
    timestamp: '14:21:14',
    isFlagged: true,
    screenshotType: 'bug_counter',
    url: '/evidence/run12_cp6_order.svg',
    highlightBox: {
      label: 'Cart Quantity Badge Bug (D1)',
      description: 'Header cart counter displays 3 despite order containing 4 units.'
    }
  },
  {
    id: 'CP-7',
    step: '7. Plus Membership Cancel',
    title: 'Account settings & cancellation journey',
    timestamp: '14:21:36',
    isFlagged: true,
    screenshotType: 'cancellation_flow',
    url: '/evidence/run12_cp7_cancel.svg',
    highlightBox: {
      label: 'Subscription Trap (CP-04)',
      description: 'Join took 1 click; cancellation requires 6 clicks across 4 screens with mandatory survey.'
    },
    beforeAfterComparison: {
      beforeLabel: 'Join Journey',
      afterLabel: 'Cancellation Journey',
      detectedDiff: '1 click to subscribe vs. 6 clicks + manual typing to terminate.'
    }
  }
];

export const MOCK_FINDINGS_RUN12: Finding[] = [
  {
    id: 'F1',
    patternId: 'CP-01',
    patternName: 'Drip pricing',
    title: 'Delivery charge disclosed upfront in cart itemization',
    status: 'Compliant',
    severity: 'High',
    confidence: 98,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Cart total and payment total match at ₹548 with itemized ₹49 delivery charge displayed prior to checkout.',
    journeyStep: 'Cart / Payment',
    firstSeen: 'Run #9 (22 Sep 2026)',
    workflowStatus: 'Fixed',
    whatChanged: 'In Run #11, the cart showed ₹499 and the payment step suddenly showed ₹548 (+₹49 delivery fee). In Run #12, the ₹49 delivery fee is presented directly on the cart page before the user clicks Proceed.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 3 (Drip Pricing)',
      versionDate: '30 November 2023',
      excerpt: 'Sample rule text: Drip pricing means a practice whereby elements of prices are not revealed upfront or at the start of the consumption cycle or features thereof are revealed surreptitiously at subsequent steps before confirmation of purchase.'
    },
    enforcementPrecedent: {
      entity: 'Zepto (KiranaKart Technologies)',
      penalty: '₹7 lakh fine imposed by CCPA',
      context: 'Penalized for concealing delivery/handling charges until the final payment step, misleading consumers on initial cart valuations.'
    },
    suggestedFix: 'Retain current implementation: maintain transparent line-item fee breakdown in cart drawer prior to checkout trigger.',
    runHistory: [
      { runId: 'RUN-009', date: '22 Sep 2026', status: 'Non-compliant', score: 60 },
      { runId: 'RUN-010', date: '29 Sep 2026', status: 'Non-compliant', score: 48 },
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Compliant', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run11_drip_cart.svg',
    evidenceAfterUrl: '/evidence/run12_drip_cart.svg',
    evidenceScreenshotType: 'cart'
  },
  {
    id: 'F2',
    patternId: 'CP-02',
    patternName: 'Basket sneaking',
    title: 'Charity donation add-on no longer pre-selected',
    status: 'Compliant',
    severity: 'High',
    confidence: 99,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Checkout form loads with the ₹10 voluntary donation checkbox in default unselected state.',
    journeyStep: 'Cart / Checkout',
    firstSeen: 'Run #9 (22 Sep 2026)',
    workflowStatus: 'Fixed',
    whatChanged: 'In Run #11, "Donate ₹10 to Farmers Relief" was pre-ticked and automatically bundled into the payable order balance. In Run #12, the checkbox is unticked by default.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 4 (Basket Sneaking)',
      versionDate: '30 November 2023',
      excerpt: 'Sample rule text: Basket sneaking means the inclusion of additional items such as products, services, payments to charity/donation, or fees at checkout from a platform, without express consent of the user.'
    },
    enforcementPrecedent: {
      entity: 'National Consumer Disputes Redressal Forum ruling',
      penalty: 'Restitution directive & censure',
      context: 'Adjudication against major booking portal for defaulting optional donation and carbon offsets to checked state.'
    },
    suggestedFix: 'Retain current opt-in behavior: keep all donations, tips, and optional warranty extensions unselected by default.',
    runHistory: [
      { runId: 'RUN-009', date: '22 Sep 2026', status: 'Non-compliant', score: 60 },
      { runId: 'RUN-010', date: '29 Sep 2026', status: 'Non-compliant', score: 48 },
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Compliant', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run11_basket_sneak.svg',
    evidenceAfterUrl: '/evidence/run12_basket_clean.svg',
    evidenceScreenshotType: 'payment'
  },
  {
    id: 'F3a',
    patternId: 'CP-03',
    patternName: 'False urgency',
    title: 'Artificial "Only 2 left!" scarcity badges on abundant inventory',
    status: 'Non-compliant',
    severity: 'Medium',
    confidence: 96,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Audited against ERP inventory feed: displayed stock claim is mathematically refuted by internal warehouse availability.',
    journeyStep: 'Product Listing / PDP',
    firstSeen: 'Run #10 (29 Sep 2026)',
    workflowStatus: 'Open',
    whatChanged: 'Low-stock badge "Only 2 left!" remains hardcoded across staple categories regardless of actual stock holding.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 1 (False Urgency)',
      versionDate: '30 November 2023',
      excerpt: 'Sample rule text: False urgency means the practice of falsely stating or implying the sense of urgency or scarcity to mislead a user into making an immediate purchase or taking an immediate action.'
    },
    enforcementPrecedent: {
      entity: 'CCPA Advisory on E-Commerce Flash Sales',
      penalty: 'Show-cause notices to top 3 quick-commerce platforms',
      context: 'Regulator flagged simulated low-stock alerts that reset upon browser refresh.'
    },
    suggestedFix: 'Bind stock badge directly to live warehouse inventory count. Do not display "Only X left" unless real stock is strictly ≤ 3 units. Otherwise remove badge.',
    stockClaimData: [
      { product: 'Aashirvaad Whole Wheat Atta 5kg', labelShown: 'Only 2 left!', unitsAvailable: 178, verdict: 'False scarcity' },
      { product: 'Tata Sampann Toor Dal 1kg', labelShown: 'Only 2 left!', unitsAvailable: 122, verdict: 'False scarcity' },
      { product: 'Amul Salted Butter 500g', labelShown: 'Only 2 left!', unitsAvailable: 231, verdict: 'False scarcity' },
      { product: 'Fresh Malai Paneer 200g', labelShown: 'Only 2 left!', unitsAvailable: 2, verdict: 'Genuine stock (Cleared)' }
    ],
    runHistory: [
      { runId: 'RUN-010', date: '29 Sep 2026', status: 'Non-compliant', score: 48 },
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Non-compliant', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run12_urgency_stock.svg',
    evidenceScreenshotType: 'urgency_product'
  },
  {
    id: 'F3b',
    patternId: 'CP-03',
    patternName: 'False urgency',
    title: 'Unverified cart & checkout countdown timers',
    status: 'Needs review',
    severity: 'Medium',
    confidence: 62,
    confidenceLabel: 'needs human review',
    confidenceReason: 'Quick Mode simulation did not wait for the timer to elapse to zero; auto-restart upon expiration remains unconfirmed.',
    journeyStep: 'Cart / Payment Header',
    firstSeen: 'Run #10 (29 Sep 2026)',
    workflowStatus: 'Open',
    whatChanged: 'Three timers active: "Flash prices end in 09:42", "Prices locked for 04:15", "Complete payment within 07:00". Run did not observe whether price actually resets at 00:00.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 1 (False Urgency)',
      versionDate: '30 November 2023',
      excerpt: 'Sample rule text: Displaying artificial countdown timers to create a false impression of limited validity where the timer restarts upon expiration.'
    },
    suggestedFix: 'Run Full Mode test (8 min) to observe timer zero-point behavior, or verify backend deal expiry timestamp directly with engineering.',
    runHistory: [
      { runId: 'RUN-010', date: '29 Sep 2026', status: 'Needs review', score: 48 },
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Needs review', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Needs review', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run12_timer.svg',
    evidenceScreenshotType: 'cart'
  },
  {
    id: 'F4',
    patternId: 'CP-04',
    patternName: 'Subscription trap',
    title: 'Asymmetric Plus cancellation labyrinth (1-click enroll vs 6-click cancel)',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 91,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Click depth delta is 5 clicks; cancellation requires navigating 4 separate interstitial screens and typing confirmation text.',
    journeyStep: 'Account / Membership Management',
    firstSeen: 'Run #11 (6 Oct 2026)',
    workflowStatus: 'Open',
    whatChanged: 'Enrolling in FreshCart Plus takes 1 single click. Cancelling requires: 1) low-contrast link "Manage membership", 2) required 4-question retention survey, 3) retention discount popup, 4) manual typing of word "CANCEL" in all caps.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 8 (Subscription Trap)',
      versionDate: '30 November 2023',
      excerpt: 'Sample rule text: Subscription trap means making cancellation of a paid subscription impossible or a complex, lengthy and convoluted journey; or making cancellation buttons significantly harder to access than subscription enrollment buttons.'
    },
    enforcementPrecedent: {
      entity: 'McAfee India',
      penalty: '₹1 lakh penalty and mandatory UI remedy',
      context: 'Consumer authority reprimanded auto-debit renewals that obscured straightforward cancellation mechanisms.'
    },
    suggestedFix: 'Place a prominent "Cancel FreshCart Plus" button directly adjacent to membership details in Account overview, requiring at most 1 confirmation modal.',
    runHistory: [
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Non-compliant', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run12_cancel_labyrinth.svg',
    evidenceScreenshotType: 'cancellation_flow'
  },
  {
    id: 'F5',
    patternId: 'CP-05',
    patternName: 'Confirm shaming',
    title: 'Guilt-inducing dismissal copy on Plus trial popup',
    status: 'Non-compliant',
    severity: 'Medium',
    confidence: 94,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Dismissal text explicitly shames the user into self-deprecation ("No thanks, I like paying extra").',
    journeyStep: 'Cart / Interstitial Upsell',
    firstSeen: 'Run #11 (6 Oct 2026)',
    workflowStatus: 'Open',
    whatChanged: 'Popup modal offers "Free 30-Day FreshCart Plus Trial". Primary button: "Yes, I want to save money!" (deep blue, large). Dismissal: low-contrast small link "No thanks, I like paying extra".',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 5 (Confirm Shaming)',
      versionDate: '30 November 2023',
      excerpt: 'Sample rule text: Confirm shaming means the practice of using a phrase, video, audio or any other means to create a sense of fear or shame or guilt or ridicule in the mind of the user.'
    },
    enforcementPrecedent: {
      entity: 'ASCI Regulatory Advisory 2024',
      penalty: 'Public naming and required immediate deprecation',
      context: 'Scrutiny over predatory opt-out phrasing forcing self-deprecating admissions from consumers.'
    },
    suggestedFix: 'Standardize action pair with neutral, respectful copy: "Start Free Trial" and "No Thanks", formatted with equal visual legibility.',
    runHistory: [
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Non-compliant', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run12_confirm_shaming.svg',
    evidenceScreenshotType: 'confirm_shaming'
  },
  {
    id: 'D1',
    patternId: 'GEN-BUG',
    patternName: 'Display / State Bug',
    title: 'Cart badge displays count of 3 after quantity increased to 4',
    status: 'Compliant',
    severity: 'Low',
    confidence: 82,
    confidenceLabel: 'likely bug',
    confidenceReason: 'Header badge failed to re-render client-side state after optimistic cart increment; no intent to deceive or manipulate transaction.',
    journeyStep: 'Order Confirmation Header',
    firstSeen: 'Run #12 (13 Oct 2026)',
    workflowStatus: 'In progress',
    whatChanged: 'Detected counter inconsistency: Cart line items sum to 4 units, but header badge displays "3". Classified by Reasoning Agent as display glitch, not CCPA dark pattern.',
    whyItMatters: {
      ruleTitle: 'TrustLens Fault Classification Engine',
      issuingAuthority: 'TrustLens Automated Triage',
      section: 'Rule Bug-Triage-04',
      versionDate: 'October 2026',
      excerpt: 'Sample rule text: State synchronization inconsistencies that do not induce financial harm, forced purchase, or obscured pricing are routed to engineering as functional bugs rather than regulatory violations.'
    },
    suggestedFix: 'Dispatch cart count update event on mutation response in HeaderNav component to avoid stale cache.',
    runHistory: [
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Compliant', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run12_bug_counter.svg',
    evidenceScreenshotType: 'bug_counter'
  },
  {
    id: 'C1',
    patternId: 'CP-03',
    patternName: 'False urgency',
    title: 'Fresh Malai Paneer 200g scarcity label verified against warehouse',
    status: 'Compliant',
    severity: 'Info',
    confidence: 99,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Warehouse inventory verified: exactly 2 units remained in distribution center at timestamp of test.',
    journeyStep: 'Product Page',
    firstSeen: 'Run #12 (13 Oct 2026)',
    workflowStatus: 'Fixed',
    whatChanged: '"Only 2 left!" badge was displayed on Paneer. TrustLens cross-checked with mock ERP inventory feed (unitsAvailable: 2). Scarcity claim confirmed authentic; cleared with zero penalty.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 1',
      versionDate: '30 November 2023',
      excerpt: 'Sample rule text: A scarcity indication that accurately reflects verifiable physical inventory is permissible and does not constitute false urgency.'
    },
    suggestedFix: 'No remediation required. Automated audit logged as genuine scarcity claim.',
    stockClaimData: [
      { product: 'Fresh Malai Paneer 200g', labelShown: 'Only 2 left!', unitsAvailable: 2, verdict: 'Genuine stock (Cleared)' }
    ],
    runHistory: [
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Compliant', score: 56 }
    ],
    evidenceBeforeUrl: '/evidence/run12_genuine_stock.svg',
    evidenceScreenshotType: 'genuine_stock'
  }
];

export const GROUNDED_FINDINGS_ALL_FAULTS: Finding[] = [
  {
    id: 'F1',
    patternId: 'CP-01',
    patternName: 'Drip pricing',
    title: 'Delivery fee (₹49) omitted from cart and injected at checkout',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 98,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Storefront catalogue advertised Whole Wheat Atta at ₹249, but checkout step silently added unannounced ₹49 delivery charge.',
    journeyStep: 'Cart / Payment',
    firstSeen: 'Run #13 (Today)',
    workflowStatus: 'Open',
    whatChanged: 'Delivery charge of ₹49 is omitted from catalogue and cart drawer breakdown; only revealed at payment step after purchase intent.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 3 (Drip Pricing)',
      versionDate: '30 November 2023',
      excerpt: 'Drip pricing means a practice whereby elements of prices are not revealed upfront or at the start of the consumption cycle or features thereof are revealed surreptitiously at subsequent steps before confirmation of purchase.'
    },
    enforcementPrecedent: {
      entity: 'Zepto (KiranaKart Technologies)',
      penalty: '₹7 lakh fine imposed by CCPA',
      context: 'Penalized for concealing delivery and handling charges until final payment screen.'
    },
    suggestedFix: 'Disclose mandatory ₹49 delivery fee upfront on product cards and cart subtotal before user reaches payment.',
    runHistory: [
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Compliant', score: 56 },
      { runId: 'RUN-013', date: 'Today', status: 'Non-compliant', score: 16 }
    ],
    evidenceBeforeUrl: '/evidence/run11_drip_cart.svg',
    evidenceAfterUrl: '/evidence/run12_drip_cart.svg',
    evidenceScreenshotType: 'cart'
  },
  {
    id: 'F2',
    patternId: 'CP-02',
    patternName: 'Basket sneaking',
    title: 'Pre-ticked voluntary ₹10 donation to FreshCart Foundation',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 99,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Checkout form loads with the ₹10 donation checkbox pre-selected by default without explicit consumer opt-in.',
    journeyStep: 'Checkout / Payment Gateway',
    firstSeen: 'Run #13 (Today)',
    workflowStatus: 'Open',
    whatChanged: 'Donate ₹10 to FreshCart Foundation was pre-selected in checkout, inflating payable order total by ₹10 without affirmative consent.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 4 (Basket Sneaking)',
      versionDate: '30 November 2023',
      excerpt: 'Basket sneaking means the inclusion of additional items such as products, services, payments to charity/donation, or fees at checkout from a platform, without express consent of the user.'
    },
    enforcementPrecedent: {
      entity: 'National Consumer Disputes Redressal Commission',
      penalty: 'Mandatory restitution and cease-and-desist',
      context: 'Ruled against booking engines defaulting optional donation add-ons to checked state.'
    },
    suggestedFix: 'Set donation checkbox to un-ticked by default; require conscious, voluntary opt-in by consumer.',
    runHistory: [
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Compliant', score: 56 },
      { runId: 'RUN-013', date: 'Today', status: 'Non-compliant', score: 16 }
    ],
    evidenceBeforeUrl: '/evidence/run11_basket_sneak.svg',
    evidenceAfterUrl: '/evidence/run12_basket_clean.svg',
    evidenceScreenshotType: 'payment'
  },
  {
    id: 'F3',
    patternId: 'CP-03',
    patternName: 'False urgency',
    title: 'Fabricated 10:00 countdown timer resets on reload & artificial stock badge',
    status: 'Non-compliant',
    severity: 'Medium',
    confidence: 96,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Browser refresh immediately resets countdown clock back to 10:00, proving synthetic deadline rather than genuine promotion expiration.',
    journeyStep: 'Storefront Catalogue / PDP',
    firstSeen: 'Run #13 (Today)',
    workflowStatus: 'Open',
    whatChanged: 'Artificial countdown timer resets upon customer reload; "Only 2 left!" scarcity claim displayed on Whole Wheat Atta despite abundant warehouse inventory.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 1 (False Urgency)',
      versionDate: '30 November 2023',
      excerpt: 'False urgency means the practice of falsely stating or implying the sense of urgency or scarcity to mislead a user into making an immediate purchase, including creating artificial countdown timers.'
    },
    enforcementPrecedent: {
      entity: 'CCPA Advisory on E-Commerce Flash Sales',
      penalty: 'Show-cause notices & corrective advertising order',
      context: 'Sanctioned platforms using artificial resetting timer clocks to induce impulsive checkouts.'
    },
    suggestedFix: 'Remove artificial resetting timer banner; connect any stock badges to genuine ERP real-time inventory API.',
    runHistory: [
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Non-compliant', score: 56 },
      { runId: 'RUN-013', date: 'Today', status: 'Non-compliant', score: 16 }
    ],
    evidenceBeforeUrl: '/evidence/run12_urgency_stock.svg',
    evidenceScreenshotType: 'urgency_product'
  },
  {
    id: 'F4',
    patternId: 'CP-04',
    patternName: 'Subscription trap',
    title: 'Asymmetric 4-screen cancellation labyrinth with mandatory survey & typing',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 92,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Subscription enrollment requires only 1 click, whereas cancellation forces the user through 4 retention screens and manual typing of CANCEL.',
    journeyStep: 'Account / Membership Management',
    firstSeen: 'Run #13 (Today)',
    workflowStatus: 'Open',
    whatChanged: 'Joining Plus membership is instantaneous (1-click), but cancellation requires traversing 4 friction steps: benefits reminder, forced survey, discount modal, and typing "CANCEL" in all caps.',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 8 (Subscription Trap)',
      versionDate: '30 November 2023',
      excerpt: 'Subscription trap means making cancellation of a paid subscription impossible or a complex, lengthy, and convoluted journey; hiding the cancellation option; or making cancellation buttons significantly harder to access than enrollment buttons.'
    },
    enforcementPrecedent: {
      entity: 'McAfee India & FTC Click-to-Cancel',
      penalty: '₹1 lakh penalty and mandatory 1-click cancellation parity',
      context: 'Regulatory reprimand for auto-renewals that enforced asymmetric cancellation mazes.'
    },
    suggestedFix: 'Provide a direct 1-click "Cancel Membership" button on account page matching enrollment ease.',
    runHistory: [
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Non-compliant', score: 56 },
      { runId: 'RUN-013', date: 'Today', status: 'Non-compliant', score: 16 }
    ],
    evidenceBeforeUrl: '/evidence/run12_cancel_labyrinth.svg',
    evidenceScreenshotType: 'cancellation_flow'
  },
  {
    id: 'F5',
    patternId: 'CP-05',
    patternName: 'Confirm shaming',
    title: 'Manipulative guilt-copy on Plus trial dismissal: "No thanks, I like paying extra"',
    status: 'Non-compliant',
    severity: 'Medium',
    confidence: 94,
    confidenceLabel: 'probable violation',
    confidenceReason: 'Decline button uses emotionally coercive phrasing intended to shame consumers into purchasing the membership.',
    journeyStep: 'Cart / Interstitial Upsell',
    firstSeen: 'Run #13 (Today)',
    workflowStatus: 'Open',
    whatChanged: 'Upsell modal promotes 30-Day FreshCart Plus trial. Acceptance button is prominent blue; decline option is low-contrast text saying "No thanks, I like paying extra".',
    whyItMatters: {
      ruleTitle: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023',
      issuingAuthority: 'Central Consumer Protection Authority (CCPA), New Delhi',
      section: 'Annexure 1, Clause 5 (Confirm Shaming)',
      versionDate: '30 November 2023',
      excerpt: 'Confirm shaming means the practice of using a phrase, video, audio or any other means to create a sense of fear or shame or guilt or ridicule in the mind of the user.'
    },
    enforcementPrecedent: {
      entity: 'ASCI Regulatory Advisory 2024',
      penalty: 'Formal censure & mandatory copy deprecation',
      context: 'Scrutiny over derogatory opt-out phrases inducing self-deprecating admissions.'
    },
    suggestedFix: 'Replace guilt phrasing with neutral opt-out copy: "Start Free Trial" and "No Thanks" with equal visual hierarchy.',
    runHistory: [
      { runId: 'RUN-011', date: '6 Oct 2026', status: 'Non-compliant', score: 16 },
      { runId: 'RUN-012', date: '13 Oct 2026', status: 'Non-compliant', score: 56 },
      { runId: 'RUN-013', date: 'Today', status: 'Non-compliant', score: 16 }
    ],
    evidenceBeforeUrl: '/evidence/run12_confirm_shaming.svg',
    evidenceScreenshotType: 'confirm_shaming'
  }
];

export const MOCK_STAGES_RUN12: AgentStage[] = [
  {
    number: 1,
    name: 'Navigator Agent',
    role: 'Autonomous customer journey execution & screenshot capture',
    googleCloudService: 'Cloud Run + Playwright',
    status: 'Completed',
    progressPercent: 100,
    progressCount: '10 evidence frames (5 pairs)',
    elapsedTime: '1m 12s',
    keyOutput: 'Operated full grocery checkout flow; 10 dark pattern evidence frames captured (5 Before/After pairs).',
    latestLogLine: 'Checkpoint 7/7 (Membership Cancel) reached; final session artifacts uploaded to Cloud Storage.',
    screenshots: [
      '/runs/RUN-1013-173611/01_dp1_drip_pricing_before.png',
      '/runs/RUN-1013-173611/02_dp1_drip_pricing_after.png',
      '/runs/RUN-1013-173611/03_dp2_false_urgency_before.png',
      '/runs/RUN-1013-173611/04_dp2_false_urgency_after.png',
      '/runs/RUN-1013-173611/05_confirmshaming_before.png',
      '/runs/RUN-1013-173611/06_confirmshaming_after.png',
      '/runs/RUN-1013-173611/07_basket_sneaking_before.png',
      '/runs/RUN-1013-173611/08_basket_sneaking_after.png',
      '/runs/RUN-1013-173611/09_subscription_trap_before.png',
      '/runs/RUN-1013-173611/10_subscription_trap_after.png'
    ],
    logs: [
      { id: 'l1-1', timestamp: '14:20:00', stageNumber: 1, stageName: 'Navigator Agent', level: 'info', message: 'Starting headless Chromium instance in Cloud Run container (memory: 2GiB, concurrency: 1).' },
      { id: 'l1-2', timestamp: '14:20:04', stageNumber: 1, stageName: 'Navigator Agent', level: 'info', message: 'Checkpoint 1/7: Loaded https://freshcart-demo.store/catalog?q=groceries. Captured home viewport.' },
      { id: 'l1-3', timestamp: '14:20:18', stageNumber: 1, stageName: 'Navigator Agent', level: 'warn', message: 'Checkpoint 2/7: PDP opened for Whole Wheat Atta. Detected scarcity badge "Only 2 left!".' },
      { id: 'l1-4', timestamp: '14:20:31', stageNumber: 1, stageName: 'Navigator Agent', level: 'info', message: 'Checkpoint 3/7: Cart drawer opened. Total displayed: ₹548 (Item ₹499 + Delivery ₹49).' },
      { id: 'l1-5', timestamp: '14:20:45', stageNumber: 1, stageName: 'Navigator Agent', level: 'warn', message: 'Checkpoint 4/7: Interstitial Plus popup triggered. Captured modal dialog bounding boxes.' },
      { id: 'l1-6', timestamp: '14:21:02', stageNumber: 1, stageName: 'Navigator Agent', level: 'info', message: 'Checkpoint 5/7: Reached payment gateway. Total is ₹548. Donation checkbox un-ticked.' },
      { id: 'l1-7', timestamp: '14:21:14', stageNumber: 1, stageName: 'Navigator Agent', level: 'info', message: 'Checkpoint 6/7: Placed demo test order #FC-890241. Captured confirmation receipt.' },
      { id: 'l1-8', timestamp: '14:21:36', stageNumber: 1, stageName: 'Navigator Agent', level: 'warn', message: 'Checkpoint 7/7: Navigated cancellation route. Traversed 4 interstitial survey screens.' },
      { id: 'l1-9', timestamp: '14:21:40', stageNumber: 1, stageName: 'Navigator Agent', level: 'success', message: 'Navigation completed successfully. 11 PNG frames stored in gs://trustlens-evidence-bucket/run-012/.' }
    ]
  },
  {
    number: 2,
    name: 'Pattern Detector Agent',
    role: 'Visual diffing & heuristic candidate anomaly classification',
    googleCloudService: 'Gemini on Vertex AI',
    status: 'Completed',
    progressPercent: 100,
    progressCount: '8 comparisons',
    elapsedTime: '24s',
    keyOutput: '8 candidate anomalies isolated across cart, payment, popup, and stock badges.',
    latestLogLine: 'Visual diff complete. 4 candidate dark patterns & 1 display bug routed to Reasoning Agent.',
    logs: [
      { id: 'l2-1', timestamp: '14:21:41', stageNumber: 2, stageName: 'Pattern Detector Agent', level: 'info', message: 'Received 11 screenshot object references from Cloud Storage. Initializing Vertex AI Gemini vision session.' },
      { id: 'l2-2', timestamp: '14:21:48', stageNumber: 2, stageName: 'Pattern Detector Agent', level: 'info', message: 'Comparing Run #11 Cart vs Run #12 Cart: ₹49 delivery charge now visible in cart drawer.' },
      { id: 'l2-3', timestamp: '14:21:54', stageNumber: 2, stageName: 'Pattern Detector Agent', level: 'warn', message: 'Detected stock text "Only 2 left!" on 4 SKU elements. Flagged for ERP inventory cross-check.' },
      { id: 'l2-4', timestamp: '14:22:00', stageNumber: 2, stageName: 'Pattern Detector Agent', level: 'warn', message: 'Detected asymmetric button weights on Upsell modal: primary 44px blue vs secondary 11px gray link.' },
      { id: 'l2-5', timestamp: '14:22:05', stageNumber: 2, stageName: 'Pattern Detector Agent', level: 'success', message: 'Diff completed: 8 pairs processed. Passed candidates to RAG Reasoning layer.' }
    ]
  },
  {
    number: 3,
    name: 'Reasoning Agent',
    role: 'RAG regulatory retrieval & confidence-scored compliance reasoning',
    googleCloudService: 'Gemini + RAG',
    status: 'Completed',
    progressPercent: 100,
    progressCount: '8 verdicts grounded in retrieved clauses',
    elapsedTime: '41s',
    keyOutput: '3 probable CCPA violations, 2 resolved, 1 needs human review, 1 classified bug.',
    latestLogLine: 'Grounded reasoning finalized against CCPA Nov 2023 Guidelines and Zepto/McAfee precedents.',
    logs: [
      { id: 'l3-1', timestamp: '14:22:06', stageNumber: 3, stageName: 'Reasoning Agent', level: 'info', message: 'Querying RAG index for candidate "delivery fee cart visibility" -> retrieved CCPA Annexure 1, Clause 3.' },
      { id: 'l3-2', timestamp: '14:22:15', stageNumber: 3, stageName: 'Reasoning Agent', level: 'success', message: 'Verdict F1 (Drip Pricing): RESOLVED. Fee disclosed prior to consumer commitment. Confidence: 98%.' },
      { id: 'l3-3', timestamp: '14:22:24', stageNumber: 3, stageName: 'Reasoning Agent', level: 'error', message: 'Verdict F3a (False Urgency): PROBABLE VIOLATION (96%). Atta shows "2 left" but warehouse has 178.' },
      { id: 'l3-4', timestamp: '14:22:31', stageNumber: 3, stageName: 'Reasoning Agent', level: 'warn', message: 'Verdict F3b (Countdown Timers): NEEDS HUMAN REVIEW (62%). Timer reset unobserved in Quick Mode.' },
      { id: 'l3-5', timestamp: '14:22:38', stageNumber: 3, stageName: 'Reasoning Agent', level: 'error', message: 'Verdict F4 (Subscription Trap): PROBABLE VIOLATION (91%). 1-click subscribe vs 6-step cancellation.' },
      { id: 'l3-6', timestamp: '14:22:45', stageNumber: 3, stageName: 'Reasoning Agent', level: 'error', message: 'Verdict F5 (Confirm Shaming): PROBABLE VIOLATION (94%). Guilt copy "I like paying extra" verified.' },
      { id: 'l3-7', timestamp: '14:22:47', stageNumber: 3, stageName: 'Reasoning Agent', level: 'info', message: 'Verdict D1: Cart counter mismatch classified as non-manipulative display bug (confidence 82%).' }
    ]
  },
  {
    number: 4,
    name: 'Fix Suggestion Agent',
    role: 'Concrete technical and UX remediation synthesis per finding',
    googleCloudService: 'Gemini on Vertex AI',
    status: 'Completed',
    progressPercent: 100,
    progressCount: '5 fixes drafted',
    elapsedTime: '19s',
    keyOutput: 'Drafted concrete code and UI remediations for 3 open violations and 1 engineering bug.',
    latestLogLine: 'Remediation specs generated with copy guidelines, code snippets, and Jira ticket templates.',
    logs: [
      { id: 'l4-1', timestamp: '14:22:48', stageNumber: 4, stageName: 'Fix Suggestion Agent', level: 'info', message: 'Synthesizing remediation spec for F3a (False Urgency): conditional threshold logic drafted.' },
      { id: 'l4-2', timestamp: '14:22:55', stageNumber: 4, stageName: 'Fix Suggestion Agent', level: 'info', message: 'Synthesizing remediation spec for F4 (Subscription Trap): proposed 1-step cancel modal design.' },
      { id: 'l4-3', timestamp: '14:23:02', stageNumber: 4, stageName: 'Fix Suggestion Agent', level: 'info', message: 'Synthesizing remediation spec for F5 (Confirm Shaming): proposed neutral button copy pair.' },
      { id: 'l4-4', timestamp: '14:23:07', stageNumber: 4, stageName: 'Fix Suggestion Agent', level: 'success', message: 'Fix suggestions bundled. Markdown export ready for engineering handoff.' }
    ]
  },
  {
    number: 5,
    name: 'Compliance Trail',
    role: 'Continuous audit persistence, diff calculation & regulatory traceability',
    googleCloudService: 'Firestore',
    status: 'Completed',
    progressPercent: 100,
    progressCount: 'Saved & linked to Run #11',
    elapsedTime: '4s',
    keyOutput: 'Persisted Run #12: Score 56 (+40 pts vs #11). 2 violations resolved; 3 remain open.',
    latestLogLine: 'Firestore document written: /compliance_runs/RUN-012. Change delta emitted to subscriber clients.',
    logs: [
      { id: 'l5-1', timestamp: '14:23:08', stageNumber: 5, stageName: 'Compliance Trail', level: 'info', message: 'Calculating regression & resolution delta against predecessor Run #11 (6 Oct 2026).' },
      { id: 'l5-2', timestamp: '14:23:09', stageNumber: 5, stageName: 'Compliance Trail', level: 'success', message: 'Resolved count: 2 (Drip Pricing, Basket Sneaking). Score increased from 16 to 56.' },
      { id: 'l5-3', timestamp: '14:23:11', stageNumber: 5, stageName: 'Compliance Trail', level: 'info', message: 'Indexing 7 evidence checkpoints and 8 findings into continuous audit ledger.' },
      { id: 'l5-4', timestamp: '14:23:12', stageNumber: 5, stageName: 'Compliance Trail', level: 'success', message: 'Audit trail record committed to Firestore collection. Run status set to COMPLETED.' }
    ]
  }
];

export const MOCK_PATTERN_STATUSES_RUN12 = [
  {
    patternId: 'CP-01',
    patternName: 'Drip pricing',
    whereFound: 'Cart / Payment checkout',
    status: 'Compliant' as const,
    severity: 'High' as const,
    confidence: 98,
    confidenceLabel: 'probable violation' as const,
    changeVsLastRun: 'Resolved' as const,
    previousStatus: 'Non-compliant' as const,
    note: 'Delivery fee of ₹49 is now displayed in the initial cart breakdown.'
  },
  {
    patternId: 'CP-02',
    patternName: 'Basket sneaking',
    whereFound: 'Payment add-ons',
    status: 'Compliant' as const,
    severity: 'High' as const,
    confidence: 99,
    confidenceLabel: 'probable violation' as const,
    changeVsLastRun: 'Resolved' as const,
    previousStatus: 'Non-compliant' as const,
    note: 'Voluntary ₹10 donation is un-checked by default.'
  },
  {
    patternId: 'CP-03',
    patternName: 'False urgency',
    whereFound: 'Product detail pages',
    status: 'Non-compliant' as const,
    severity: 'Medium' as const,
    confidence: 96,
    confidenceLabel: 'probable violation' as const,
    changeVsLastRun: 'Still open' as const,
    previousStatus: 'Non-compliant' as const,
    note: '"Only 2 left!" shown when warehouse stock has 178+ units.'
  },
  {
    patternId: 'CP-04',
    patternName: 'Subscription trap',
    whereFound: 'Plus membership cancellation',
    status: 'Non-compliant' as const,
    severity: 'High' as const,
    confidence: 91,
    confidenceLabel: 'probable violation' as const,
    changeVsLastRun: 'Still open' as const,
    previousStatus: 'Non-compliant' as const,
    note: '1-click to join vs 6-click survey labyrinth to cancel.'
  },
  {
    patternId: 'CP-05',
    patternName: 'Confirm shaming',
    whereFound: 'FreshCart Plus upsell modal',
    status: 'Non-compliant' as const,
    severity: 'Medium' as const,
    confidence: 94,
    confidenceLabel: 'probable violation' as const,
    changeVsLastRun: 'Still open' as const,
    previousStatus: 'Non-compliant' as const,
    note: 'Dismissal option reads "No thanks, I like paying extra".'
  },
  {
    patternId: 'CP-06',
    patternName: 'Forced action',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-07',
    patternName: 'Interface interference',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-08',
    patternName: 'Bait and switch',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-09',
    patternName: 'Disguised advertisement',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-10',
    patternName: 'Nagging',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-11',
    patternName: 'Trick question',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-12',
    patternName: 'SaaS billing',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-13',
    patternName: 'Rogue malwares',
    whereFound: '—',
    status: 'Not tested' as const,
    severity: 'Low' as const,
    confidence: 0,
    confidenceLabel: 'needs human review' as const,
    changeVsLastRun: 'Not tested' as const,
    note: 'Not scheduled in baseline checkout journey template.'
  }
];

export const INITIAL_STANDBY_STAGES: AgentStage[] = [
  {
    number: 1,
    name: 'Navigator Agent',
    role: 'Autonomous customer journey execution & screenshot capture',
    googleCloudService: 'Cloud Run + Playwright',
    status: 'Queued',
    progressPercent: 0,
    progressCount: 'Ready to launch',
    elapsedTime: '0s',
    keyOutput: 'Standing by: Ready to launch Chromium browser and execute autonomous customer shopping journey.',
    latestLogLine: 'Playwright engine ready. Click "Run analysis" to begin navigation.',
    screenshots: [],
    logs: []
  },
  {
    number: 2,
    name: 'Pattern Detector Agent',
    role: 'Visual diffing & heuristic candidate anomaly classification',
    googleCloudService: 'Groq AI / Gemini 2.5 Flash Vision',
    status: 'Locked',
    progressPercent: 0,
    progressCount: 'Standing by',
    elapsedTime: '0s',
    keyOutput: 'Standing by: Awaiting viewport captures from Stage 1 Navigator Agent.',
    latestLogLine: 'Vision AI session waiting for viewport artifacts.',
    screenshots: [],
    logs: []
  },
  {
    number: 3,
    name: 'Reasoning Agent',
    role: 'RAG regulatory retrieval & confidence-scored compliance reasoning',
    googleCloudService: 'CCPA 2023 RAG Engine',
    status: 'Locked',
    progressPercent: 0,
    progressCount: 'Standing by',
    elapsedTime: '0s',
    keyOutput: 'Standing by: Awaiting candidate dark pattern anomalies from Stage 2.',
    latestLogLine: 'RAG statutory index online and ready.',
    logs: []
  },
  {
    number: 4,
    name: 'Fix Suggestion Agent',
    role: 'Concrete technical and UX remediation synthesis per finding',
    googleCloudService: 'Remediation & Growth Optimizer',
    status: 'Locked',
    progressPercent: 0,
    progressCount: 'Standing by',
    elapsedTime: '0s',
    keyOutput: 'Standing by: Awaiting grounded legal rulings from Stage 3 Reasoning Agent.',
    latestLogLine: 'Remediation synthesis optimizer standing by.',
    logs: []
  },
  {
    number: 5,
    name: 'Compliance Trail',
    role: 'Continuous audit persistence, diff calculation & regulatory traceability',
    googleCloudService: 'MongoDB Atlas & Audit Authority',
    status: 'Locked',
    progressPercent: 0,
    progressCount: 'Standing by',
    elapsedTime: '0s',
    keyOutput: 'Standing by: Ready to seal cryptographic SHA-256 ledger and persist audit record.',
    latestLogLine: 'Audit ledger authority ready.',
    logs: []
  }
];

export const INITIAL_STANDBY_PATTERNS: PatternComparisonSummary[] = [
  {
    patternId: 'CP-01',
    patternName: 'Drip pricing',
    whereFound: 'Cart / Payment checkout (+₹30 hidden fee)',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 98,
    confidenceLabel: 'probable violation',
    changeVsLastRun: 'Still open',
    previousStatus: 'Non-compliant',
    note: 'Hidden packaging & handling fee (+₹30) injected in cart across items without storefront disclosure.'
  },
  {
    patternId: 'CP-02',
    patternName: 'Basket sneaking',
    whereFound: 'Payment add-ons (Pre-checked donation)',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 99,
    confidenceLabel: 'probable violation',
    changeVsLastRun: 'Still open',
    previousStatus: 'Non-compliant',
    note: 'Unsolicited add-on automatically pre-selected by default: Donate ₹10 to FreshCart Foundation.'
  },
  {
    patternId: 'CP-03',
    patternName: 'False urgency',
    whereFound: 'Storefront banner & Product pages',
    status: 'Non-compliant',
    severity: 'Medium',
    confidence: 96,
    confidenceLabel: 'probable violation',
    changeVsLastRun: 'Still open',
    previousStatus: 'Non-compliant',
    note: 'Manipulative countdown timer resets upon reload (was 09:49, ticked to 09:46, reset to 10:00).'
  },
  {
    patternId: 'CP-04',
    patternName: 'Subscription trap',
    whereFound: 'Plus membership cancellation',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 95,
    confidenceLabel: 'probable violation',
    changeVsLastRun: 'Still open',
    previousStatus: 'Non-compliant',
    note: 'Asymmetric cancellation architecture: 1-click enroll vs 4-screen retention labyrinth requiring typing "CANCEL".'
  },
  {
    patternId: 'CP-05',
    patternName: 'Confirm shaming',
    whereFound: 'FreshCart Plus upsell modal',
    status: 'Non-compliant',
    severity: 'High',
    confidence: 94,
    confidenceLabel: 'probable violation',
    changeVsLastRun: 'Still open',
    previousStatus: 'Non-compliant',
    note: 'Manipulative guilt copy on upsell decline button: "No thanks, I like paying extra".'
  },
  {
    patternId: 'CP-06',
    patternName: 'Forced action',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-07',
    patternName: 'Interface interference',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-08',
    patternName: 'Bait and switch',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-09',
    patternName: 'Disguised advertisement',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-10',
    patternName: 'Nagging',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-11',
    patternName: 'Trick question',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-12',
    patternName: 'SaaS billing',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  },
  {
    patternId: 'CP-13',
    patternName: 'Rogue malwares',
    whereFound: '—',
    status: 'Not tested',
    severity: 'Low',
    confidence: 0,
    confidenceLabel: 'needs human review',
    changeVsLastRun: 'Not tested',
    note: 'Not scheduled in baseline checkout journey template.'
  }
];

export const INITIAL_STANDBY_RUN: TestRun = {
  id: 'RUN-001',
  runNumber: 1,
  siteName: 'FreshCart',
  targetUrl: 'http://localhost:3000/freshcart.html',
  journeyTemplate: 'Search > cart > checkout > cancel',
  runDate: 'Today',
  formattedTime: 'Standby',
  status: 'Queued',
  variant: 'All faults',
  trigger: 'Manual',
  mode: 'Quick',
  durationSeconds: 0,
  complianceScore: 16,
  previousRunScore: 16,
  nonCompliantCount: 5,
  previousNonCompliantCount: 5,
  compliantCount: 0,
  previousCompliantCount: 0,
  needsReviewCount: 0,
  previousNeedsReviewCount: 0,
  patternCoverage: '5 of 13 tested',
  previousRunId: 'None',
  stages: INITIAL_STANDBY_STAGES,
  screenshots: [],
  patterns: INITIAL_STANDBY_PATTERNS,
  findings: GROUNDED_FINDINGS_ALL_FAULTS,
  evidenceCheckpoints: MOCK_CHECKPOINTS_RUN12,
  logs: [],
  demoHarness: {
    seededFaultsTotal: 5,
    seededFaultsFound: 5,
    falseAlarms: 0,
    genuineStockCleared: false,
    decoyBugClassified: false
  }
};

export const INITIAL_DEFAULT_RUN_12: TestRun = {
  id: 'RUN-012',
  runNumber: 12,
  siteName: 'FreshCart (demo store)',
  targetUrl: 'http://localhost:3000/freshcart.html',
  journeyTemplate: 'Search > cart > checkout > cancel',
  runDate: '13 Oct 2026',
  formattedTime: '14:20:00 IST',
  status: 'Completed',
  variant: 'Partly fixed',
  trigger: 'Manual',
  mode: 'Quick',
  durationSeconds: 98,
  complianceScore: 56, // 100 - (High 20 for CP-04) - (Med 12 for CP-03) - (Med 12 for CP-05) = 56
  previousRunScore: 16,
  nonCompliantCount: 3,
  previousNonCompliantCount: 5,
  compliantCount: 2,
  previousCompliantCount: 0,
  needsReviewCount: 1,
  previousNeedsReviewCount: 1,
  patternCoverage: '5 of 13 tested',
  previousRunId: 'RUN-011',
  stages: MOCK_STAGES_RUN12,
  screenshots: [
    '/runs/RUN-1013-173611/01_dp1_drip_pricing_before.png',
    '/runs/RUN-1013-173611/02_dp1_drip_pricing_after.png',
    '/runs/RUN-1013-173611/03_dp2_false_urgency_before.png',
    '/runs/RUN-1013-173611/04_dp2_false_urgency_after.png',
    '/runs/RUN-1013-173611/05_confirmshaming_before.png',
    '/runs/RUN-1013-173611/06_confirmshaming_after.png',
    '/runs/RUN-1013-173611/07_basket_sneaking_before.png',
    '/runs/RUN-1013-173611/08_basket_sneaking_after.png',
    '/runs/RUN-1013-173611/09_subscription_trap_before.png',
    '/runs/RUN-1013-173611/10_subscription_trap_after.png'
  ],
  patterns: MOCK_PATTERN_STATUSES_RUN12,
  findings: MOCK_FINDINGS_RUN12,
  evidenceCheckpoints: MOCK_CHECKPOINTS_RUN12,
  logs: MOCK_STAGES_RUN12.flatMap(s => s.logs),
  demoHarness: {
    seededFaultsTotal: 5,
    seededFaultsFound: 5,
    falseAlarms: 0,
    genuineStockCleared: true,
    decoyBugClassified: true
  }
};
