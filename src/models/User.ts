import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "coordinator" | "teacher" | "student" | "parent";

export interface IAssignedClass {
  grade: string;
  section: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  institution?: string;
  extraField?: string;
  schoolId?: mongoose.Types.ObjectId;
  schoolCode?: string;
  linkedStudentId?: mongoose.Types.ObjectId;
  linkedStudentIds?: mongoose.Types.ObjectId[];
  assignedClasses?: IAssignedClass[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "coordinator", "teacher", "student", "parent"],
      default: "admin",
      required: true,
    },
    institution: { type: String, default: "CampusFlow Institution", trim: true },
    extraField: { type: String, trim: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    schoolCode: { type: String, uppercase: true, trim: true, index: true },
    linkedStudentId: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    linkedStudentIds: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    assignedClasses: [
      {
        grade: { type: String, required: true, trim: true },
        section: { type: String, required: true, trim: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

const existingUserEnum = (mongoose.models.User?.schema?.path("role") as any)?.enumValues;
if (
  mongoose.models.User &&
  (!mongoose.models.User.schema.path("schoolId") ||
    !mongoose.models.User.schema.path("schoolCode") ||
    !mongoose.models.User.schema.path("linkedStudentId") ||
    !mongoose.models.User.schema.path("linkedStudentIds") ||
    !mongoose.models.User.schema.path("assignedClasses") ||
    !Array.isArray(existingUserEnum) ||
    !existingUserEnum.includes("coordinator"))
) {
  mongoose.deleteModel("User");
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
