import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL_CHAIN = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
] as const;

const PER_MODEL_TIMEOUT_MS = 22_000;
const COOLDOWN_QUOTA_MS = 5 * 60 * 1000;
const COOLDOWN_OVERLOAD_MS = 60 * 1000;
const COOLDOWN_DEPRECATED_MS = 30 * 60 * 1000;

const modelCooldownUntil = new Map<string, number>();

function getConfiguredApiKey(): string {
  return (process.env.GEMINI_API_KEY || "").trim();
}

function getModelChain(): string[] {
  const override = (process.env.GEMINI_MODELS || "").trim();
  if (override) {
    const custom = override
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (custom.length > 0) return custom;
  }
  return [...DEFAULT_GEMINI_MODEL_CHAIN];
}

function getOrderedCandidates(): string[] {
  const now = Date.now();
  const chain = getModelChain();
  const ready = chain.filter((m) => (modelCooldownUntil.get(m) ?? 0) <= now);
  const cooling = chain.filter((m) => (modelCooldownUntil.get(m) ?? 0) > now);
  return ready.length > 0 ? [...ready, ...cooling] : chain;
}

function classifyFailure(err: unknown): {
  fatalAuth: boolean;
  cooldownMs: number;
  reason: string;
} {
  const msg = err instanceof Error ? err.message : String(err || "Unknown error");
  const lower = msg.toLowerCase();

  if (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("permission_denied") ||
    lower.includes("401")
  ) {
    return { fatalAuth: true, cooldownMs: 0, reason: "Invalid GEMINI_API_KEY" };
  }
  if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
    return { fatalAuth: false, cooldownMs: COOLDOWN_QUOTA_MS, reason: "Quota exhausted (429)" };
  }
  if (lower.includes("404") || lower.includes("no longer available") || lower.includes("not found")) {
    return {
      fatalAuth: false,
      cooldownMs: COOLDOWN_DEPRECATED_MS,
      reason: "Model unavailable (404)",
    };
  }
  return { fatalAuth: false, cooldownMs: COOLDOWN_OVERLOAD_MS, reason: msg.slice(0, 120) };
}

function extractJsonText(raw: string, expectArray: boolean): string {
  const stripped = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const open = expectArray ? "[" : "{";
  const close = expectArray ? "]" : "}";
  const start = stripped.indexOf(open);
  const end = stripped.lastIndexOf(close);
  if (start !== -1 && end > start) {
    return stripped.slice(start, end + 1);
  }
  return stripped;
}

