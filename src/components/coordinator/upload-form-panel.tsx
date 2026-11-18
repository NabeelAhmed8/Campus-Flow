"use client";

import type { RefObject } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { ALL_CLASSES_GRADE_OPTIONS, TERM_OPTIONS } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Campus (Teachers, Students & Parents)" },
  { value: "teachers", label: "Teachers Only" },
  { value: "parents", label: "Parents Only" },
  { value: "students", label: "Students Only" },
];

const UPLOAD_TERM_OPTIONS = [
  { value: "", label: "General / All Terms" },
  ...TERM_OPTIONS,
];

interface UploadFormPanelProps {
  category: "timetable" | "syllabus" | "datesheet";
  titlePlaceholder: string;
  showSection: boolean;
  showTerm: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  title: string;
  grade: string;
  section: string;
  term: string;
  audience: string;
  notes: string;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleChange: (val: string) => void;
  onGradeChange: (val: string) => void;
  onSectionChange: (val: string) => void;
  onTermChange: (val: string) => void;
  onAudienceChange: (val: string) => void;
  onNotesChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function UploadFormPanel({
  category,
  titlePlaceholder,
  showSection,
  showTerm,
  fileInputRef,
  selectedFile,
  title,
  grade,
  section,
  term,
  audience,
  notes,
  isUploading,
  onFileChange,
  onTitleChange,
  onGradeChange,
  onSectionChange,
  onTermChange,
  onAudienceChange,
  onNotesChange,
  onSubmit,
}: UploadFormPanelProps) {
  return (
    <form onSubmit={onSubmit} className="lg:col-span-5 space-y-3 text-xs">
      <div>
        <label
          htmlFor={`upload-file-${category}`}
          className="block text-[11px] font-semibold mb-1 text-foreground"
        >
          Attach File (PDF, JPG, JPEG, PNG — Max 5 MB)
        </label>
        <input
          ref={fileInputRef}
          id={`upload-file-${category}`}
          name={`file_${category}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={onFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed p-4 text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
            selectedFile
              ? "border-emerald-500/60 bg-emerald-500/5"
              : "border-border hover:border-primary/60 hover:bg-muted/30"
          }`}
        >
          {selectedFile ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <span className="font-semibold text-foreground text-xs truncate max-w-full px-2">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatFileSize(selectedFile.size)} • Click to change file
              </span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground text-xs">
                Click to select PDF, JPEG, JPG, or PNG
              </span>
              <span className="text-[11px] text-muted-foreground">
                Instant sync to Teacher, Student &amp; Parent portals
              </span>
            </>
          )}
        </button>
      </div>

      <div>
        <label
          htmlFor={`upload-title-${category}`}
          className="block text-[11px] font-semibold mb-1"
        >
          Document Title
        </label>
        <input
          id={`upload-title-${category}`}
          name={`title_${category}`}
          type="text"
          autoComplete="off"
          required
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`upload-grade-${category}`}
            className="block text-[11px] font-semibold mb-1"
          >
            Class / Grade
          </label>
          <CustomSelect
            id={`upload-grade-${category}`}
            value={grade}
            onChange={onGradeChange}
            options={ALL_CLASSES_GRADE_OPTIONS}
            size="sm"
          />
        </div>

        {showSection && (
          <div>
            <label
              htmlFor={`upload-section-${category}`}
              className="block text-[11px] font-semibold mb-1"
            >
              Section
            </label>
            <input
              id={`upload-section-${category}`}
              name={`section_${category}`}
              type="text"
              autoComplete="off"
              value={section}
              onChange={(e) => onSectionChange(e.target.value)}
              placeholder="All Sections, A, B, Iqbal..."
              className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {showTerm && (
          <div>
            <label
              htmlFor={`upload-term-${category}`}
              className="block text-[11px] font-semibold mb-1"
            >
              Academic Term
            </label>
            <CustomSelect
              id={`upload-term-${category}`}
              value={term}
              onChange={onTermChange}
              options={UPLOAD_TERM_OPTIONS}
              size="sm"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label
            htmlFor={`upload-audience-${category}`}
            className="block text-[11px] font-semibold mb-1"
          >
            Notify &amp; Share With
          </label>
          <CustomSelect
            id={`upload-audience-${category}`}
            value={audience}
            onChange={onAudienceChange}
            options={AUDIENCE_OPTIONS}
            size="sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`upload-notes-${category}`}
            className="block text-[11px] font-semibold mb-1"
          >
            Short Note (Optional)
          </label>
          <input
            id={`upload-notes-${category}`}
            name={`notes_${category}`}
            type="text"
            autoComplete="off"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="e.g. Effective from Monday, reporting time 7:50 AM..."
            className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <Button type="submit" disabled={isUploading || !selectedFile} className="w-full h-9 text-xs">
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        {isUploading ? "Uploading & Notifying..." : "Upload File & Notify Portals"}
      </Button>
    </form>
  );
}
