"use client";

import { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  CheckCircle,
  Copy,
  Clock,
  Loader2,
  ListOrdered,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";

const GRADE_LEVEL_OPTIONS = [
  { value: "Grade 7", label: "Grade 7", badge: "Middle School" },
  { value: "Grade 8", label: "Grade 8", badge: "Middle School" },
  { value: "Grade 9", label: "Grade 9", badge: "Matric / O-Level" },
  { value: "Grade 10", label: "Grade 10", badge: "Matric / O-Level" },
  { value: "Grade 11", label: "Grade 11", badge: "Inter / A-Level" },
  { value: "Grade 12", label: "Grade 12", badge: "Inter / A-Level" },
];

const DURATION_OPTIONS = [
  { value: "30 mins", label: "30 mins", sublabel: "Short period" },
  { value: "45 mins", label: "45 mins", sublabel: "Standard period" },
  { value: "60 mins", label: "60 mins", sublabel: "Extended block" },
  { value: "90 mins", label: "90 mins", sublabel: "Double lab session" },
];

interface LessonPlannerTabProps {
  grade: string;
  onGradeChange: (val: string) => void;
}

export function LessonPlannerTab({ grade, onGradeChange }: LessonPlannerTabProps) {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("45 mins");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a lesson topic.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          grade,
          duration,
          subject: subject.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setGeneratedPlan(data.plan);
        toast.success("AI Lesson Plan generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate lesson plan");
      }
    } catch {
      toast.error("Network error while communicating with AI service");
    } finally {
      setLoading(false);
    }
  };

  const copyPlan = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedPlan, null, 2));
    toast.success("Copied to clipboard!");
  };

  return (
    <div id="planner" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-20">
      {/* Controls Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Lesson Configuration</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label htmlFor="lesson-topic" className="font-semibold text-foreground block mb-1.5">
                Lesson Topic or Concept <span className="text-destructive">*</span>
              </label>
              <input
                id="lesson-topic"
                name="lessonTopic"
                type="text"
                autoComplete="off"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis & Cellular Respiration, Calculus Integrals..."
                className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="lesson-subject" className="font-semibold text-foreground block mb-1.5">
                Subject & Discipline
              </label>
              <input
                id="lesson-subject"
                name="subject"
                type="text"
                autoComplete="off"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, General Science, World History"
                className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="lesson-grade" className="font-semibold text-foreground block mb-1.5">
                  Grade Level
                </label>
                <CustomSelect
                  name="lessonGrade"
                  value={grade}
                  onChange={onGradeChange}
                  options={GRADE_LEVEL_OPTIONS}
                />
              </div>

              <div>
                <label
                  htmlFor="lesson-duration"
                  className="font-semibold text-foreground block mb-1.5"
                >
                  Class Duration
                </label>
                <CustomSelect
                  name="lessonDuration"
                  value={duration}
                  onChange={(val) => setDuration(val)}
                  options={DURATION_OPTIONS}
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synthesizing Curriculum...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Generate AI Lesson Plan
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Output Column */}
      <div className="lg:col-span-7">
        <div className="rounded-2xl border bg-card p-6 shadow-xs h-full flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-base">Lesson Architecture & Scaffold</h2>
            </div>
            {generatedPlan && (
              <Button variant="outline" size="xs" onClick={copyPlan} className="gap-1 text-xs">
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Plan</span>
              </Button>
            )}
          </div>

          {!generatedPlan && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <BrainCircuit className="h-12 w-12 stroke-[1.2] text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-foreground text-sm">No Plan Generated Yet</h3>
              <p className="text-xs max-w-sm mt-1">
                Fill in the lesson parameters on the left and click &quot;Generate AI Lesson Plan&quot; to produce a full curriculum structure.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold">Gemini AI is crafting your lesson plan...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aligning objectives, time allocation, and assessment criteria.
              </p>
            </div>
          )}

          {generatedPlan && !loading && (
            <div className="space-y-5 text-xs">
              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-primary">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Learning Objectives
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {generatedPlan.objectives?.map((obj: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="font-bold text-foreground">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-primary">
                  <Clock className="h-3.5 w-3.5" />
                  Lesson Content & Timeline
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/20 border rounded-xl p-4 whitespace-pre-line text-foreground/90 font-mono text-xs leading-relaxed">
                  {generatedPlan.content}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-primary">
                  <ListOrdered className="h-3.5 w-3.5" />
                  Formative Assessment Questions
                </h4>
                <ol className="space-y-1.5 pl-1">
                  {generatedPlan.assessmentQuestions?.map((q: string, i: number) => (
                    <li key={i} className="text-muted-foreground">
                      <span className="font-semibold text-foreground mr-1.5">{i + 1}.</span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>

              {generatedPlan.homework && (
                <div className="pt-2 border-t">
                  <span className="font-bold text-foreground mr-2">Assigned Homework:</span>
                  <span className="text-muted-foreground">{generatedPlan.homework}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
