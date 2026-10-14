export type PatternStatus = 'Compliant' | 'Non-compliant' | 'Needs review' | 'Not tested';

export type PatternSeverity = 'High' | 'Medium' | 'Low' | 'Info';

export type FindingConfidenceLabel = 'probable violation' | 'likely bug' | 'needs human review';

export type WorkflowStatus = 'Open' | 'In progress' | 'Fixed' | 'Accepted risk';

export type StageStatus = 'Queued' | 'Running' | 'Completed' | 'Needs attention' | 'Failed' | 'Locked';

export type TestVariant = 'All faults' | 'Partly fixed' | 'Clean control';

export type TestTrigger = 'Manual' | 'Scheduled' | 'Release hook';

export interface CCPAPatternInfo {
  id: string; // e.g., 'CP-01'
  name: string;
  definition: string;
  testedByTrustLens: boolean;
  officialClause: string;
  annexureRef: string;
  issuingAuthority: string;
  dateEnacted: string;
  version: string;
  sampleGuidelineText: string;
  enforcementPrecedents?: string;
  commonOccurrence: string;
}

export interface PatternComparisonSummary {
  patternId: string;
  patternName: string;
  whereFound: string;
  status: PatternStatus;
  severity: PatternSeverity;
  confidence: number; // percentage 0-100
  confidenceLabel: FindingConfidenceLabel;
  changeVsLastRun: 'Resolved' | 'Still open' | 'New' | 'Regressed' | 'Unchanged' | 'Not tested';
  previousStatus?: PatternStatus;
  note: string;
}

export interface EvidenceWireframe {
  id: string;
  step: string;
  title: string;
  timestamp: string;
  isFlagged: boolean;
  screenshotType: 'cart' | 'payment' | 'urgency_product' | 'cancellation_flow' | 'confirm_shaming' | 'bug_counter' | 'genuine_stock';
  url: string;
  highlightBox?: {
    label: string;
    description: string;
  };
  beforeAfterComparison?: {
    beforeLabel: string;
    afterLabel: string;
    detectedDiff: string;
  };
}

export interface Finding {
  id: string; // e.g., 'F1', 'F3a'
  patternId: string;
  patternName: string;
  title: string;
  status: PatternStatus;
  severity: PatternSeverity;
  confidence: number;
  confidenceLabel: FindingConfidenceLabel;
  confidenceReason: string;
  journeyStep: string;
  firstSeen: string;
  workflowStatus: WorkflowStatus;
  whatChanged: string;
  whyItMatters: {
    ruleTitle: string;
    issuingAuthority: string;
    section: string;
    versionDate: string;
    excerpt: string;
  };
  enforcementPrecedent?: {
    entity: string;
    penalty: string;
    context: string;
  };
  suggestedFix: string;
  stockClaimData?: {
    product: string;
    labelShown: string;
    unitsAvailable: number;
    verdict: string;
  }[];
  runHistory: {
    runId: string;
    date: string;
    status: PatternStatus;
    score: number;
  }[];
  evidenceBeforeUrl?: string;
  evidenceAfterUrl?: string;
  evidenceScreenshotType?: 'cart' | 'payment' | 'urgency_product' | 'cancellation_flow' | 'confirm_shaming' | 'bug_counter' | 'genuine_stock';
  jiraTicket?: string;
  jiraStatus?: 'To Do' | 'In Progress' | 'Done';
}

export interface StageLog {
  id: string;
  timestamp: string;
  stageNumber: number;
  stageName: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

export interface AgentStage {
  number: number;
  name: string;
  role: string;
  googleCloudService: string;
  status: StageStatus;
  progressPercent: number;
  progressCount: string; // e.g., '7 of 7 checkpoints'
  elapsedTime: string;
  keyOutput: string;
  latestLogLine: string;
  logs: StageLog[];
  screenshots?: string[];
  anomalies?: any[];
  rulings?: any[];
  fixes?: any[];
  auditRecord?: any;
  detailedOutputs?: Record<string, any>;
}

export interface TestRun {
  id: string; // e.g., 'RUN-012'
  runNumber: number; // 12
  siteName: string;
  targetUrl: string;
  journeyTemplate: string;
  runDate: string;
  formattedTime: string;
  status: 'Completed' | 'Running' | 'Failed' | 'Queued';
  variant: TestVariant;
  trigger: TestTrigger;
  mode: 'Quick' | 'Full';
  durationSeconds: number;
  complianceScore: number;
  previousRunScore: number;
  nonCompliantCount: number;
  previousNonCompliantCount: number;
  compliantCount: number;
  previousCompliantCount: number;
  needsReviewCount: number;
  previousNeedsReviewCount: number;
  patternCoverage: string; // '5 of 13 tested'
  previousRunId: string;
  stages: AgentStage[];
  screenshots?: string[];
  anomalies?: any[];
  rulings?: any[];
  fixes?: any[];
  auditRecord?: any;
  patterns: PatternComparisonSummary[];
  findings: Finding[];
  evidenceCheckpoints: EvidenceWireframe[];
  logs: StageLog[];
  demoHarness: {
    seededFaultsTotal: number;
    seededFaultsFound: number;
    falseAlarms: number;
    genuineStockCleared: boolean;
    decoyBugClassified: boolean;
  };
}

export interface ReleaseMarker {
  date: string;
  version: string;
  title: string;
  description: string;
  scoreImpact: number;
}

export interface StartRunInput {
  siteName: string;
  targetUrl: string;
  targetType: 'URL' | 'HTML';
  variant: TestVariant;
  journeyTemplate: string;
  inventoryFileName?: string;
  mode: 'Quick' | 'Full';
  credentialsProvided?: boolean;
}
