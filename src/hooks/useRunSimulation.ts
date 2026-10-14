import { useState, useEffect, useCallback, useRef } from 'react';
import { TestRun, StartRunInput, WorkflowStatus } from '../types';
import { mockApiService } from '../services/mockApi';

export function useRunSimulation(initialRunId: string = 'RUN-001') {
  const [selectedRunId, setSelectedRunId] = useState<string>(initialRunId);
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [runsList, setRunsList] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [speed, setSpeedState] = useState<number>(1);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load runs list
  const refreshRuns = useCallback(async () => {
    const runs = await mockApiService.listRuns();
    setRunsList(runs);
    if (!currentRun && runs.length > 0) {
      const match = runs.find(r => r.id === selectedRunId) || runs[0];
      setCurrentRun(match);
      setSelectedRunId(match.id);
    }
  }, [selectedRunId, currentRun]);

  // Subscribe to the selected run
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const unsub = mockApiService.subscribeToRun(selectedRunId, (updatedRun) => {
      if (isMounted) {
        setCurrentRun(updatedRun);
        setLoading(false);
        // Also update in runsList
        setRunsList(prev => {
          const idx = prev.findIndex(r => r.id === updatedRun.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedRun;
            return copy;
          }
          return [updatedRun, ...prev];
        });
      }
    });

    unsubscribeRef.current = unsub;

    // Refresh list in background
    mockApiService.listRuns().then(r => {
      if (isMounted) {
        setRunsList(r);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedRunId]);

  const selectRun = useCallback((id: string) => {
    setSelectedRunId(id);
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    mockApiService.setSpeedMultiplier(newSpeed);
    setSpeedState(newSpeed);
  }, []);

  const startNewRun = useCallback(async (input: StartRunInput) => {
    setLoading(true);
    const newRun = await mockApiService.startRun(input);
    setSelectedRunId(newRun.id);
    setCurrentRun(newRun);
    await refreshRuns();
    setLoading(false);
    return newRun;
  }, [refreshRuns]);

  const updateFindingStatus = useCallback(async (findingId: string, status: WorkflowStatus) => {
    await mockApiService.updateFindingStatus(findingId, status);
  }, []);

  const retryStage = useCallback((stageNumber: number) => {
    if (stageNumber === 1 && currentRun) {
      const targetUrl = (!currentRun.targetUrl || currentRun.targetUrl.includes('freshcart-demo.store'))
        ? 'http://localhost:3000/freshcart.html'
        : currentRun.targetUrl;
      startNewRun({
        siteName: currentRun.siteName || 'FreshCart (demo store)',
        targetUrl,
        targetType: 'URL',
        variant: currentRun.variant || 'Partly fixed',
        journeyTemplate: currentRun.journeyTemplate || 'Search > cart > checkout > cancel',
        mode: currentRun.mode || 'Quick',
        credentialsProvided: true
      });
    } else if (currentRun) {
      mockApiService.retryStage(currentRun.id, stageNumber);
    }
  }, [currentRun, startNewRun]);

  const cancelRun = useCallback(() => {
    if (currentRun) {
      mockApiService.cancelRun(currentRun.id);
    }
  }, [currentRun]);

  const resetPipeline = useCallback(async () => {
    const standbyRun = mockApiService.resetPipeline();
    setSelectedRunId(standbyRun.id);
    setCurrentRun(standbyRun);
    const runs = await mockApiService.listRuns();
    setRunsList(runs);
  }, []);

  return {
    selectedRunId,
    currentRun,
    runsList,
    loading,
    speed,
    setSpeed,
    selectRun,
    startNewRun,
    updateFindingStatus,
    retryStage,
    cancelRun,
    resetPipeline,
    refreshRuns
  };
}
