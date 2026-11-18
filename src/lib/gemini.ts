import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface LessonPlanPrompt {
  topic: string;
  grade: string;
  duration?: string;
  subject?: string;
}

export interface QuizPrompt {
  topic: string;
  grade?: string;
  count?: number;
}

export async function generateLessonPlanAI(params: LessonPlanPrompt): Promise<{
  content: string;
  objectives: string[];
  assessmentQuestions: string[];
  homework: string;
}> {
  if (!ai || !apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in your environment. Please add a valid GEMINI_API_KEY to your .env.local file to enable live AI lesson plan generation."
    );
  }

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateQuizAI(params: QuizPrompt): Promise<string[]> {
  if (!ai || !apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in your environment. Please add a valid GEMINI_API_KEY to your .env.local file to enable live AI quiz generation."
    );
  }

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

export interface FeedbackPrompt {
  studentName?: string;
  subject: string;
  assessment?: string;
  obtainedMarks: number;
  totalMarks: number;
  examStatus?: "present" | "absent";
}

export async function generateStudentFeedbackAI(
  params: FeedbackPrompt
): Promise<string> {
  if (!ai || !apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in your environment. Please add a valid GEMINI_API_KEY to enable AI feedback generation."
    );
  }

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return (response.text || "").replace(/^["']|["']$/g, "").trim();
}
