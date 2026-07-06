export function gradeChangePercent(original: number, raised: number): number {
  return ((raised - original) / original) * 100;
}

export function originalFromRaisePercent(raised: number, pct: number): number {
  return raised / (1 + pct / 100);
}
