export type DriftType = 
  | 'ADDED' 
  | 'REMOVED' 
  | 'TYPE_CHANGED' 
  | 'RESTUCTURED_RENAME'
  | 'ARRAY_TYPE_CHANGED';

export type DriftSeverity = 'BREAKING' | 'WARNING' | 'SAFE';

export interface DriftItem {
  id: string;
  path: string;
  type: DriftType;
  severity: DriftSeverity;
  oldValue?: unknown;
  oldType?: string;
  newValue?: unknown;
  newType?: string;
  suggestedMapping?: string; // e.g. 'customer.id' -> 'customer_id'
  isAmbiguousUnit?: boolean;
  ambiguityDescription?: string;
  description: string;
}

export interface DriftSummary {
  totalChanges: number;
  breakingCount: number;
  warningCount: number;
  safeCount: number;
  hasAmbiguousUnits: boolean;
  overallStatus: 'BREAKING' | 'COMPATIBLE_WITH_ADAPTER' | 'IDENTICAL';
}

export type AmountConversionRule = 
  | 'CENTS_TO_DOLLARS' // string '25.00' * 100 -> 2500
  | 'PARSE_FLOAT'      // string '25.00' -> 25
  | 'KEEP_AS_STRING'   // '25.00'
  | 'CUSTOM_GUARD';    // Throw if not numeric

export interface AdapterConfig {
  amountRule: AmountConversionRule;
  strictTypes: boolean;
  includeRuntimeAssertions: boolean;
  allowPartial: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  targetPayload: 'OLD' | 'NEW' | 'MALFORMED';
  passed: boolean;
  durationMs: number;
  errorMessage?: string;
  input: unknown;
  output?: unknown;
  expectedSnapshot?: Record<string, unknown>;
  fieldMismatches: Array<{
    field: string;
    expected: unknown;
    received: unknown;
    matches: boolean;
  }>;
}

export interface SamplePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  oldPayload: string;
  newPayload: string;
  highlightNotes: string;
}
