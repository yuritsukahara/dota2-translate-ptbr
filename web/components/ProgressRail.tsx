export function ProgressRail({ label, value, tone = "gold" }: { label: string; value: number; tone?: "gold" | "rust" | "red" }) {
  return (
    <div className="progress-row">
      <div className="progress-label"><span>{label}</span><span>{value}%</span></div>
      <div className="progress-track"><div className={`progress-fill ${tone}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}