async function callSingleModel(
  client: GoogleGenAI,
  model: string,
  prompt: string,
  jsonMode: boolean
): Promise<string> {
  const supportsJsonMime = jsonMode && model.startsWith("gemini-");
  const generatePromise = client.models.generateContent({
    model,
    contents: prompt,
    ...(supportsJsonMime
      ? { config: { responseMimeType: "application/json" } }
      : {}),
  });

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Model ${model} timed out after ${PER_MODEL_TIMEOUT_MS}ms`)),
      PER_MODEL_TIMEOUT_MS
    );
  });

  try {
    const response = await Promise.race([generatePromise, timeoutPromise]);
    const text = (response.text || "").trim();
    if (!text) {
      throw new Error(`Model ${model} returned an empty response.`);
    }
    return text;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function generateWithFailover<T>(
  prompt: string,
  options: {
    jsonMode: boolean;
    parse: (rawText: string) => T;
  }
): Promise<{ data: T; modelUsed: string }> {
  const apiKey = getConfiguredApiKey();
  if (!apiKey || apiKey.startsWith("your_")) {
    throw new Error(
      "GEMINI_API_KEY is not configured in .env.local. Add a valid Google AI Studio key to enable live AI generation."
    );
  }

  const client = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const candidates = getOrderedCandidates();
  const failures: string[] = [];

  for (const model of candidates) {
    try {
      const rawText = await callSingleModel(client, model, prompt, options.jsonMode);
      const data = options.parse(rawText);
      modelCooldownUntil.delete(model);
      return { data, modelUsed: model };
    } catch (err) {
      const info = classifyFailure(err);
      if (info.fatalAuth) {
        throw new Error(
          "GEMINI_API_KEY is invalid or unauthorized. Please verify your Google AI Studio API key in .env.local."
        );
      }
      if (info.cooldownMs > 0) {
        modelCooldownUntil.set(model, Date.now() + info.cooldownMs);
      }
      failures.push(`${model}: ${info.reason}`);
      console.warn(`[GEMINI_FAILOVER] ${model} failed (${info.reason}) -> switching to next model`);
    }
  }

  throw new Error(
    `All configured Gemini/Gemma AI models are currently busy or out of quota (${failures.length} models tried). Please retry in a minute.`
  );
}

export interface LessonPlanPrompt {
  topic: string;
  grade: string;
  duration?: string;
  subject?: string;
}

export interface LessonPlanResult {
  content: string;
  objectives: string[];
  assessmentQuestions: string[];
  homework: string;
  modelUsed: string;
}

export interface QuizPrompt {
  topic: string;
  grade?: string;
  count?: number;
}

export interface FeedbackPrompt {
  studentName?: string;
  subject: string;
  assessment?: string;
  obtainedMarks: number;
  totalMarks: number;
  examStatus?: "present" | "absent";
}

export async function generateLessonPlanAI(
  params: LessonPlanPrompt
): Promise<LessonPlanResult> {
  const duration = params.duration || "45 minutes";
  const subject = params.subject || "General Academics";

  const prompt = `You are an expert pedagogy and curriculum specialist. Create a detailed, high-impact lesson plan for:
Topic: ${params.topic}
Grade: ${params.grade}
Subject: ${subject}
Duration: ${duration}

Return your response in valid JSON with this exact structure:
{
  "content": "Detailed lesson plan formatted in clean Markdown with clear time breakdown",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "assessmentQuestions": ["Question 1", "Question 2", "Question 3"],
  "homework": "Concise assignment for students"
}
Only return the raw JSON object, without code fence markers.`;

  const { data, modelUsed } = await generateWithFailover(prompt, {
    jsonMode: true,
    parse: (raw) => {
      const parsed = JSON.parse(extractJsonText(raw, false)) as Partial<LessonPlanResult>;
      if (typeof parsed.content !== "string" || !parsed.content.trim()) {
        throw new Error("Incomplete lesson plan payload");
      }
      return {
        content: parsed.content.trim(),
        objectives: Array.isArray(parsed.objectives)
          ? parsed.objectives.map(String).filter(Boolean)
          : [],
        assessmentQuestions: Array.isArray(parsed.assessmentQuestions)
          ? parsed.assessmentQuestions.map(String).filter(Boolean)
          : [],
        homework: typeof parsed.homework === "string" ? parsed.homework.trim() : "",
      };
    },
  });

  return { ...data, modelUsed };
}

export async function generateQuizAI(
  params: QuizPrompt
): Promise<{ questions: string[]; modelUsed: string }> {
  const count = params.count || 3;
  const grade = params.grade || "Grade 9";

  const prompt = `You are an expert educator. Create ${count} formative assessment questions for students on the topic: "${params.topic}" for ${grade}.
Include a balanced mix of conceptual inquiry and multiple-choice questions.
Return ONLY a valid JSON array of strings, where each string is a complete question (with options labeled A, B, C, D if multiple choice).
Example JSON format:
[
  "1. Conceptual Question: Explain how...",
  "2. Multiple Choice: Which of the following is true? (A) ... (B) ... (C) ... (D) ...",
  "3. Problem Solving: Calculate..."
]
Only return raw JSON without markdown code fences.`;

  const { data, modelUsed } = await generateWithFailover(prompt, {
    jsonMode: true,
    parse: (raw) => {
      const parsed = JSON.parse(extractJsonText(raw, true)) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Quiz response was not a non-empty JSON array");
      }
      return parsed.map((q) => String(q).trim()).filter(Boolean);
    },
  });

  return { questions: data, modelUsed };
}

export async function generateStudentFeedbackAI(
  params: FeedbackPrompt
): Promise<{ feedback: string; modelUsed: string }> {
  const pct =
    params.examStatus === "absent"
      ? 0
      : params.totalMarks > 0
        ? Math.round((params.obtainedMarks / params.totalMarks) * 100)
        : 0;

  const prompt =
    params.examStatus === "absent"
      ? `Write a concise, professional 2-sentence teacher remark for a parent report card noting that ${
          params.studentName || "the student"
        } was absent for the ${params.assessment || "term"} exam in ${
          params.subject
        }, encouraging coordination with the teacher to cover missed topics. Return plain text only (no quotes, no markdown).`
      : `Write a concise, constructive, personalized 2-sentence teacher evaluation remark for a student report card.
Student: ${params.studentName || "Student"}
Subject: ${params.subject}
Assessment: ${params.assessment || "Term Examination"}
Score: ${params.obtainedMarks}/${params.totalMarks} (${pct}%)
Tone: encouraging, academic, actionable for both student and parent.
Return plain text only (no quotation marks, no markdown formatting).`;

  const { data, modelUsed } = await generateWithFailover(prompt, {
    jsonMode: false,
    parse: (raw) => {
      const cleaned = raw.replace(/^["']|["']$/g, "").trim();
      if (!cleaned) throw new Error("Empty feedback text");
      return cleaned;
    },
  });

  return { feedback: data, modelUsed };
}
