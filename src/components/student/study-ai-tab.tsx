"use client";

import { useState } from "react";
import { Sparkles, Loader2, BrainCircuit, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const QUICK_TOPICS = ["Photosynthesis", "Kinematics Equations", "Cell Structure", "Chemical Bonding"];

interface StudentStudyAiTabProps {
  grade?: string;
}

export function StudentStudyAiTab({ grade }: StudentStudyAiTabProps) {
  const [studyTopic, setStudyTopic] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [studyQuestions, setStudyQuestions] = useState<string[] | null>(null);

  const handleGenerateStudyQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyTopic.trim()) {
      toast.error("Please enter a subject or topic to study.");
      return;
    }

    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: studyTopic.trim(),
          grade: grade || "Grade 9",
          count: 4,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setStudyQuestions(data.questions);
        toast.success("AI Practice Flashcards created!");
      } else {
        toast.error(data.error || "Failed to generate study practice questions");
      }
    } catch {
      toast.error("Network error while reaching AI study service");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">Gemini 3 AI Study Coach</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Type any topic from your coursework to generate customized formative flashcards and practice test questions.
        </p>

        <form onSubmit={handleGenerateStudyQuiz} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="student-study-topic" className="font-semibold block mb-1">
              Topic or Concept to Practice
            </label>
            <input
              id="student-study-topic"
              name="studyTopic"
              type="text"
              autoComplete="off"
              required
              placeholder="e.g. Newton's 3 Laws, Mitosis vs Meiosis, Quadratic Equations"
              value={studyTopic}
              onChange={(e) => setStudyTopic(e.target.value)}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={generatingQuiz}>
            {generatingQuiz ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Create Study Practice Quiz
              </>
            )}
          </Button>
        </form>

        <div className="p-3 rounded-xl bg-muted/40 border space-y-2 text-xs">
          <span className="font-semibold text-foreground block">Quick Recommended Topics:</span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TOPICS.map((top) => (
              <button
                key={top}
                type="button"
                onClick={() => setStudyTopic(top)}
                className="px-2 py-0.5 rounded-md bg-background border hover:border-primary text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {top}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 rounded-2xl border bg-card p-6 shadow-xs flex flex-col min-h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">Practice Assessment Questions</h3>
          </div>
        </div>

        {!studyQuestions && !generatingQuiz && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <BrainCircuit className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="font-semibold text-foreground text-sm">No Practice Questions Yet</p>
            <p className="text-xs max-w-sm mt-1">
              Enter a topic on the left to let Gemini AI generate custom revision questions and conceptual tests.
            </p>
          </div>
        )}

        {generatingQuiz && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-semibold">Crafting your practice test...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Curating questions tailored to {grade || "your grade"}.
            </p>
          </div>
        )}

        {studyQuestions && !generatingQuiz && (
          <div className="space-y-3.5 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Ready for Self-Assessment: {studyTopic}</span>
            </div>

            <div className="space-y-3">
              {studyQuestions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5">
                  <p className="font-medium text-foreground leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
