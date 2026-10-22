import { TestCaseResult, AdapterConfig, DriftItem } from '../types/drift';
import {
  createExecutableAdapter,
  parseSafeNumeric,
  normalizeCurrencyCode,
  parsePaymentStatusToBoolean,
  parseDelimitedStringToArray,
  parseBooleanToIntegerFlag,
  isCurrencyField,
  isPaymentStatusBooleanField,
  isStringArrayDelimitedField,
  isBooleanToIntegerFlagField,
  extractPathParts,
} from './adapterGenerator';

/**
 * Runs a real test suite executing the adapter function against both payloads
 */
export function runCompatibilitySuite(
  oldPayload: unknown,
  newPayload: unknown,
  driftItems: DriftItem[],
  config: AdapterConfig
): TestCaseResult[] {
  const adapter = createExecutableAdapter(oldPayload, newPayload, driftItems, config);

  const results: TestCaseResult[] = [];
  const oldRecord = (oldPayload && typeof oldPayload === 'object' && !Array.isArray(oldPayload))
    ? (oldPayload as Record<string, unknown>)
    : {};

  const newRecord = (newPayload && typeof newPayload === 'object' && !Array.isArray(newPayload))
    ? (newPayload as Record<string, unknown>)
    : {};

  // Build DYNAMIC expected snapshot for the adapted new payload
  const expectedSnapshotForNew: Record<string, unknown> = {};
  const restructuredItems = driftItems.filter(i => i.type === 'RESTUCTURED_RENAME');
  const typeChangedItems = driftItems.filter(i => i.type === 'TYPE_CHANGED');
  const removedItems = driftItems.filter(i => i.type === 'REMOVED');

  for (const [key, oldVal] of Object.entries(oldRecord)) {
    const isRemoved = removedItems.some(r => r.path === key || r.path.endsWith(`.${key}`));
    if (isRemoved) {
      expectedSnapshotForNew[key] = undefined;
      continue;
    }

    const restructured = restructuredItems.find(r => r.path === key || r.path.endsWith(`.${key}`));
    const mapping = restructured?.suggestedMapping;
    let incomingVal: unknown = undefined;

    if (restructured && mapping) {
      const parts = extractPathParts(mapping);
      let curr: any = newRecord;
      for (const p of parts) {
        curr = curr?.[p];
      }
      incomingVal = curr !== undefined ? curr : newRecord[key];
    } else {
      incomingVal = newRecord[key];
    }

    // Currency normalization rule
    if (isCurrencyField(key, mapping)) {
      expectedSnapshotForNew[key] = normalizeCurrencyCode(incomingVal);
      continue;
    }

    // Payment status to boolean rule
    if (isPaymentStatusBooleanField(key, oldVal, mapping)) {
      try {
        expectedSnapshotForNew[key] = parsePaymentStatusToBoolean(incomingVal);
      } catch {
        expectedSnapshotForNew[key] = undefined;
      }
      continue;
    }

    const typeChange = typeChangedItems.find(t => t.path === key || t.path.endsWith(`.${key}`));

    // Delimited string to array rule (e.g. "read,write,delete" -> ["read", "write", "delete"])
    if (isStringArrayDelimitedField(key, oldVal, typeChange, restructured)) {
      try {
        expectedSnapshotForNew[key] = parseDelimitedStringToArray(incomingVal);
      } catch {
        expectedSnapshotForNew[key] = undefined;
      }
      continue;
    }

    // Boolean to integer flag rule (e.g. true -> 1, false -> 0)
    if (isBooleanToIntegerFlagField(key, oldVal, typeChange, restructured)) {
      try {
        expectedSnapshotForNew[key] = parseBooleanToIntegerFlag(incomingVal);
      } catch {
        expectedSnapshotForNew[key] = undefined;
      }
      continue;
    }

    const isAmbiguous = (typeChange && typeChange.isAmbiguousUnit) || (restructured && restructured.isAmbiguousUnit);
    if (isAmbiguous) {
      const parsedNum = parseSafeNumeric(incomingVal);
      if (parsedNum !== null) {
        if (config.amountRule === 'CENTS_TO_DOLLARS') {
          expectedSnapshotForNew[key] = typeof incomingVal === 'string' ? Math.round(parsedNum * 100) : parsedNum;
        } else if (config.amountRule === 'PARSE_FLOAT') {
          expectedSnapshotForNew[key] = parsedNum;
        } else if (config.amountRule === 'KEEP_AS_STRING') {
          expectedSnapshotForNew[key] = String(incomingVal);
        } else {
          expectedSnapshotForNew[key] = parsedNum;
        }
      } else {
        expectedSnapshotForNew[key] = incomingVal !== undefined ? incomingVal : undefined;
      }
    } else {
      expectedSnapshotForNew[key] = incomingVal !== undefined ? incomingVal : undefined;
    }
  }

  // 1. Test Case: Old Payload Regression (Invariance)
  const t1Start = performance.now();
  try {
    const output = adapter(oldPayload);
    const durationMs = Number((performance.now() - t1Start).toFixed(2));
    const fieldMismatches: TestCaseResult['fieldMismatches'] = [];

    let allMatch = true;
    for (const [key, expVal] of Object.entries(oldRecord)) {
      const recVal = output[key];
      let match = JSON.stringify(recVal) === JSON.stringify(expVal);
      if (typeof expVal === 'boolean' && typeof recVal !== 'boolean') {
        match = false;
      }
      if (typeof expVal === 'number' && typeof recVal !== 'number') {
        match = false;
      }
      if (typeof expVal === 'string' && typeof recVal !== 'string') {
        match = false;
      }
      if (Array.isArray(expVal) && !Array.isArray(recVal)) {
        match = false;
      }
      if (!match) allMatch = false;
      fieldMismatches.push({
        field: key,
        expected: expVal,
        received: recVal,
        matches: match,
      });
    }

    results.push({
      id: 'test-legacy-invariance',
      name: 'Legacy Regression Test (Old Payload)',
      description: 'Verifies the adapter preserves legacy payload structure without regressions or property drops.',
      targetPayload: 'OLD',
      passed: allMatch,
      durationMs,
      input: oldPayload,
      output,
      expectedSnapshot: oldRecord,
      fieldMismatches,
    });
  } catch (err: unknown) {
    const durationMs = Number((performance.now() - t1Start).toFixed(2));
    results.push({
      id: 'test-legacy-invariance',
      name: 'Legacy Regression Test (Old Payload)',
      description: 'Verifies the adapter preserves legacy payload structure without regressions.',
      targetPayload: 'OLD',
      passed: false,
      durationMs,
      errorMessage: err instanceof Error ? err.message : String(err),
      input: oldPayload,
      fieldMismatches: [],
    });
  }

  // 2. Test Case: Forward Compatibility (New Payload)
  const t2Start = performance.now();
  try {
    const output = adapter(newPayload);
    const durationMs = Number((performance.now() - t2Start).toFixed(2));
    const fieldMismatches: TestCaseResult['fieldMismatches'] = [];

    let allMatch = true;
    for (const [key, expVal] of Object.entries(expectedSnapshotForNew)) {
      const recVal = output[key];
      const legacyVal = oldRecord[key];
      let match = JSON.stringify(recVal) === JSON.stringify(expVal);

      // Verify runtime types against expected snapshot
      if (typeof expVal === 'boolean' && typeof recVal !== 'boolean') {
        match = false;
      }
      if (typeof expVal === 'number' && typeof recVal !== 'number') {
        match = false;
      }
      if (typeof expVal === 'string' && typeof recVal !== 'string') {
        match = false;
      }
      if (Array.isArray(expVal) && !Array.isArray(recVal)) {
        match = false;
      }

      // Verify runtime types against original legacy contract
      if (Array.isArray(legacyVal) && !Array.isArray(recVal)) {
        match = false;
      }
      if (typeof legacyVal === 'boolean' && typeof recVal !== 'boolean') {
        match = false;
      }
      if (typeof legacyVal === 'number' && typeof recVal !== 'number' && config.amountRule !== 'KEEP_AS_STRING') {
        match = false;
      }
      if (typeof legacyVal === 'string' && typeof recVal !== 'string') {
        match = false;
      }

      if (!match) allMatch = false;
      fieldMismatches.push({
        field: key,
        expected: expVal,
        received: recVal,
        matches: match,
      });
    }

    results.push({
      id: 'test-forward-compatibility',
      name: 'Forward Compatibility Test (New Payload)',
      description: 'Executes adapter on the modified schema to verify all legacy consumer fields are satisfied dynamically.',
      targetPayload: 'NEW',
      passed: allMatch,
      durationMs,
      input: newPayload,
      output,
      expectedSnapshot: expectedSnapshotForNew,
      fieldMismatches,
    });
  } catch (err: unknown) {
    const durationMs = Number((performance.now() - t2Start).toFixed(2));
    results.push({
      id: 'test-forward-compatibility',
      name: 'Forward Compatibility Test (New Payload)',
      description: 'Executes adapter on the modified schema.',
      targetPayload: 'NEW',
      passed: false,
      durationMs,
      errorMessage: err instanceof Error ? err.message : String(err),
      input: newPayload,
      fieldMismatches: [],
    });
  }

  // 3. Test Case: Empty / Malformed Payload Defensive Guard
  const t3Start = performance.now();
  try {
    const output = adapter({});
    const durationMs = Number((performance.now() - t3Start).toFixed(2));
    // If runtime assertions are disabled, adapter may return empty/undefined without throwing
    const passed = !config.includeRuntimeAssertions;
    results.push({
      id: 'test-empty-guard',
      name: 'Defensive Null/Empty Input Guard',
      description: 'Checks behavior when empty object {} is supplied. (Assertions disabled: permissive mode)',
      targetPayload: 'MALFORMED',
      passed,
      durationMs,
      input: {},
      output,
      fieldMismatches: [],
    });
  } catch (err: unknown) {
    const durationMs = Number((performance.now() - t3Start).toFixed(2));
    // When runtime assertions are enabled, throwing is the correct defensive behavior
    const passed = config.includeRuntimeAssertions;
    results.push({
      id: 'test-empty-guard',
      name: 'Defensive Null/Empty Input Guard',
      description: 'Checks behavior when empty object {} is supplied. Successfully triggers defensive invariant assertion.',
      targetPayload: 'MALFORMED',
      passed,
      durationMs,
      errorMessage: err instanceof Error ? err.message : String(err),
      input: {},
      fieldMismatches: [],
    });
  }

  return results;
}
