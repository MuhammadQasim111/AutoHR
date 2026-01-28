
import Groq from "groq-sdk";
import { EvaluationResult, CandidateInputs, GitHubData } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const getApiKey = () => {
    const key = process.env.API_KEY || process.env.GROQ_API_KEY || "";
    if (!key || key === "undefined" || key === "PLACEHOLDER_API_KEY") {
        console.error("GROQ API KEY IS MISSING OR INVALID:", key);
        return null;
    }
    return key;
};

export async function evaluateCandidate(
    inputs: CandidateInputs,
    githubData: GitHubData | null
): Promise<EvaluationResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Groq API Key missing. Please check your .env.local file.");
    }

    const groq = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    // Truncate resume text more aggressively for high-speed inference
    const truncatedResume = inputs.resumeText.length > 5000
        ? inputs.resumeText.substring(0, 5000) + "... [TRUNCATED]"
        : inputs.resumeText;

    const prompt = `
    EVALUATE FOR: ${inputs.roleContext}
    
    DATA_INPUTS:
    - RESUME_CORE: ${truncatedResume}
    - GITHUB_REPOS: ${githubData ? JSON.stringify(githubData.repos) : "NONE"}
    - GITHUB_ACTIVITY: ${githubData ? githubData.recentActivity : "NONE"}
    - LINKEDIN_REF: ${inputs.linkedinUrl || "NONE"}
    
    INSTRUCTION: Perform a rigorous, first-principles autonomy scan. 
    Analyze for ownership, failure recovery, and technical complexity handled.
    
    CRITICAL: 
    - All scores must be between 0.0 and 1.0. 
    - Base the 'rationale' and 'calibration_notes' on the SPECIFIC projects and tools mentioned in the RESUME_CORE.
    - If the candidate describes building AI agents, RAG, or automation systems, ensure the 'complexity' and 'ownership' scores reflect this.
    - Do NOT mention 'Google Docs' or 'Excel' unless they are the PRIMARY focus of the resume.
    
    Output absolute JSON verdict. No preamble. Match the following structure exactly:
    {
      "execution_score": 0.0-1.0,
      "verdict": "PASS" | "FAIL" | "CONDITIONAL",
      "fail_modes": ["reason1", "reason2"],
      "forced_decision": boolean,
      "calibration_notes": "string",
      "rationale": "string",
      "signals": {
        "ownership": 0.0-1.0,
        "failure_recovery": 0.0-1.0,
        "complexity": 0.0-1.0,
        "decisions": 0.0-1.0
      }
    }
  `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                { role: "user", content: prompt }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        try {
            return JSON.parse(content) as EvaluationResult;
        } catch (parseError) {
            console.error("Failed to parse AI response:", content);
            throw new Error("AI engine produced an invalid data format. Please try again.");
        }
    } catch (error: any) {
        console.error("Groq eval error:", error);
        // If it's our thrown "missing key" or "invalid format" error, re-throw it to App.tsx
        if (error.message && (error.message.includes("API Key") || error.message.includes("AI engine"))) {
            throw error;
        }
        return {
            execution_score: 0.0,
            verdict: "FAIL" as any,
            fail_modes: ["ANALYSIS_FAILED", "SYSTEM_TIMEOUT"],
            forced_decision: true,
            calibration_notes: "Engine failed to produce a deterministic verdict in time.",
            rationale: "Critical failure in evaluation logic. Check inputs for corruption.",
            signals: { ownership: 0, failure_recovery: 0, complexity: 0, decisions: 0 }
        };
    }
}
