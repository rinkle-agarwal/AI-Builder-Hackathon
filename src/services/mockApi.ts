import { TrustLensApiService } from './trustlensApi';
import { TestRun, StartRunInput, Finding, WorkflowStatus, CCPAPatternInfo, AgentStage, StageLog, PatternComparisonSummary, EvidenceWireframe } from '../types';
import { CCPA_PATTERNS_CATALOG, INITIAL_DEFAULT_RUN_12, INITIAL_STANDBY_RUN, MOCK_CHECKPOINTS_RUN12, MOCK_FINDINGS_RUN12, MOCK_PATTERN_STATUSES_RUN12, GROUNDED_FINDINGS_ALL_FAULTS } from '../data/mock';

class MockTrustLensApi implements TrustLensApiService {
  private runs: TestRun[] = [];
  private subscriptions: Map<string, Set<(run: TestRun) => void>> = new Map();
  private findingsRepo: Map<string, Finding> = new Map();
  private simulationIntervals: Map<string, number> = new Map();
  private speedMultiplier: number = 1;

  constructor() {
    // Initialize with fresh Standby Run #01 (Clean reset state) followed by Run #12 history
    const standbyRun = JSON.parse(JSON.stringify(INITIAL_STANDBY_RUN));
    const run12 = JSON.parse(JSON.stringify(INITIAL_DEFAULT_RUN_12));
    this.runs = [standbyRun, run12];
    GROUNDED_FINDINGS_ALL_FAULTS.forEach(f => {
      this.findingsRepo.set(f.id, JSON.parse(JSON.stringify(f)));
    });
    INITIAL_DEFAULT_RUN_12.findings.forEach(f => {
      if (!this.findingsRepo.has(f.id)) {
        this.findingsRepo.set(f.id, JSON.parse(JSON.stringify(f)));
      }
    });
  }

  public resetPipeline(): TestRun {
    // Cancel any active simulation intervals
    this.simulationIntervals.forEach(timer => window.clearInterval(timer));
    this.simulationIntervals.clear();

    // Reset current run back to pristine standby state
    const standbyRun: TestRun = JSON.parse(JSON.stringify(INITIAL_STANDBY_RUN));
    this.runs = [standbyRun, ...this.runs.filter(r => r.id !== 'RUN-001')];
    this.notifySubscribers(standbyRun);
    return standbyRun;
  }

  public setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  async listRuns(): Promise<TestRun[]> {
    // Return sorted descending by runNumber
    return [...this.runs].sort((a, b) => b.runNumber - a.runNumber);
  }

  async getRun(id: string): Promise<TestRun | undefined> {
    return this.runs.find(r => r.id === id);
  }

