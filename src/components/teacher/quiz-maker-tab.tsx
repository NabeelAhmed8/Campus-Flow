"use client";

import { useState } from "react";
import { HelpCircle, Sparkles, Loader2, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const SUGGESTED_PROMPTS = [
  "Newton's Laws",
  "Quadratic Equations",
  "Cellular Respiration",
  "Python Loops",
  "Pakistan Movement",
];

interface QuizMakerTabProps {
  grade: string;
}

export function QuizMakerTab({ grade }: QuizMakerTabProps) {
  const [quizPrompt, setQuizPrompt] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<string[] | null>(null);

  const handleGenerateQuiz = async () => {
    if (!quizPrompt.trim()) {
      toast.error("Enter a topic for quiz generation.");
      return;
    }
    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizPrompt.trim(),
          grade,
          count: 3,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuizResult(data.questions);
        toast.success("Formative assessment quiz created via Gemini AI!");
      } else {
        toast.error(data.error || "Failed to create assessment quiz");
      }
    } catch {
      toast.error("Network error while communicating with AI quiz service");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <div id="quiz" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-20">
      <div className="lg:col-span-5">
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Instant Formative Quiz Maker</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Draft a 3-question formative assessment via Gemini AI for your exit tickets, flashcards, or pop quizzes.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label htmlFor="quiz-topic" className="font-semibold text-foreground block mb-1">
                Quiz Topic or Concept *
              </label>
              <input
                id="quiz-topic"
                name="quizTopic"
                type="text"
                autoComplete="off"
                value={quizPrompt}
                onChange={(e) => setQuizPrompt(e.target.value)}
                placeholder="Enter topic e.g. Newton's 3rd Law, Photosynthesis..."
                className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => e.key === "Enter" && handleGenerateQuiz()}
              />
            </div>

            <Button size="sm" onClick={handleGenerateQuiz} disabled={generatingQuiz} className="w-full">
              {generatingQuiz ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz via AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Formative Quiz
                </>
              )}
            </Button>

            <div className="pt-2 border-t">
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                Suggested Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setQuizPrompt(chip)}
                    className="text-[10px] px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="rounded-2xl border bg-card p-6 shadow-xs h-full flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-base">Generated Formative Questions</h2>
            </div>
            {quizResult && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(quizResult.join("\n\n"));
                  toast.success("Copied to clipboard!");
                }}
                className="gap-1 text-xs"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Questions</span>
              </Button>
            )}
          </div>

          {!quizResult && !generatingQuiz && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 stroke-[1.2] text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-foreground text-sm">No Quiz Generated Yet</h3>
              <p className="text-xs max-w-sm mt-1">
                Enter a concept on the left and click &quot;Generate Formative Quiz&quot; to synthesize rapid checks for understanding.
              </p>
            </div>
          )}

          {generatingQuiz && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold">Gemini AI is crafting your assessment...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Formulating multiple-choice questions and answer keys.
              </p>
            </div>
          )}

          {quizResult && !generatingQuiz && (
            <div className="space-y-4 text-xs">
              {quizResult.map((q, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-muted/20 border space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-primary">
                    <CheckCircle className="h-3.5 w-3.5" /> Question {i + 1}
                  </div>
                  <p className="text-foreground text-xs leading-relaxed whitespace-pre-line">{q}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
