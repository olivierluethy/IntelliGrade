export interface GradeScale {
  id: string;
  label: string;
  min: number;
  max: number;
  passThreshold: number;
  higherIsBetter: boolean;
  isPassing(value: number): boolean;
  fromPoints(earned: number, max: number): number;
  colorFor(value: number): string;
  format(value: number): string;
  clampValid(value: number): boolean;
}