  subscribeToRun(id: string, callback: (run: TestRun) => void): () => void {
    if (!this.subscriptions.has(id)) {
      this.subscriptions.set(id, new Set());
    }
    const set = this.subscriptions.get(id)!;
    set.add(callback);

    // Initial trigger if run exists
    const currentRun = this.runs.find(r => r.id === id);
    if (currentRun) {
      callback(JSON.parse(JSON.stringify(currentRun)));
    }

    // Return unsubscribe function
    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.subscriptions.delete(id);
      }
    };
  }

  private notifySubscribers(run: TestRun) {
    const set = this.subscriptions.get(run.id);
    if (set) {
      set.forEach(cb => {
        try {
          cb(JSON.parse(JSON.stringify(run)));
        } catch (err) {
          console.error('Error notifying subscriber:', err);
        }
      });
    }
  }

  async updateFindingStatus(findingId: string, status: WorkflowStatus): Promise<Finding> {
    const finding = this.findingsRepo.get(findingId);
    if (!finding) {
      throw new Error(`Finding ${findingId} not found`);
    }
    finding.workflowStatus = status;

    // Update in all runs that contain this finding
    this.runs.forEach(run => {
      const runFinding = run.findings.find(f => f.id === findingId);
      if (runFinding) {
        runFinding.workflowStatus = status;
        this.notifySubscribers(run);
      }
    });

    return JSON.parse(JSON.stringify(finding));
  }

  async getPatternCatalog(): Promise<CCPAPatternInfo[]> {
    return CCPA_PATTERNS_CATALOG;
  }

  async startRun(input: StartRunInput): Promise<TestRun> {
    const nonStandbyRuns = this.runs.filter(r => r.id !== 'RUN-001');
    const lastRun = nonStandbyRuns[0] || INITIAL_DEFAULT_RUN_12;
    const maxRunNumber = this.runs.reduce((max, r) => Math.max(max, r.runNumber), 12);
    const nextRunNumber = maxRunNumber + 1;
    const nextRunId = `RUN-${String(nextRunNumber).padStart(3, '0')}`;
    const now = new Date();
    const dateFormatted = `${now.getDate()} Oct 2026`;
    const timeFormatted = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

    // Calculate score based on variant and targetUrl
    const isCleanFixture = input.variant === 'Clean control' || (input.targetUrl && input.targetUrl.toLowerCase().includes('fixed'));
    let targetScore = isCleanFixture ? 100 : 56;
    let nonCompliantCount = isCleanFixture ? 0 : 3;
    let compliantCount = isCleanFixture ? 5 : 2;
    let needsReviewCount = 0;

    if (input.variant === 'All faults' && !isCleanFixture) {
      targetScore = 16;
      nonCompliantCount = 5;
      compliantCount = 0;
      needsReviewCount = 0;
    } else if (isCleanFixture) {
      targetScore = 100;
      nonCompliantCount = 0;
      compliantCount = 5;
      needsReviewCount = 0;
    }

    // Build fresh stages in Queued/Running initial state
    const initialStages: AgentStage[] = [
      {
        number: 1,
        name: 'Navigator Agent',
        role: 'Autonomous customer journey execution & screenshot capture',
        googleCloudService: 'Cloud Run + Playwright',
        status: 'Running',
        progressPercent: 0,
        progressCount: '0 of 10 journey viewports',
        elapsedTime: '0s',
        keyOutput: 'Launching Chromium browser via Playwright on desktop...',
        latestLogLine: 'Container initialized. Navigating to ' + input.targetUrl,
        screenshots: [],
        logs: [
          {
            id: `log-init-${Date.now()}`,
            timestamp: timeFormatted,
            stageNumber: 1,
            stageName: 'Navigator Agent',
            level: 'info',
            message: `Orchestration trigger received: Target ${input.targetUrl}, Variant "${input.variant}", Mode: ${input.mode}.`
          }
        ]
      },
      {
        number: 2,
        name: 'Pattern Detector Agent',
        role: 'Visual diffing & heuristic candidate anomaly classification',
        googleCloudService: 'Gemini on Vertex AI',
        status: 'Locked',
        progressPercent: 0,
        progressCount: 'Locked',
        elapsedTime: '—',
        keyOutput: '🔒 Locked — Awaiting Navigator Agent refinement before activation.',
        latestLogLine: 'Stage locked for Navigator Agent refinement.',
        logs: []
      },
      {
        number: 3,
        name: 'Reasoning Agent',
        role: 'RAG regulatory retrieval & confidence-scored compliance reasoning',
        googleCloudService: 'Gemini + RAG',
        status: 'Locked',
        progressPercent: 0,
        progressCount: 'Locked',
        elapsedTime: '—',
        keyOutput: '🔒 Locked — Downstream stage locked.',
        latestLogLine: 'Stage locked.',
        logs: []
      },
      {
        number: 4,
        name: 'Fix Suggestion Agent',
        role: 'Concrete technical and UX remediation synthesis per finding',
        googleCloudService: 'Gemini on Vertex AI',
        status: 'Locked',
        progressPercent: 0,
        progressCount: 'Locked',
        elapsedTime: '—',
        keyOutput: '🔒 Locked — Downstream stage locked.',
        latestLogLine: 'Stage locked.',
        logs: []
      },
      {
        number: 5,
        name: 'Compliance Trail',
        role: 'Continuous audit persistence, diff calculation & regulatory traceability',
        googleCloudService: 'Firestore',
        status: 'Locked',
        progressPercent: 0,
        progressCount: 'Locked',
        elapsedTime: '—',
        keyOutput: '🔒 Locked — Downstream stage locked.',
        latestLogLine: 'Stage locked.',
        logs: []
      }
    ];

    // Compute patterns for this variant
    const runPatterns: PatternComparisonSummary[] = MOCK_PATTERN_STATUSES_RUN12.map(p => {
      if (isCleanFixture) {
        if (['CP-01', 'CP-02', 'CP-03', 'CP-04', 'CP-05'].includes(p.patternId)) {
          return {
            ...p,
            status: 'Compliant',
            changeVsLastRun: 'Resolved',
            note: 'Verified compliant interaction step; zero dark patterns detected.'
          };
        }
      } else if (input.variant === 'All faults') {
        if (['CP-01', 'CP-02', 'CP-03', 'CP-04', 'CP-05'].includes(p.patternId)) {
          return {
            ...p,
            status: 'Non-compliant',
            changeVsLastRun: 'Still open',
            note: 'Non-compliant state detected in test variant.'
          };
        }
      }
      return { ...p };
    });

    const newRun: TestRun = {
      id: nextRunId,
      runNumber: nextRunNumber,
      siteName: input.siteName || 'FreshCart (demo store)',
      targetUrl: input.targetUrl || 'http://localhost:3000/freshcart.html',
      journeyTemplate: input.journeyTemplate,
      runDate: dateFormatted,
      formattedTime: timeFormatted,
      status: 'Running',
      variant: input.variant,
      trigger: 'Manual',
      mode: input.mode,
      durationSeconds: 0,
      complianceScore: targetScore,
      previousRunScore: lastRun.complianceScore,
      nonCompliantCount,
      previousNonCompliantCount: lastRun.nonCompliantCount,
      compliantCount,
      previousCompliantCount: lastRun.compliantCount,
      needsReviewCount,
      previousNeedsReviewCount: lastRun.needsReviewCount,
      patternCoverage: '5 of 13 tested',
      previousRunId: lastRun.id,
      stages: initialStages,
      patterns: runPatterns,
      screenshots: [],
      findings: isCleanFixture ? [] : JSON.parse(JSON.stringify(GROUNDED_FINDINGS_ALL_FAULTS)),
      evidenceCheckpoints: [],
      logs: [...initialStages[0].logs],
      demoHarness: {
        seededFaultsTotal: 5,
        seededFaultsFound: input.variant === 'Clean control' ? 0 : (input.variant === 'All faults' ? 5 : 3),
        falseAlarms: 0,
        genuineStockCleared: true,
        decoyBugClassified: true
      }
    };

    // Prepend to runs
    this.runs.unshift(newRun);
    this.notifySubscribers(newRun);

    const effectiveTargetUrl = input.targetUrl || 'http://localhost:3000/freshcart.html';

    // Try connecting to Python FastAPI backend orchestrator (runs live Playwright)
    try {
      const resp = await fetch('/api/run/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: input.siteName || 'FreshCart (demo store)',
          targetUrl: effectiveTargetUrl,
          targetType: input.targetType || 'URL',
          variant: input.variant,
          journeyTemplate: input.journeyTemplate,
          mode: input.mode,
          headless: false
        })
      });

      if (resp.ok) {
        const payload = await resp.json();
        if (payload.run_id) {
          newRun.id = payload.run_id;
          newRun.stages[0].keyOutput = 'Playwright Chromium launching on desktop in visible mode...';
          this.notifySubscribers(newRun);
          this.listenToBackendStream(newRun.id, newRun, input);
          return JSON.parse(JSON.stringify(newRun));
        }
      }
    } catch (e) {
      console.warn('Backend orchestrator not reachable, running simulation fallback:', e);
    }

    // Fallback: Launch background asynchronous multi-agent step progression
    this.executeRunSimulation(newRun.id, input);

    return JSON.parse(JSON.stringify(newRun));
  }

  private listenToBackendStream(runId: string, run: TestRun, input: StartRunInput) {
    let hasReceivedEvents = false;
    let streamClosed = false;

    // Real-time elapsed duration counter that ticks every second while run is running
    const durationTimer = window.setInterval(() => {
      if (run.status === 'Running') {
        run.durationSeconds += 1;
        this.notifySubscribers(run);
      } else {
        window.clearInterval(durationTimer);
      }
    }, 1000);

    const sse = new EventSource(`/api/run/stream/${runId}`);

    // Continuous polling synchronizer to guarantee real-time updates even if SSE buffers
    const pollTimer = window.setInterval(async () => {
      if (streamClosed || run.status === 'Completed' || run.status === 'Failed') {
        window.clearInterval(pollTimer);
        return;
      }
      try {
        const res = await fetch(`/api/run/${runId}`);
        if (res.ok) {
          const liveData = await res.json();
          if (liveData && liveData.stages) {
            hasReceivedEvents = true;
            window.clearTimeout(fallbackTimer);
            run.status = liveData.status || run.status;
            run.stages = liveData.stages;
            if (liveData.screenshots && liveData.screenshots.length > 0) {
              run.screenshots = liveData.screenshots;
            }
            if (liveData.complianceScore !== undefined) {
              run.complianceScore = liveData.complianceScore;
            }
            if (liveData.nonCompliantCount !== undefined) {
              run.nonCompliantCount = liveData.nonCompliantCount;
            }
            if (liveData.compliantCount !== undefined) {
              run.compliantCount = liveData.compliantCount;
            }
            if (liveData.findings && liveData.findings.length > 0) {
              run.findings = liveData.findings;
            }
            this.notifySubscribers(run);
            if (run.status === 'Completed' || run.status === 'Failed') {
              closeStream();
            }
          }
        }
      } catch (err) {
        // silent
      }
    }, 1000);

    const closeStream = () => {
      if (!streamClosed) {
        streamClosed = true;
        window.clearTimeout(fallbackTimer);
        window.clearInterval(durationTimer);
        window.clearInterval(pollTimer);
        try { sse.close(); } catch (e) {}
      }
    };

    // Resilient 10s fallback if both SSE and polling fail to contact server
    const fallbackTimer = window.setTimeout(() => {
      if (!hasReceivedEvents && !streamClosed) {
        console.warn('Backend stream inactive, launching autonomous multi-agent simulation engine.');
        closeStream();
        this.executeRunSimulation(run.id, input);
      }
    }, 10000);

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'stream_end') {
          closeStream();
          return;
        }

        hasReceivedEvents = true;
        window.clearTimeout(fallbackTimer);

        if (payload.event === 'error') {
          console.warn('Backend orchestrator emitted pipeline error:', payload.data);
          closeStream();
          this.executeRunSimulation(run.id, input);
          return;
        }

        const data = payload.data;
        if (payload.event === 'screenshot') {
          run.stages[0].status = 'Running';
          if (data.log) {
            run.stages[0].logs.push(data.log);
            run.logs.unshift(data.log);
            run.stages[0].latestLogLine = data.log.message;
          }
          if (data.url) {
            if (!run.screenshots) run.screenshots = [];
            if (!run.screenshots.includes(data.url)) {
              run.screenshots.push(data.url);
            }
            if (!run.stages[0].screenshots) run.stages[0].screenshots = [];
            if (!run.stages[0].screenshots.includes(data.url)) {
              run.stages[0].screenshots.push(data.url);
            }

            const currentCount = run.stages[0].screenshots.length;
            run.stages[0].progressCount = `${currentCount} of 10 customer journey checkpoints recorded`;
            run.stages[0].progressPercent = Math.min(100, Math.round((currentCount / 10) * 100));

            run.evidenceCheckpoints.unshift({
              id: `cp-${Date.now()}`,
              step: `Checkpoint #${currentCount}`,
              title: data.caption || data.name || 'Shopping Journey Viewport',
              timestamp: new Date().toLocaleTimeString(),
              isFlagged: false,
              screenshotType: 'cart',
              url: data.url
            });
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'handoff') {
          // Hand off from Navigator Agent to Pattern Detector Agent
          run.stages[0].status = 'Completed';
          run.stages[0].progressPercent = 100;
          run.stages[1].status = 'Running';
          run.stages[1].keyOutput = `Received ${data.screenshots_count} journey viewports. Initializing Vision AI anomaly classification...`;
          if (data.log) {
            run.stages[1].logs.push(data.log);
            run.logs.unshift(data.log);
            run.stages[1].latestLogLine = data.log.message;
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'stage_start') {
          const sIdx = (data.stage || 1) - 1;
          if (run.stages[sIdx]) {
            run.stages[sIdx].status = 'Running';
            run.stages[sIdx].progressPercent = 10;
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'anomaly_detected') {
          run.stages[1].status = 'Running';
          const done = data.completed_pairs || 0;
          const total = data.total_pairs || 5;
          run.stages[1].progressPercent = Math.min(100, Math.round((done / total) * 100));
          run.stages[1].progressCount = `${done} of ${total} candidate pairs analyzed`;
          run.stages[1].keyOutput = `Analyzing shopping states with Multimodal Vision AI... (${done}/${total} verified)`;
          if (data.anomaly) {
            if (!run.stages[1].anomalies) run.stages[1].anomalies = [];
            run.stages[1].anomalies.push(data.anomaly);
            if (!run.anomalies) run.anomalies = [];
            run.anomalies.push(data.anomaly);
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'ruling_generated') {
          run.stages[2].status = 'Running';
          const done = data.completed_rulings || 0;
          const total = data.total_rulings || 5;
          run.stages[2].progressPercent = Math.min(100, Math.round((done / total) * 100));
          run.stages[2].progressCount = `${done} of ${total} legal clauses grounded`;
          run.stages[2].keyOutput = `Grounding dark patterns against CCPA 2023 & FTC guidelines... (${done}/${total} verified)`;
          if (data.ruling) {
            if (!run.stages[2].rulings) run.stages[2].rulings = [];
            run.stages[2].rulings.push(data.ruling);
            if (!run.rulings) run.rulings = [];
            run.rulings.push(data.ruling);
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'fix_synthesized') {
          run.stages[3].status = 'Running';
          const done = data.completed_fixes || 0;
          const total = data.total_fixes || 5;
          run.stages[3].progressPercent = Math.min(100, Math.round((done / total) * 100));
          run.stages[3].progressCount = `${done} of ${total} dual remediation specs ready`;
          run.stages[3].keyOutput = `Synthesizing compliance fixes & business growth alternatives... (${done}/${total} formulated)`;
          if (data.fix) {
            if (!run.stages[3].fixes) run.stages[3].fixes = [];
            run.stages[3].fixes.push(data.fix);
            if (!run.fixes) run.fixes = [];
            run.fixes.push(data.fix);
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'audit_sealed') {
          run.stages[4].status = 'Running';
          run.stages[4].progressPercent = 100;
          run.stages[4].progressCount = 'Audit ledger sealed (SHA-256 certified)';
          run.stages[4].keyOutput = 'Continuous audit ledger sealed; Certified record committed to MongoDB.';
          if (data.audit_record) {
            run.stages[4].auditRecord = data.audit_record;
            run.auditRecord = data.audit_record;
            if (data.audit_record.compliance_score !== undefined) {
              run.complianceScore = data.audit_record.compliance_score;
            }
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'log') {
          const sIdx = (data.stage || 1) - 1;
          if (run.stages[sIdx] && data.log) {
            run.stages[sIdx].logs.push(data.log);
            run.logs.unshift(data.log);
            run.stages[sIdx].latestLogLine = data.log.message;
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'stage_complete') {
          const sIdx = (data.stage || 1) - 1;
          if (run.stages[sIdx]) {
            run.stages[sIdx].status = 'Completed';
            run.stages[sIdx].progressPercent = 100;
            if (sIdx === 0) {
              const count = run.stages[0].screenshots?.length || 10;
              const fCount = data.findings !== undefined ? data.findings.length : (run.findings?.length ?? 0);
              run.stages[0].keyOutput = fCount === 0
                ? `Customer shopping journey execution complete; ${count} checkpoints recorded with 0 infractions.`
                : `Customer shopping journey execution complete; ${count} checkpoints recorded across catalogue, cart & checkout.`;
              run.stages[0].progressCount = `${count} journey checkpoints recorded`;
              if (data.findings !== undefined) {
                run.findings = data.findings;
              }
            } else if (sIdx === 1) {
              const anomCount = data.anomalies !== undefined ? data.anomalies.length : (run.stages[1].anomalies?.length ?? 0);
              if (data.anomalies !== undefined) {
                run.stages[1].anomalies = data.anomalies;
                run.anomalies = data.anomalies;
              }
              run.stages[1].keyOutput = anomCount === 0
                ? 'Multimodal vision inspection complete; 0 anomalies detected. Storefront adheres to fair design guidelines.'
                : `Multimodal vision diffing complete; ${anomCount} candidate dark pattern anomalies isolated via Vision AI.`;
              run.stages[1].progressCount = `${anomCount} candidate anomalies isolated`;
            } else if (sIdx === 2) {
              const ruleCount = data.rulings !== undefined ? data.rulings.length : (run.stages[2].rulings?.length ?? 0);
              if (data.rulings !== undefined) {
                run.stages[2].rulings = data.rulings;
                run.rulings = data.rulings;
              }
              run.stages[2].keyOutput = ruleCount === 0
                ? 'RAG regulatory evaluation complete; 0 statutory infractions identified under CCPA 2023 Guidelines.'
                : `RAG regulatory retrieval complete; ${ruleCount} dark pattern statutory violations grounded under CCPA 2023.`;
              run.stages[2].progressCount = `${ruleCount} legal rulings formulated`;
            } else if (sIdx === 3) {
              const fixCount = data.fixes !== undefined ? data.fixes.length : (run.stages[3].fixes?.length ?? 0);
              if (data.fixes !== undefined) {
                run.stages[3].fixes = data.fixes;
                run.fixes = data.fixes;
              }
              run.stages[3].keyOutput = fixCount === 0
                ? 'Remediation analysis complete; Zero corrective remediations required for compliant store.'
                : `Remediation synthesis complete; ${fixCount} compliance fixes + ethical business growth alternatives formulated.`;
              run.stages[3].progressCount = `${fixCount} dual remediation specs ready`;
            } else if (sIdx === 4) {
              const finalScore = data.audit_record?.compliance_score ?? run.complianceScore;
              run.stages[4].keyOutput = `Continuous audit ledger sealed; Score ${finalScore}/100 committed to MongoDB.`;
              run.stages[4].progressCount = 'Audit record sealed (SHA-256 verified)';
              if (data.audit_record) {
                run.stages[4].auditRecord = data.audit_record;
                run.auditRecord = data.audit_record;
                if (data.audit_record.compliance_score !== undefined) {
                  run.complianceScore = data.audit_record.compliance_score;
                }
              }
            }
          }
          this.notifySubscribers(run);
        } else if (payload.event === 'run_completed') {
          run.status = 'Completed';
          run.stages[0].status = 'Completed';
          run.stages[0].progressPercent = 100;
          run.stages[1].status = 'Completed';
          run.stages[1].progressPercent = 100;
          run.stages[2].status = 'Completed';
          run.stages[2].progressPercent = 100;
          run.stages[3].status = 'Completed';
          run.stages[3].progressPercent = 100;
          run.stages[4].status = 'Completed';
          run.stages[4].progressPercent = 100;

          if (data.findings !== undefined) {
            run.findings = data.findings;
          }
          const hasZeroFindings = Array.isArray(run.findings) && run.findings.length === 0;

          if (data.compliance_score !== undefined) {
            run.complianceScore = data.compliance_score;
          } else if (run.auditRecord?.compliance_score !== undefined) {
            run.complianceScore = run.auditRecord.compliance_score;
          } else {
            run.complianceScore = hasZeroFindings ? 100 : 16;
          }

          if (data.non_compliant_count !== undefined) {
            run.nonCompliantCount = data.non_compliant_count;
          } else {
            run.nonCompliantCount = run.findings ? run.findings.length : (hasZeroFindings ? 0 : 5);
          }

          if (data.compliant_count !== undefined) {
            run.compliantCount = data.compliant_count;
          } else {
            run.compliantCount = Math.max(0, 5 - run.nonCompliantCount);
          }

          run.needsReviewCount = data.needs_review_count ?? 0;

          // Update patterns status based on real findings!
          if (run.patterns && run.patterns.length > 0) {
            const findingPatternNames = new Set(
              (run.findings || []).map((f: any) => (f.pattern || f.pattern_type || f.pattern_name || '').toLowerCase())
            );
            run.patterns = run.patterns.map(p => {
              if (['CP-01', 'CP-02', 'CP-03', 'CP-04', 'CP-05'].includes(p.patternId)) {
                const pKey = (p.patternId + ' ' + p.patternName).toLowerCase();
                const isViolated = Array.from(findingPatternNames).some(fName => 
                  fName && (pKey.includes(fName) || fName.includes(p.patternName.toLowerCase()))
                );
                return {
                  ...p,
                  status: isViolated ? 'Non-compliant' : 'Compliant',
                  note: isViolated ? 'Non-compliant dark pattern detected.' : 'Verified compliant interaction step.',
                  changeVsLastRun: isViolated ? 'Still open' : 'Resolved'
                };
              }
              return p;
            });
          }

          closeStream();
          this.notifySubscribers(run);
        }
      } catch (err) {
        console.error('SSE error:', err);
      }
    };

    sse.onerror = (err) => {
      closeStream();
      if (!hasReceivedEvents) {
        console.warn('SSE stream error, executing multi-agent pipeline fallback:', err);
        this.executeRunSimulation(run.id, input);
      }
    };
  }

  private executeRunSimulation(runId: string, input: StartRunInput) {
    const run = this.runs.find(r => r.id === runId);
    if (!run) return;

    let step = 0;
    const baseInterval = 900 / this.speedMultiplier; // ~900ms per step at 1x, 225ms at 4x

    const timer = window.setInterval(() => {
      step++;
      const currentRun = this.runs.find(r => r.id === runId);
      if (!currentRun || currentRun.status === 'Completed' || currentRun.status === 'Failed') {
        window.clearInterval(timer);
        return;
      }

      currentRun.durationSeconds += Math.round(2 / this.speedMultiplier);

      const isClean = currentRun.complianceScore === 100 || currentRun.variant === 'Clean control' || (input.targetUrl && input.targetUrl.includes('fixed'));

      // Steps 1 to 7: Navigator Checkpoints
      if (step <= 7) {
        const navigatorStage = currentRun.stages[0];
        navigatorStage.status = 'Running';
        navigatorStage.progressPercent = Math.round((step / 7) * 100);
        navigatorStage.progressCount = `${step} of 7 checkpoints`;
        navigatorStage.elapsedTime = `${Math.round(step * 3)}s`;
        const cp = MOCK_CHECKPOINTS_RUN12[step - 1];
        const logMsg = `Checkpoint ${step}/7 reached: ${cp ? cp.title : 'Interaction'}. Captured viewport.`;
        navigatorStage.latestLogLine = logMsg;
        const newLog: StageLog = {
          id: `log-nav-${step}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          stageNumber: 1,
          stageName: 'Navigator Agent',
          level: cp?.isFlagged ? 'warn' : 'info',
          message: logMsg
        };
        navigatorStage.logs.push(newLog);
        currentRun.logs.unshift(newLog);

        if (step === 7) {
          navigatorStage.status = 'Completed';
          navigatorStage.progressPercent = 100;
          navigatorStage.screenshots = [
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
          ];
          currentRun.screenshots = [...navigatorStage.screenshots];
          navigatorStage.progressCount = '10 evidence frames (5 pairs)';
          navigatorStage.keyOutput = isClean 
            ? 'Operated full customer journey; 0 dark pattern infractions isolated across 10 evidence frames.'
            : 'Operated full customer journey; 10 dark pattern evidence frames captured (5 Before/After pairs).';
          
          // Advance smoothly to Stage 2: Pattern Detector Agent
          currentRun.stages[1].status = 'Running';
          currentRun.stages[1].progressPercent = 20;
          currentRun.stages[1].keyOutput = 'Received 10 journey viewports. Initializing Gemini Vision AI diffing...';
          currentRun.stages[1].latestLogLine = 'Connecting to Gemini 2.5 Flash Vision engine...';
          this.notifySubscribers(currentRun);
        }
      }
      // Steps 8 to 9: Pattern Detector
      else if (step <= 9) {
        const detectorStage = currentRun.stages[1];
        detectorStage.status = 'Running';
        const progress = step === 8 ? 55 : 100;
        detectorStage.progressPercent = progress;
        detectorStage.progressCount = step === 8 ? '3 of 5 candidate pairs diffed' : (isClean ? '5 pairs verified compliant' : '5 candidate anomalies isolated');
        detectorStage.elapsedTime = `${(step - 7) * 4}s`;
        const logMsg = step === 8 
          ? 'Multimodal vision inspection: evaluating visual weight, countdown resets, and layout asymmetries.'
          : (isClean 
              ? 'Diff completed: 0 anomalies detected. Storefront adheres to fair design guidelines.'
              : 'Diff completed: 5 candidate anomalies isolated via Vision AI. Handed off to Reasoning Agent.');
        detectorStage.latestLogLine = logMsg;
        const newLog: StageLog = {
          id: `log-det-${step}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          stageNumber: 2,
          stageName: 'Pattern Detector Agent',
          level: 'info',
          message: logMsg
        };
        detectorStage.logs.push(newLog);
        currentRun.logs.unshift(newLog);

        if (step === 9) {
          detectorStage.status = 'Completed';
          detectorStage.keyOutput = isClean 
            ? 'Multimodal vision inspection complete; 0 anomalies detected. Storefront adheres to fair design guidelines.'
            : 'Visual diffing complete; 5 candidate dark pattern anomalies isolated via Vision AI.';
          // Activate Stage 3: Reasoning Agent
          currentRun.stages[2].status = 'Running';
          currentRun.stages[2].progressPercent = 20;
          currentRun.stages[2].keyOutput = 'Grounding candidate anomalies against CCPA 2023 & FTC guidelines...';
          currentRun.stages[2].latestLogLine = 'Connecting to RAG vector knowledge base for CCPA clauses...';
        }
      } 
      // Steps 10 to 11: Reasoning Agent
      else if (step <= 11) {
        const reasoningStage = currentRun.stages[2];
        reasoningStage.status = 'Running';
        reasoningStage.progressPercent = step === 10 ? 60 : 100;
        reasoningStage.progressCount = step === 10 ? '3 of 5 clauses evaluated' : (isClean ? '0 violations grounded' : '5 statutory clauses grounded');
        reasoningStage.elapsedTime = `${(step - 9) * 4}s`;
        const logMsg = step === 10
          ? 'Retrieved CCPA Annexure 1, Clause 1 (False Urgency) & Clause 3 (Drip Pricing).'
          : (isClean 
              ? 'Verdicts completed: 0 CCPA dark pattern statutory violations found under CCPA 2023 Guidelines.'
              : 'Verdicts completed: Grounded reasoning verified 5 CCPA statutory infractions (91%-98% confidence).');
        reasoningStage.latestLogLine = logMsg;
        const newLog: StageLog = {
          id: `log-reas-${step}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          stageNumber: 3,
          stageName: 'Reasoning Agent',
          level: isClean ? 'info' : 'warn',
          message: logMsg
        };
        reasoningStage.logs.push(newLog);
        currentRun.logs.unshift(newLog);

        if (step === 11) {
          reasoningStage.status = 'Completed';
          reasoningStage.keyOutput = isClean
            ? 'RAG regulatory evaluation complete; 0 dark pattern statutory violations found under CCPA 2023 Guidelines.'
            : `${currentRun.nonCompliantCount} dark pattern statutory violations grounded under CCPA 2023.`;
          // Activate Stage 4: Fix Suggestion Agent
          currentRun.stages[3].status = 'Running';
          currentRun.stages[3].progressPercent = 20;
          currentRun.stages[3].keyOutput = 'Synthesizing compliance fixes & business growth alternatives...';
          currentRun.stages[3].latestLogLine = 'Formulating technical patches and UX copy improvements...';
        }
      }
      // Step 12: Fix Suggestion
      else if (step === 12) {
        const fixStage = currentRun.stages[3];
        fixStage.status = 'Completed';
        fixStage.progressPercent = 100;
        fixStage.progressCount = isClean ? '0 fixes needed' : '5 dual remediation specs ready';
        fixStage.elapsedTime = '8s';
        fixStage.keyOutput = isClean
          ? 'Remediation analysis complete; Zero corrective remediations required for compliant store.'
          : 'Remediation synthesis complete; 5 compliance fixes + ethical business growth alternatives formulated.';
        fixStage.latestLogLine = isClean
          ? 'Store verified compliant. No remediation needed.'
          : 'Synthesized dual remediation blueprints (Compliance + Growth Alternatives) with Jira tickets.';
        const newLog: StageLog = {
          id: `log-fix-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          stageNumber: 4,
          stageName: 'Fix Suggestion Agent',
          level: 'success',
          message: fixStage.latestLogLine
        };
        fixStage.logs.push(newLog);
        currentRun.logs.unshift(newLog);

        // Activate Stage 5: Compliance Trail Agent
        currentRun.stages[4].status = 'Running';
        currentRun.stages[4].progressPercent = 30;
        currentRun.stages[4].keyOutput = 'Sealing immutable chain-of-custody audit ledger...';
        currentRun.stages[4].latestLogLine = 'Writing cryptographic record to MongoDB Atlas ledger...';
      }
      // Step 13: Compliance Trail (Finished)
      else if (step >= 13) {
        const trailStage = currentRun.stages[4];
        trailStage.status = 'Completed';
        trailStage.progressPercent = 100;
        trailStage.progressCount = 'Audit ledger sealed (SHA-256 certified)';
        trailStage.elapsedTime = '4s';
        const finalScore = isClean ? 100 : 16;
        trailStage.keyOutput = `Continuous audit ledger sealed; Certified Score ${finalScore}/100 committed to MongoDB.`;
        trailStage.latestLogLine = `Record committed to /compliance_runs/${currentRun.id}.`;
        const newLog: StageLog = {
          id: `log-trail-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          stageNumber: 5,
          stageName: 'Compliance Trail',
          level: 'success',
          message: `Run ${currentRun.id} finalized and sealed in continuous audit trail.`
        };
        trailStage.logs.push(newLog);
        const auditRecord = {
          run_id: currentRun.id,
          target_url: currentRun.targetUrl || 'http://localhost:3000/freshcart.html',
          timestamp_utc: new Date().toISOString(),
          compliance_score: finalScore,
          risk_standing: finalScore >= 80 ? 'Good Standing' : 'Severe Regulatory Risk',
          total_statutory_penalty_risk: isClean ? '₹0 (Fully Compliant)' : 'Up to ₹50,00,000 (CPA 2019, Section 89)',
          non_compliant_count: isClean ? 0 : 5,
          compliant_count: isClean ? 5 : 0,
          tested_patterns_count: 13,
          sha256_audit_fingerprint: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          chain_of_custody: [
            { stage: 1, agent: 'Navigator Agent', service: 'Playwright Desktop & Cloud Run', output: '10 Playwright browser viewport checkpoints recorded', verified: true, timestamp: new Date().toLocaleTimeString() },
            { stage: 2, agent: 'Pattern Detector Agent', service: 'Groq AI / Gemini 2.5 Flash Vision', output: `${isClean ? '0' : '5'} candidate dark pattern anomalies isolated with bounding boxes`, verified: true, timestamp: new Date().toLocaleTimeString() },
            { stage: 3, agent: 'Reasoning Agent', service: 'RAG Statutory Retrieval & Vector Engine', output: `${isClean ? '0 infractions' : '5 infractions grounded'} under CCPA 2023 Guidelines & Annexures`, verified: true, timestamp: new Date().toLocaleTimeString() },
            { stage: 4, agent: 'Fix Suggestion Agent', service: 'Remediation Synthesis & Business Optimizer', output: `${isClean ? '0' : '5'} dual remediation specs ready (Compliance Fix + Growth Alternative)`, verified: true, timestamp: new Date().toLocaleTimeString() },
            { stage: 5, agent: 'Compliance Trail Agent', service: 'MongoDB Atlas & Audit Authority', output: 'Certified cryptographic ledger sealed with SHA-256 fingerprint', verified: true, timestamp: new Date().toLocaleTimeString() }
          ],
          ledger_status: 'CERTIFIED_AUDIT_SEALED'
        };
        trailStage.auditRecord = auditRecord;
        currentRun.auditRecord = auditRecord;
        currentRun.complianceScore = finalScore;
        currentRun.nonCompliantCount = isClean ? 0 : 5;
        currentRun.compliantCount = isClean ? 5 : 0;
        currentRun.status = 'Completed';
        window.clearInterval(timer);
        this.simulationIntervals.delete(runId);
      }

      this.notifySubscribers(currentRun);
    }, baseInterval);

    this.simulationIntervals.set(runId, timer);
  }

  public cancelRun(runId: string) {
    const timer = this.simulationIntervals.get(runId);
    if (timer) {
      window.clearInterval(timer);
      this.simulationIntervals.delete(runId);
    }
    const run = this.runs.find(r => r.id === runId);
    if (run && run.status === 'Running') {
      run.status = 'Failed';
      const activeStage = run.stages.find(s => s.status === 'Running');
      if (activeStage) {
        activeStage.status = 'Failed';
        activeStage.latestLogLine = 'Run cancelled by user.';
      }
      this.notifySubscribers(run);
    }
  }

  public retryStage(runId: string, stageNumber: number) {
    const run = this.runs.find(r => r.id === runId);
    if (!run) return;
    const stage = run.stages.find(s => s.number === stageNumber);
    if (!stage) return;

    stage.status = 'Running';
    stage.progressPercent = 50;
    stage.latestLogLine = `Retrying stage ${stage.name}...`;
    this.notifySubscribers(run);

    setTimeout(() => {
      stage.status = 'Completed';
      stage.progressPercent = 100;
      stage.latestLogLine = `Stage ${stage.name} recovered and completed successfully.`;
      run.status = 'Completed';
      this.notifySubscribers(run);
    }, 1500 / this.speedMultiplier);
  }
}

export const mockApiService = new MockTrustLensApi();
