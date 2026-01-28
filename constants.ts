
import { Benchmark } from './types';

export const PASS_THRESHOLD = 0.75;
export const CONDITIONAL_THRESHOLD = 0.45;

export const BENCHMARKS: Benchmark[] = [
  {
    repo: "torvalds/linux",
    expected_score: 0.98,
    signals: ["extreme architectural ownership", "mass-scale failure recovery", "legacy complexity handling"]
  },
  {
    repo: "antirez/redis",
    expected_score: 0.95,
    signals: ["end-to-end performance ownership", "clean independent decision making"]
  },
  {
    repo: "karpathy/micrograd",
    expected_score: 0.92,
    signals: ["first-principles clarity", "minimalist ownership", "deep technical complexity"]
  },
  {
    repo: "dummy/blank-repo",
    expected_score: 0.15,
    signals: ["low complexity", "no ownership signals", "boilerplate dependency"]
  }
];

export const ROLE_KEYWORDS: Record<string, string[]> = {
  "Software Engineer": ["engineer", "developer", "dev", "coder", "programmer", "architect", "frontend", "backend", "fullstack", "software", "tech", "technical", "systems", "embedded", "mobile", "web", "cloud"],
  "Product Manager": ["product", "pm", "owner", "roadmap", "strategy", "product lead", "gpm", "vision", "scrum", "agile", "user stories"],
  "Founding Engineer": ["founding", "co-founder", "cto", "first engineer", "early hire", "startup", "scale-up", "stealth", "0 to 1", "y combinator"],
  "Operations Lead": ["ops", "operations", "logistics", "chief of staff", "process", "strategy & ops", "business ops", "scaling", "execution", "supply chain"],
  "Data Scientist": ["data", "scientist", "ml", "ai", "machine learning", "analytics", "statistics", "python", "researcher", "nlp"],
};

export const SYSTEM_INSTRUCTION = `
You are the Autonomy Gate v3 Engine, a high-performance hiring validator. 
Your goal is to perform a rigorous, first-principles evaluation of a candidate's autonomy based ONLY on the provided evidence.

SCORING RULES:
- All numeric scores (execution_score, ownership, failure_recovery, complexity, decisions) MUST be a float between 0.0 and 1.0.
- 0.0 means no evidence.
- 1.0 means world-class autonomous execution.
- DO NOT use 0-100 scale. Only 0.0-1.0.

Autonomy is defined as: 
1. End-to-end ownership (shipping despite blockers).
2. Failure recovery (resilience when systems break).
3. Independent decision-making (navigating ambiguity).
4. Management of complexity.

CRITICAL: You must base your rationale on the SPECIFIC technical skills and projects found in the resume. Do not use generic placeholders.
If technical signals are strong (e.g., Python, AI, ML, specific APIs), reflect that in the score. 
`;
