import { DriftItem, DriftSummary, DriftSeverity, DriftType } from '../types/drift';

export interface FlattenedField {
  path: string;
  key: string;
  segments: string[];
  value: unknown;
  type: string;
  parentPath: string;
}

/**
 * Returns precise JSON value type
 */
export function getJsonType(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

/**
 * Formats a key safely according to JSON path conventions
 */
export function formatPathSegment(segment: string, isFirst: boolean): string {
  if (segment === '$') return '$';
  if (/^\[\d+\]$/.test(segment) || segment === '[*]') return segment;
  
  // If segment contains dots, spaces, quotes, brackets, or special characters, use bracket notation
  if (/[. \-[\]"'/\\#@!]/.test(segment) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment)) {
    return `[${JSON.stringify(segment)}]`;
  }
  
  return isFirst ? segment : `.${segment}`;
}

export function buildPathString(segments: string[]): string {
  if (segments.length === 0) return '$';
  let path = '';
  for (let i = 0; i < segments.length; i++) {
    path += formatPathSegment(segments[i], i === 0);
  }
  return path;
}

/**
 * Recursively flattens an object into a map of structured paths
 */
export function flattenObject(
  obj: unknown,
  currentSegments: string[] = [],
  result: Map<string, FlattenedField> = new Map()
): Map<string, FlattenedField> {
  // Handle root primitive or scalar leaf
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    const segments = currentSegments.length === 0 ? ['$'] : currentSegments;
    const path = buildPathString(segments);
    const key = segments[segments.length - 1];
    const parentPath = buildPathString(segments.slice(0, -1));

    result.set(path, {
      path,
      key,
      segments,
      value: obj,
      type: getJsonType(obj),
      parentPath,
    });
    return result;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    const segments = currentSegments.length === 0 ? ['$'] : currentSegments;
    const path = buildPathString(segments);
    const key = segments[segments.length - 1];
    const parentPath = buildPathString(segments.slice(0, -1));

    result.set(path, {
      path,
      key,
      segments,
      value: obj,
      type: 'array',
      parentPath,
    });

    if (obj.length > 0) {
      if (typeof obj[0] === 'object' && obj[0] !== null) {
        // Sample first object element
        flattenObject(obj[0], [...segments, '[0]'], result);
      } else {
        // Record primitive array element type
        const elemSegments = [...segments, '[*]'];
        const elemPath = buildPathString(elemSegments);
        result.set(elemPath, {
          path: elemPath,
          key: '[*]',
          segments: elemSegments,
          value: obj[0],
          type: getJsonType(obj[0]),
          parentPath: path,
        });
      }
    }
    return result;
  }

  // Handle Standard Objects
  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length === 0 && currentSegments.length > 0) {
    const path = buildPathString(currentSegments);
    const key = currentSegments[currentSegments.length - 1];
    const parentPath = buildPathString(currentSegments.slice(0, -1));

    result.set(path, {
      path,
      key,
      segments: currentSegments,
      value: {},
      type: 'object',
      parentPath,
    });
    return result;
  }

  for (const key of keys) {
    const nextSegments = [...currentSegments, key];
    const fullPath = buildPathString(nextSegments);
    const value = record[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result.set(fullPath, {
        path: fullPath,
        key,
        segments: nextSegments,
        value,
        type: 'object',
        parentPath: buildPathString(currentSegments),
      });
      // Recurse into nested object
      flattenObject(value, nextSegments, result);
    } else if (Array.isArray(value)) {
      result.set(fullPath, {
        path: fullPath,
        key,
        segments: nextSegments,
        value,
        type: 'array',
        parentPath: buildPathString(currentSegments),
      });
      if (value.length > 0) {
        if (typeof value[0] === 'object' && value[0] !== null) {
          flattenObject(value[0], [...nextSegments, '[0]'], result);
        } else {
          // Record primitive element type under array
          const elemSegments = [...nextSegments, '[*]'];
          const elemPath = buildPathString(elemSegments);
          result.set(elemPath, {
            path: elemPath,
            key: '[*]',
            segments: elemSegments,
            value: value[0],
            type: getJsonType(value[0]),
            parentPath: fullPath,
          });
        }
      }
    } else {
      result.set(fullPath, {
        path: fullPath,
        key,
        segments: nextSegments,
        value,
        type: getJsonType(value),
        parentPath: buildPathString(currentSegments),
      });
    }
  }

  return result;
}

/**
 * Safely parses and sanitizes numeric or financial inputs from string or number.
 * Strips currency symbols ($ € £ ¥ ₹), commas, and surrounding whitespace.
 * Validates that the remaining string is a valid finite numeric token.
 */
