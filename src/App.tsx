import { useState } from "react";
import { Sidebar } from "./features/Sidebar";

export default function App() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={setSelectedSubjectId}
      />
      <main className="flex-1 p-6">
        {selectedSubjectId ? (
          <p className="text-slate-500">Subject detail comes in Task 8.</p>
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome to IntelliGrade</h2>
              <p className="text-slate-400">
                Create a semester, add a subject, and start tracking grades.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
