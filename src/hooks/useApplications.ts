import { useState, useEffect, useCallback } from 'react';
import { ApplicationData, calculateRiskScore, RiskAssessment } from '@/lib/riskScoring';
import { getMockApplications } from '@/data/mockApplications';
import { getSanctionsList } from '@/data/mockSanctions';

const STORAGE_KEY = 'au_verification_applications';
const VERIFIED_KEY = 'au_verified_organizations';
const FLAGGED_KEY = 'au_flagged_applications';
const REJECTED_KEY = 'au_rejected_applications';

export interface ApplicationWithRisk extends ApplicationData {
  riskAssessment: RiskAssessment;
}

export function useApplications() {
  const [applications, setApplications] = useState<ApplicationWithRisk[]>([]);
  const [verifiedOrgs, setVerifiedOrgs] = useState<ApplicationWithRisk[]>([]);
  const [flaggedApps, setFlaggedApps] = useState<ApplicationWithRisk[]>([]);
  const [rejectedApps, setRejectedApps] = useState<ApplicationWithRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage or initialize with mock data
  useEffect(() => {
    const loadData = () => {
      const storedApps = localStorage.getItem(STORAGE_KEY);
      const storedVerified = localStorage.getItem(VERIFIED_KEY);
      const storedFlagged = localStorage.getItem(FLAGGED_KEY);
      const storedRejected = localStorage.getItem(REJECTED_KEY);

      const sanctionsList = getSanctionsList();

      if (storedApps) {
        setApplications(JSON.parse(storedApps));
      } else {
        // Initialize with mock data and calculate risk scores
        const mockApps = getMockApplications();
        const appsWithRisk: ApplicationWithRisk[] = mockApps.map((app) => ({
          ...app,
          riskAssessment: calculateRiskScore(app, sanctionsList),
        }));
        setApplications(appsWithRisk);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appsWithRisk));
      }

      if (storedVerified) {
        setVerifiedOrgs(JSON.parse(storedVerified));
      }

      if (storedFlagged) {
        setFlaggedApps(JSON.parse(storedFlagged));
      }

      if (storedRejected) {
        setRejectedApps(JSON.parse(storedRejected));
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    }
  }, [applications, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(VERIFIED_KEY, JSON.stringify(verifiedOrgs));
    }
  }, [verifiedOrgs, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(FLAGGED_KEY, JSON.stringify(flaggedApps));
    }
  }, [flaggedApps, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(REJECTED_KEY, JSON.stringify(rejectedApps));
    }
  }, [rejectedApps, isLoading]);

  const approveApplication = useCallback((id: string) => {
    setApplications((prev) => {
      const app = prev.find((a) => a.id === id);
      if (app) {
        const approvedApp = { ...app, status: 'approved' as const };
        setVerifiedOrgs((prevVerified) => [...prevVerified, approvedApp]);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const rejectApplication = useCallback((id: string) => {
    setApplications((prev) => {
      const app = prev.find((a) => a.id === id);
      if (app) {
        const rejectedApp = { ...app, status: 'rejected' as const };
        setRejectedApps((prevRejected) => [...prevRejected, rejectedApp]);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const flagApplication = useCallback((id: string) => {
    setApplications((prev) => {
      const app = prev.find((a) => a.id === id);
      if (app) {
        const flaggedApp = { ...app, status: 'flagged' as const };
        setFlaggedApps((prevFlagged) => [...prevFlagged, flaggedApp]);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const getApplicationById = useCallback(
    (id: string): ApplicationWithRisk | undefined => {
      return (
        applications.find((a) => a.id === id) ||
        verifiedOrgs.find((a) => a.id === id) ||
        flaggedApps.find((a) => a.id === id) ||
        rejectedApps.find((a) => a.id === id)
      );
    },
    [applications, verifiedOrgs, flaggedApps, rejectedApps]
  );

  const stats = {
    total: applications.length + verifiedOrgs.length + flaggedApps.length + rejectedApps.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: verifiedOrgs.length,
    flagged: flaggedApps.length,
    rejected: rejectedApps.length,
    highRisk: applications.filter((a) => a.riskAssessment.level === 'high').length,
  };

  const resetData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERIFIED_KEY);
    localStorage.removeItem(FLAGGED_KEY);
    localStorage.removeItem(REJECTED_KEY);
    window.location.reload();
  }, []);

  return {
    applications,
    verifiedOrgs,
    flaggedApps,
    rejectedApps,
    isLoading,
    stats,
    approveApplication,
    rejectApplication,
    flagApplication,
    getApplicationById,
    resetData,
  };
}