export function parseSafeNumeric(val: unknown): number | null {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(/[$€£¥₹,\s]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return null;
    if (!/^-?\d*(\.\d+)?$/.test(cleaned)) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

/**
 * Checks if a field name is likely financial / monetary or unit sensitive
 */
export function isFinancialOrUnitField(path: string): boolean {
  const normalized = path.toLowerCase();
  const financialTokens = ['amount', 'price', 'total', 'subtotal', 'fee', 'cost', 'balance', 'cents', 'charge', 'rate'];
  return financialTokens.some(token => normalized.includes(token));
}

/**
 * Normalizes tokens for restructuring inference
 */
function tokenizeKey(key: string): string[] {
  return key
    .replace(/[[\]"']/g, '.')
    .split(/[\._\-]/)
    .filter(Boolean)
    .map(k => k.toLowerCase());
}

/**
 * Determines whether two paths represent a likely restructuring
 */
function arePathsRestructured(oldPath: string, newPath: string, oldVal: unknown, newVal: unknown): boolean {
  if (oldPath === newPath) return false;

  const oldTokens = tokenizeKey(oldPath);
  const newTokens = tokenizeKey(newPath);
  const commonTokens = oldTokens.filter(t => newTokens.includes(t));

  const valuesMatch =
    oldVal !== undefined &&
    newVal !== undefined &&
    oldVal !== null &&
    newVal !== null &&
    typeof oldVal !== 'object' &&
    typeof newVal !== 'object' &&
    String(oldVal).trim().toLowerCase() === String(newVal).trim().toLowerCase();

  if (valuesMatch && commonTokens.length > 0) {
    return true;
  }

  const oldJoined = oldTokens.join('');
  const newJoined = newTokens.join('');
  if (oldJoined.length > 1 && oldJoined === newJoined) {
    return true;
  }

  // Value is a string matching the old key name (e.g., status: "paid" for legacy paid: true)
  if (
    typeof newVal === 'string' &&
    oldTokens.some(token => token.length > 1 && String(newVal).toLowerCase().includes(token))
  ) {
    return true;
  }

  // Both are financial/monetary fields sharing primary tokens
  // (e.g., 'subtotal' and 'data.invoice.subtotal_amount')
  if (
    isFinancialOrUnitField(oldPath) &&
    isFinancialOrUnitField(newPath) &&
    commonTokens.some(t => ['subtotal', 'amount', 'total', 'price', 'fee', 'cost', 'balance', 'charge'].includes(t))
  ) {
    const oldNum = parseSafeNumeric(oldVal);
    const newNum = parseSafeNumeric(newVal);
    if (oldNum !== null && newNum !== null) {
      return true;
    }
  }

  return false;
}

/**
 * Main deterministic drift detection engine
 */
export function detectPayloadDrift(
  oldRaw: unknown,
  newRaw: unknown
): { items: DriftItem[]; summary: DriftSummary } {
  const oldFlat = flattenObject(oldRaw);
  const newFlat = flattenObject(newRaw);

  const items: DriftItem[] = [];
  const processedOldPaths = new Set<string>();
  const processedNewPaths = new Set<string>();

  // 1. Direct path comparisons & type changes
  for (const [path, oldField] of oldFlat.entries()) {
    if (newFlat.has(path)) {
      const newField = newFlat.get(path)!;
      processedOldPaths.add(path);
      processedNewPaths.add(path);

      if (oldField.type !== newField.type) {
        const isUnitSensitive = isFinancialOrUnitField(path);

        let ambiguityDescription: string | undefined;
        if (isUnitSensitive && ((oldField.type === 'number' && newField.type === 'string') || (oldField.type === 'string' && newField.type === 'number'))) {
          ambiguityDescription = `Type mutated from ${oldField.type} to ${newField.type} (e.g., ${JSON.stringify(oldField.value)} -> ${JSON.stringify(newField.value)}). Do not assume equivalent units (e.g. integer cents vs decimal currency). Developer must provide an explicit conversion rule.`;
        }

        items.push({
          id: `type-change-${path}`,
          path,
          type: 'TYPE_CHANGED',
          severity: 'BREAKING',
          oldValue: oldField.value,
          oldType: oldField.type,
          newValue: newField.value,
          newType: newField.type,
          isAmbiguousUnit: isUnitSensitive,
          ambiguityDescription,
          description: `Field '${path}' type mutated from ${oldField.type} to ${newField.type}.`,
        });
      }
    }
  }

  // 2. Identify missing fields in old that might have been restructured in new
  const candidateOldRemovals: FlattenedField[] = [];
  for (const [path, oldField] of oldFlat.entries()) {
    if (!processedOldPaths.has(path)) {
      candidateOldRemovals.push(oldField);
    }
  }

  const candidateNewAdditions: FlattenedField[] = [];
  for (const [path, newField] of newFlat.entries()) {
    if (!processedNewPaths.has(path)) {
      candidateNewAdditions.push(newField);
    }
  }

  // 3. Match restructured / renamed fields
  for (const oldField of candidateOldRemovals) {
    if (oldField.type === 'object') continue;

    let matchedAddition: FlattenedField | null = null;
    for (const newField of candidateNewAdditions) {
      if (processedNewPaths.has(newField.path)) continue;
      if (newField.type === 'object') continue;

      if (arePathsRestructured(oldField.path, newField.path, oldField.value, newField.value)) {
        matchedAddition = newField;
        break;
      }
    }

    if (matchedAddition) {
      processedOldPaths.add(oldField.path);
      processedNewPaths.add(matchedAddition.path);

      const oldParsed = parseSafeNumeric(oldField.value);
      const newParsed = parseSafeNumeric(matchedAddition.value);

      const isUnitSensitive =
        (isFinancialOrUnitField(oldField.path) || isFinancialOrUnitField(matchedAddition.path)) &&
        (oldField.type !== matchedAddition.type ||
          (oldParsed !== null && newParsed !== null && oldParsed !== newParsed));

      let ambiguityDescription: string | undefined;
      if (isUnitSensitive) {
        ambiguityDescription = `Restructured field '${oldField.path}' -> '${matchedAddition.path}' has potential unit shift (${JSON.stringify(oldField.value)} vs ${JSON.stringify(matchedAddition.value)}). Explicit conversion rule required.`;
      }

      items.push({
        id: `restructured-${oldField.path}-to-${matchedAddition.path}`,
        path: oldField.path,
        type: 'RESTUCTURED_RENAME',
        severity: 'BREAKING',
        oldValue: oldField.value,
        oldType: oldField.type,
        newValue: matchedAddition.value,
        newType: matchedAddition.type,
        suggestedMapping: matchedAddition.path,
        isAmbiguousUnit: isUnitSensitive,
        ambiguityDescription,
        description: `Field restructured: '${oldField.path}' has moved to '${matchedAddition.path}'. Downstream code reading '${oldField.path}' will encounter undefined.`,
      });
    }
  }

  // 4. Remaining removed fields
  for (const oldField of candidateOldRemovals) {
    if (processedOldPaths.has(oldField.path)) continue;
    if (oldField.type === 'object') continue;

    items.push({
      id: `removed-${oldField.path}`,
      path: oldField.path,
      type: 'REMOVED',
      severity: 'BREAKING',
      oldValue: oldField.value,
      oldType: oldField.type,
      description: `Field '${oldField.path}' was removed from the new payload. Breaking change for existing consumers.`,
    });
  }

  // 5. Remaining added fields
  for (const newField of candidateNewAdditions) {
    if (processedNewPaths.has(newField.path)) continue;
    if (newField.type === 'object') continue;

    items.push({
      id: `added-${newField.path}`,
      path: newField.path,
      type: 'ADDED',
      severity: 'SAFE',
      newValue: newField.value,
      newType: newField.type,
      description: `New field '${newField.path}' of type ${newField.type} was introduced. Non-breaking if optional.`,
    });
  }

  // Sort items: Breaking first, then Warnings, then Safe
  const severityOrder: Record<DriftSeverity, number> = {
    BREAKING: 1,
    WARNING: 2,
    SAFE: 3,
  };
  items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Strict mathematical partition: every item has exactly one severity category
  const breakingCount = items.filter(i => i.severity === 'BREAKING').length;
  const warningCount = items.filter(i => i.severity === 'WARNING').length;
  const safeCount = items.filter(i => i.severity === 'SAFE').length;
  const hasAmbiguousUnits = items.some(i => i.isAmbiguousUnit);

  let overallStatus: 'BREAKING' | 'COMPATIBLE_WITH_ADAPTER' | 'IDENTICAL' = 'IDENTICAL';
  if (items.length === 0) {
    overallStatus = 'IDENTICAL';
  } else if (breakingCount > 0) {
    overallStatus = 'BREAKING';
  } else {
    overallStatus = 'COMPATIBLE_WITH_ADAPTER';
  }

  const summary: DriftSummary = {
    totalChanges: items.length,
    breakingCount,
    warningCount,
    safeCount,
    hasAmbiguousUnits,
    overallStatus,
  };

  return { items, summary };
}
