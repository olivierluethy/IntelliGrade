type Props = { semesterId: string | null; subjectId: string | null };

export function ToolsPage(_props: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Tools</h2>
        <p className="text-sm text-slate-400">
          Verify grades, model curves, and compute percentage changes.
        </p>
      </header>
      {/* Calculator cards added in Tasks 6–8 */}
    </div>
  );
}
