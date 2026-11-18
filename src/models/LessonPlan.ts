import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILessonPlan extends Document {
  teacherId?: mongoose.Types.ObjectId;
  topic: string;
  grade: string;
  duration: string;
  learningObjectives: string[];
  lessonContent: string;
  assessmentQuestions: string[];
  homework: string;
  createdAt: Date;
  updatedAt: Date;
}

const LessonPlanSchema = new Schema<ILessonPlan>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User" },
    topic: { type: String, required: true },
    grade: { type: String, required: true },
    duration: { type: String, default: "45 mins" },
    learningObjectives: [{ type: String }],
    lessonContent: { type: String, required: true },
    assessmentQuestions: [{ type: String }],
    homework: { type: String, default: "" },
  },
  { timestamps: true }
);

export const LessonPlan: Model<ILessonPlan> =
  mongoose.models.LessonPlan || mongoose.model<ILessonPlan>("LessonPlan", LessonPlanSchema);
