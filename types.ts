
export enum Verdict {
  PASS = 'PASS',
  FAIL = 'FAIL',
  CONDITIONAL = 'CONDITIONAL'
}

export interface EvaluationResult {
  execution_score: number;
  verdict: Verdict;
  fail_modes: string[];
  forced_decision: boolean;
  calibration_notes: string;
  rationale: string;
  signals: {
    ownership: number;
    failure_recovery: number;
    complexity: number;
    decisions: number;
  };
}

export interface CandidateInputs {
  resumeText: string;
  githubUrl: string;
  linkedinUrl?: string;
  roleContext: string;
}

export interface GitHubData {
  repos: string[];
  languages: string[];
  totalStars: number;
  recentActivity: string;
}

export interface Benchmark {
  repo: string;
  expected_score: number;
  signals: string[];
}
