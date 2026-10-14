import { TestRun, StartRunInput, Finding, WorkflowStatus, CCPAPatternInfo } from '../types';

export interface TrustLensApiService {
  listRuns(): Promise<TestRun[]>;
  getRun(id: string): Promise<TestRun | undefined>;
  subscribeToRun(id: string, callback: (run: TestRun) => void): () => void;
  startRun(input: StartRunInput): Promise<TestRun>;
  updateFindingStatus(findingId: string, status: WorkflowStatus): Promise<Finding>;
  getPatternCatalog(): Promise<CCPAPatternInfo[]>;
}
