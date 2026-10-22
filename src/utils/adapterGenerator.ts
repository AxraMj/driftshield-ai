import { DriftItem, AdapterConfig } from '../types/drift';
import { getJsonType, parseSafeNumeric } from './diffEngine';

export { parseSafeNumeric };

/**
 * Custom error thrown when incoming payload cannot satisfy the legacy contract
 */
export class PayloadCompatibilityError extends Error {
  constructor(message: string, public readonly rawPayload?: unknown) {
    super(message);
    this.name = 'PayloadCompatibilityError';
  }
}

/**
 * Documented payment status mapping dictionary.
 * Terminal positive statuses map to true; terminal negative statuses map to false.
 */
export const DOCUMENTED_PAYMENT_STATUS_MAP: Record<string, boolean> = {
  paid: true,
  failed: false,
  unpaid: false,
  canceled: false,
  void: false,
};

/**
 * Converts incoming status string or legacy boolean to strict boolean.
 * Rejects "pending", "succeeded", and unknown statuses with PayloadCompatibilityError.
 * Rejects missing or invalid status instead of defaulting to false.
 */
export function parsePaymentStatusToBoolean(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(DOCUMENTED_PAYMENT_STATUS_MAP, normalized)) {
      return DOCUMENTED_PAYMENT_STATUS_MAP[normalized];
    }
    throw new PayloadCompatibilityError(
      `[DriftShield] Ambiguous or unsupported payment status '${raw}': cannot determine boolean 'paid' without an explicit business policy (e.g. in-flight/pending).`,
      raw
    );
  }
  throw new PayloadCompatibilityError(
    `[DriftShield] Missing or invalid status for required boolean field 'paid'`,
    raw
  );
}

/**
 * Normalizes currency code strings by trimming and converting to lowercase.
 * Returns undefined if raw is null or undefined so required-field validation is preserved.
 */
export function normalizeCurrencyCode(raw: unknown): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? trimmed.toLowerCase() : undefined;
  }
  return String(raw).toLowerCase();
}

export function isCurrencyField(key: string, mapping?: string): boolean {
  const k = key.toLowerCase();
  const m = mapping ? mapping.toLowerCase() : '';
  return k === 'currency' || k.endsWith('_currency') || m.endsWith('currency') || m.endsWith('.currency');
}

export function isPaymentStatusBooleanField(key: string, oldVal: unknown, mapping?: string): boolean {
  if (typeof oldVal !== 'boolean') return false;
  const k = key.toLowerCase();
  const m = mapping ? mapping.toLowerCase() : '';
  return k === 'paid' || m.includes('status') || m.endsWith('.status');
}

/**
 * Converts a comma-delimited string (e.g. "read,write,delete") to an array of trimmed strings.
 * Preserves existing string arrays. Returns undefined if input is missing.
 */
export function parseDelimitedStringToArray(raw: unknown): string[] | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (Array.isArray(raw)) {
    return raw.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  throw new PayloadCompatibilityError(
    `[DriftShield] Expected delimited string or array for list field, received ${typeof raw}`,
    raw
  );
}

/**
 * Converts a boolean value to an integer flag (true -> 1, false -> 0).
 * Preserves valid integer numbers (0, 1). Returns undefined if input is missing.
 * Rejects invalid non-boolean/non-numeric values.
 */
export function parseBooleanToIntegerFlag(raw: unknown): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'boolean') {
    return raw ? 1 : 0;
  }
  if (typeof raw === 'number') {
    if (Number.isFinite(raw)) return raw;
    throw new PayloadCompatibilityError(`[DriftShield] Invalid numeric value for flag: ${raw}`, raw);
  }
  if (raw === 'true' || raw === '1') return 1;
  if (raw === 'false' || raw === '0') return 0;
  throw new PayloadCompatibilityError(
    `[DriftShield] Cannot convert value '${raw}' to integer flag (expected boolean or integer 0/1)`,
    raw
  );
}

/**
 * Determines whether a field represents an array of strings in the legacy contract
 * that is supplied as a delimited string in the incoming payload.
 */
export function isStringArrayDelimitedField(
  key: string,
  oldVal: unknown,
  typeChange?: DriftItem,
  restructured?: DriftItem
): boolean {
  // Legacy contract MUST expect an array
  if (!Array.isArray(oldVal)) return false;

  // Direct drift evidence: type changed from array to string
  if (typeChange && typeChange.oldType === 'array' && typeChange.newType === 'string') {
    return true;
  }

  // Restructured mapping evidence: array restructured into string
  if (restructured && restructured.oldType === 'array' && restructured.newType === 'string') {
    return true;
  }

  // Explicit field name 'permissions' or list-like name when type change or incoming indicates string
  if (key.toLowerCase().includes('permission') && (typeChange?.newType === 'string' || restructured?.newType === 'string')) {
    return true;
  }

  return false;
}

/**
 * Determines whether a field represents an integer flag (e.g. 0 or 1) in the legacy contract
 * that is supplied as a boolean in the incoming payload.
 */
export function isBooleanToIntegerFlagField(
  key: string,
  oldVal: unknown,
  typeChange?: DriftItem,
  restructured?: DriftItem
): boolean {
  // Legacy contract expects a number (specifically 0/1 or numeric flag)
  if (typeof oldVal !== 'number') return false;

  // Direct drift evidence: type changed from number to boolean
  if (typeChange && typeChange.oldType === 'number' && typeChange.newType === 'boolean') {
    return true;
  }

  // Restructured mapping evidence: number restructured into boolean
  if (restructured && restructured.oldType === 'number' && restructured.newType === 'boolean') {
    return true;
  }

  // Flag field with 0 or 1 value when incoming indicates boolean
  if ((oldVal === 0 || oldVal === 1) && (typeChange?.newType === 'boolean' || restructured?.newType === 'boolean')) {
    return true;
  }

  return false;
}


/**
 * Generates TypeScript interface representation for a JSON object
 */
export function generateTypeScriptInterface(name: string, obj: unknown, indent = '  '): string {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return `export type ${name} = ${getTsType(obj)};\n`;
  }

  if (Array.isArray(obj)) {
    const itemType = obj.length > 0 ? getTsType(obj[0]) : 'unknown';
    return `export type ${name} = Array<${itemType}>;\n`;
  }

  const lines: string[] = [`export interface ${name} {`];
  const record = obj as Record<string, unknown>;

  for (const [key, val] of Object.entries(record)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const nestedLines = formatNestedInterface(val as Record<string, unknown>, `${indent}  `);
      lines.push(`${indent}${safeKey}: {\n${nestedLines}\n${indent}};`);
    } else if (Array.isArray(val)) {
      const elemType = val.length > 0 ? getTsType(val[0]) : 'unknown';
      lines.push(`${indent}${safeKey}: Array<${elemType}>;`);
    } else {
      lines.push(`${indent}${safeKey}: ${getTsType(val)};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function formatNestedInterface(record: Record<string, unknown>, indent: string): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(record)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      lines.push(`${indent}${safeKey}: {\n${formatNestedInterface(val as Record<string, unknown>, `${indent}  `)}\n${indent}};`);
    } else if (Array.isArray(val)) {
      const elemType = val.length > 0 ? getTsType(val[0]) : 'unknown';
      lines.push(`${indent}${safeKey}: Array<${elemType}>;`);
    } else {
      lines.push(`${indent}${safeKey}: ${getTsType(val)};`);
    }
  }
  return lines.join('\n');
}

function getTsType(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'unknown[]';
  const t = typeof val;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  return 'unknown';
}

/**
 * Extracts clean property accessor path from a JSONPath or dot notation
 */
export function extractPathParts(pathStr: string): string[] {
  return pathStr
    .replace(/^[$]\.?/, '')
    .replace(/\["([^"]+)"\]/g, '.$1')
    .replace(/\['([^']+)'\]/g, '.$1')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
}

/**
 * Generates the full TypeScript adapter code as a formatted string
 */
export function generateAdapterCode(
  oldObj: unknown,
  newObj: unknown,
  driftItems: DriftItem[],
  config: AdapterConfig
): string {
  const legacyInterface = generateTypeScriptInterface('LegacyPayload', oldObj);
  const incomingInterface = generateTypeScriptInterface('IncomingPayload', newObj);

  const restructuredItems = driftItems.filter(i => i.type === 'RESTUCTURED_RENAME');
  const typeChangedItems = driftItems.filter(i => i.type === 'TYPE_CHANGED');
  const removedItems = driftItems.filter(i => i.type === 'REMOVED');

  const oldRecord = (oldObj && typeof oldObj === 'object' && !Array.isArray(oldObj))
    ? (oldObj as Record<string, unknown>)
    : {};

  const fieldAssignments: string[] = [];
  const requiredValidationFields: string[] = [];

  for (const [key] of Object.entries(oldRecord)) {
    requiredValidationFields.push(key);

    const restructured = restructuredItems.find(r => r.path === key || r.path.endsWith(`.${key}`));
    const mapping = restructured?.suggestedMapping;
    const typeChange = typeChangedItems.find(t => t.path === key || t.path.endsWith(`.${key}`));
    const isRemoved = removedItems.some(r => r.path === key || r.path.endsWith(`.${key}`));

    // 1. Currency normalization (e.g. "USD" -> "usd")
    if (isCurrencyField(key, mapping)) {
      const parts = extractPathParts(mapping || key);
      const accessor = `incoming?.${parts.join('?.')}`;
      const fallback = `incoming?.${key}`;
      fieldAssignments.push(`    // Currency normalization: Trim and convert to lowercase ISO code
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      return normalizeCurrencyCode(raw);
    })(),`);
      continue;
    }

    // 2. Explicit payment status conversion (e.g. "paid" -> true, "failed" -> false)
    if (isPaymentStatusBooleanField(key, oldRecord[key], mapping)) {
      const parts = extractPathParts(mapping || key);
      const accessor = `incoming?.${parts.join('?.')}`;
      const fallback = `incoming?.${key}`;
      fieldAssignments.push(`    // Conversion: Map documented payment status string to boolean (paid: true, failed/unpaid/canceled/void: false)
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      return parsePaymentStatusToBoolean(raw);
    })(),`);
      continue;
    }

    // 3. Delimited string to array conversion (e.g. "read,write,delete" -> ["read", "write", "delete"])
    if (isStringArrayDelimitedField(key, oldRecord[key], typeChange, restructured)) {
      const parts = mapping ? extractPathParts(mapping) : [key];
      const accessor = `incoming?.${parts.join('?.')}`;
      const fallback = `incoming?.${key}`;
      fieldAssignments.push(`    // Conversion: Convert delimited string to string array or preserve array
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      return parseDelimitedStringToArray(raw);
    })(),`);
      continue;
    }

    // 4. Boolean to integer flag conversion (e.g. true -> 1, false -> 0)
    if (isBooleanToIntegerFlagField(key, oldRecord[key], typeChange, restructured)) {
      const parts = mapping ? extractPathParts(mapping) : [key];
      const accessor = `incoming?.${parts.join('?.')}`;
      const fallback = `incoming?.${key}`;
      fieldAssignments.push(`    // Conversion: Convert boolean flag to integer (1 / 0)
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      return parseBooleanToIntegerFlag(raw);
    })(),`);
      continue;
    }

    if (restructured && restructured.suggestedMapping) {
      const parts = extractPathParts(restructured.suggestedMapping);
      const accessor = `incoming?.${parts.join('?.')}`;
      const fallback = `incoming?.${key}`;

      if (restructured.isAmbiguousUnit) {
        if (config.amountRule === 'CENTS_TO_DOLLARS') {
          fieldAssignments.push(`    // Conversion: Convert incoming dollar string to integer cents (x100) or retain existing cents
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
      const parsed = parseSafeNumeric(raw);
      if (parsed === null) throw new PayloadCompatibilityError("Invalid monetary amount for '${key}'", raw);
      return typeof raw === 'string' ? Math.round(parsed * 100) : parsed;
    })(),`);
        } else if (config.amountRule === 'PARSE_FLOAT') {
          fieldAssignments.push(`    // Conversion: Sanitize & parse numeric float
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      const parsed = parseSafeNumeric(raw);
      if (parsed === null) throw new PayloadCompatibilityError("Invalid monetary amount for '${key}'", raw);
      return parsed;
    })(),`);
        } else if (config.amountRule === 'KEEP_AS_STRING') {
          fieldAssignments.push(`    // Conversion: Preserved as string
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      return raw !== undefined ? String(raw) : undefined;
    })(),`);
        } else {
          fieldAssignments.push(`    // Conversion: Strict numeric guard
    ${key}: (() => {
      const raw = ${accessor} !== undefined ? ${accessor} : ${fallback};
      const parsed = parseSafeNumeric(raw);
      if (parsed === null) throw new PayloadCompatibilityError("Strict guard violation for '${key}'", raw);
      return parsed;
    })(),`);
        }
      } else {
        fieldAssignments.push(`    ${key}: ${accessor} !== undefined ? ${accessor} : ${fallback},`);
      }
      continue;
    }

    if (typeChange) {
      if (typeChange.isAmbiguousUnit) {
        if (config.amountRule === 'CENTS_TO_DOLLARS') {
          fieldAssignments.push(`    // Conversion: Convert incoming dollar string to integer cents (x100) or retain existing cents
    ${key}: (() => {
      const raw = incoming?.${key};
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
      const parsed = parseSafeNumeric(raw);
      if (parsed === null) throw new PayloadCompatibilityError("Invalid monetary amount for '${key}'", raw);
      return typeof raw === 'string' ? Math.round(parsed * 100) : parsed;
    })(),`);
        } else if (config.amountRule === 'PARSE_FLOAT') {
          fieldAssignments.push(`    // Conversion: Sanitize & parse numeric float
    ${key}: (() => {
      const raw = incoming?.${key};
      const parsed = parseSafeNumeric(raw);
      if (parsed === null) throw new PayloadCompatibilityError("Invalid monetary amount for '${key}'", raw);
      return parsed;
    })(),`);
        } else if (config.amountRule === 'KEEP_AS_STRING') {
          fieldAssignments.push(`    // Conversion: Preserved as string
    ${key}: incoming?.${key} !== undefined ? String(incoming.${key}) : undefined,`);
        } else {
          fieldAssignments.push(`    // Conversion: Strict numeric guard
    ${key}: (() => {
      const raw = incoming?.${key};
      const parsed = parseSafeNumeric(raw);
      if (parsed === null) throw new PayloadCompatibilityError("Strict guard violation for '${key}'", raw);
      return parsed;
    })(),`);
        }
      } else {
        fieldAssignments.push(`    ${key}: incoming?.${key},`);
      }
      continue;
    }

    if (isRemoved) {
      fieldAssignments.push(`    // Warning: Field '${key}' was omitted from incoming payload; defaults to undefined
    ${key}: incoming?.${key},`);
      continue;
    }

    fieldAssignments.push(`    ${key}: incoming?.${key} !== undefined ? incoming[${JSON.stringify(key)}] : incoming?.${snakeToCamel(key)},`);
  }

  const assertionsCode = config.includeRuntimeAssertions
    ? `
  // Defensive Runtime Assertions: Reject missing legacy fields (no phantom data synthesis)
  const missingKeys: string[] = [];
  const requiredKeys = ${JSON.stringify(requiredValidationFields)};
  for (const k of requiredKeys) {
    if ((adapted as any)[k] === undefined) {
      missingKeys.push(k);
    }
  }
  if (missingKeys.length > 0) {
    throw new PayloadCompatibilityError(
      \`[DriftShield] Invariant violation: adapted payload is missing required legacy fields: \${missingKeys.join(', ')}\`,
      rawInput
    );
  }
`
    : '';

  return `/**
 * @name DriftShield Compatibility Adapter
 * @generated ${new Date().toISOString()}
 * 
 * ⚠️ NOTICE: THIS IS A SUGGESTED ADAPTER GENERATED BY DRIFTSHIELD AI.
 * REQUIRES DEVELOPER CODE REVIEW AND VERIFICATION BEFORE PRODUCTION DEPLOYMENT.
 * 
 * Selected Conversion Rules:
 * - Monetary / Amount Strategy: ${config.amountRule}
 * - Runtime Assertions: ${config.includeRuntimeAssertions ? 'Enabled' : 'Disabled'}
 */

${legacyInterface}

${incomingInterface}

/**
 * Custom error thrown when incoming payload cannot satisfy the legacy contract
 */
export class PayloadCompatibilityError extends Error {
  constructor(message: string, public readonly rawPayload?: unknown) {
    super(message);
    this.name = 'PayloadCompatibilityError';
  }
}

/**
 * Safely parses string or number to a valid finite numeric value,
 * stripping currency signs ($ € £ ¥ ₹), commas, and spaces.
 */
export function parseSafeNumeric(val: unknown): number | null {
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(/[$€£¥₹,\\s]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return null;
    if (!/^-?\\d*(\\.\\d+)?$/.test(cleaned)) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

/**
 * Documented payment status mapping dictionary.
 * Terminal positive statuses map to true; terminal negative statuses map to false.
 */
export const DOCUMENTED_PAYMENT_STATUS_MAP: Record<string, boolean> = {
  paid: true,
  failed: false,
  unpaid: false,
  canceled: false,
  void: false,
};

/**
 * Converts incoming status string or legacy boolean to strict boolean.
 * Rejects "pending", "succeeded", and unknown statuses with PayloadCompatibilityError.
 * Rejects missing or invalid status instead of defaulting to false.
 */
export function parsePaymentStatusToBoolean(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(DOCUMENTED_PAYMENT_STATUS_MAP, normalized)) {
      return DOCUMENTED_PAYMENT_STATUS_MAP[normalized];
    }
    throw new PayloadCompatibilityError(
      \`[DriftShield] Ambiguous or unsupported payment status '\${raw}': cannot determine boolean 'paid' without an explicit business policy (e.g. in-flight/pending).\`,
      raw
    );
  }
  throw new PayloadCompatibilityError(
    \`[DriftShield] Missing or invalid status for required boolean field 'paid'\`,
    raw
  );
}

/**
 * Normalizes currency code strings by trimming and converting to lowercase.
 * Returns undefined if raw is null or undefined so required-field validation is preserved.
 */
export function normalizeCurrencyCode(raw: unknown): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? trimmed.toLowerCase() : undefined;
  }
  return String(raw).toLowerCase();
}

/**
 * Converts a comma-delimited string (e.g. "read,write,delete") to an array of trimmed strings.
 * Preserves existing string arrays. Returns undefined if input is missing.
 */
export function parseDelimitedStringToArray(raw: unknown): string[] | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (Array.isArray(raw)) {
    return raw.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  throw new PayloadCompatibilityError(
    \`[DriftShield] Expected delimited string or array for list field, received \${typeof raw}\`,
    raw
  );
}

/**
 * Converts a boolean value to an integer flag (true -> 1, false -> 0).
 * Preserves valid integer numbers (0, 1). Returns undefined if input is missing.
 * Rejects invalid non-boolean/non-numeric values.
 */
export function parseBooleanToIntegerFlag(raw: unknown): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'boolean') {
    return raw ? 1 : 0;
  }
  if (typeof raw === 'number') {
    if (Number.isFinite(raw)) return raw;
    throw new PayloadCompatibilityError(\`[DriftShield] Invalid numeric value for flag: \${raw}\`, raw);
  }
  if (raw === 'true' || raw === '1') return 1;
  if (raw === 'false' || raw === '0') return 0;
  throw new PayloadCompatibilityError(
    \`[DriftShield] Cannot convert value '\${raw}' to integer flag (expected boolean or integer 0/1)\`,
    raw
  );
}

/**
 * Adapts incoming or modified API / Webhook payloads into the legacy format
 * expected by downstream services and UI components.
 */
export function adaptPayload(rawInput: unknown): LegacyPayload {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new PayloadCompatibilityError('Invalid payload: expected non-null object', rawInput);
  }

  const incoming = rawInput as any;

  const adapted: LegacyPayload = {
${fieldAssignments.join('\n')}
  };
${assertionsCode}
  return adapted;
}
`;
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Creates an executable runtime JavaScript normalizer function for testing in-browser
 */
export function createExecutableAdapter(
  oldObj: unknown,
  _newObj: unknown,
  driftItems: DriftItem[],
  config: AdapterConfig
): (raw: unknown) => Record<string, unknown> {
  const restructuredItems = driftItems.filter(i => i.type === 'RESTUCTURED_RENAME');
  const typeChangedItems = driftItems.filter(i => i.type === 'TYPE_CHANGED');

  const oldRecord = (oldObj && typeof oldObj === 'object' && !Array.isArray(oldObj))
    ? (oldObj as Record<string, unknown>)
    : {};

  return function runtimeAdapter(rawInput: unknown): Record<string, unknown> {
    if (!rawInput || typeof rawInput !== 'object') {
      throw new Error('Payload must be a non-null object');
    }

    const incoming = rawInput as Record<string, any>;
    const adapted: Record<string, any> = {};

    for (const [key] of Object.entries(oldRecord)) {
      const restructured = restructuredItems.find(r => r.path === key || r.path.endsWith(`.${key}`));
      const mapping = restructured?.suggestedMapping;

      let rawVal: any;
      if (restructured && mapping) {
        const parts = extractPathParts(mapping);
        let nestedVal: any = incoming;
        for (const p of parts) {
          nestedVal = nestedVal?.[p];
        }
        const fallback = incoming?.[key];
        rawVal = nestedVal !== undefined ? nestedVal : (fallback !== undefined ? fallback : undefined);
      } else {
        rawVal = incoming?.[key] !== undefined ? incoming[key] : incoming?.[snakeToCamel(key)];
      }

      // 1. Currency normalization
      if (isCurrencyField(key, mapping)) {
        adapted[key] = normalizeCurrencyCode(rawVal);
        continue;
      }

      // 2. Payment status to boolean conversion
      if (isPaymentStatusBooleanField(key, oldRecord[key], mapping)) {
        adapted[key] = parsePaymentStatusToBoolean(rawVal);
        continue;
      }

      const typeChange = typeChangedItems.find(t => t.path === key || t.path.endsWith(`.${key}`));

      // 3. String array delimited field (e.g. "read,write,delete" -> ["read", "write", "delete"])
      if (isStringArrayDelimitedField(key, oldRecord[key], typeChange, restructured)) {
        adapted[key] = parseDelimitedStringToArray(rawVal);
        continue;
      }

      // 4. Boolean to integer flag field (e.g. true -> 1, false -> 0)
      if (isBooleanToIntegerFlagField(key, oldRecord[key], typeChange, restructured)) {
        adapted[key] = parseBooleanToIntegerFlag(rawVal);
        continue;
      }

      // 5. Restructured with ambiguous unit amount
      if (restructured && restructured.isAmbiguousUnit) {
        if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
          adapted[key] = rawVal;
        } else {
          const parsedNum = parseSafeNumeric(rawVal);
          if (parsedNum === null) {
            if (config.amountRule === 'KEEP_AS_STRING') {
              adapted[key] = rawVal !== undefined ? String(rawVal) : undefined;
            } else {
              throw new Error(`[DriftShield] Invalid monetary value for '${key}': ${JSON.stringify(rawVal)}`);
            }
          } else {
            if (config.amountRule === 'CENTS_TO_DOLLARS') {
              adapted[key] = typeof rawVal === 'string' ? Math.round(parsedNum * 100) : parsedNum;
            } else if (config.amountRule === 'PARSE_FLOAT') {
              adapted[key] = parsedNum;
            } else if (config.amountRule === 'KEEP_AS_STRING') {
              adapted[key] = String(rawVal);
            } else {
              adapted[key] = parsedNum;
            }
          }
        }
        continue;
      }

      // 6. Restructured standard
      if (restructured && mapping) {
        adapted[key] = rawVal;
        continue;
      }

      // 7. Type changed check
      if (typeChange) {
        const incomingVal = incoming?.[key];
        if (typeChange.isAmbiguousUnit) {
          if (typeof incomingVal === 'number' && Number.isFinite(incomingVal)) {
            adapted[key] = incomingVal;
          } else {
            const parsedNum = parseSafeNumeric(incomingVal);
            if (parsedNum === null) {
              if (config.amountRule === 'KEEP_AS_STRING') {
                adapted[key] = incomingVal !== undefined ? String(incomingVal) : undefined;
              } else {
                throw new Error(`[DriftShield] Invalid monetary value for '${key}': ${JSON.stringify(incomingVal)}`);
              }
            } else {
              if (config.amountRule === 'CENTS_TO_DOLLARS') {
                adapted[key] = typeof incomingVal === 'string' ? Math.round(parsedNum * 100) : parsedNum;
              } else if (config.amountRule === 'PARSE_FLOAT') {
                adapted[key] = parsedNum;
              } else if (config.amountRule === 'KEEP_AS_STRING') {
                adapted[key] = String(incomingVal);
              } else {
                adapted[key] = parsedNum;
              }
            }
          }
        } else {
          adapted[key] = incomingVal;
        }
        continue;
      }

      // 6. Standard copy
      adapted[key] = rawVal;
    }

    // Defensive Assertions
    if (config.includeRuntimeAssertions) {
      for (const key of Object.keys(oldRecord)) {
        if (adapted[key] === undefined) {
          throw new Error(`[DriftShield] Invariant violation: missing required legacy field '${key}'`);
        }
      }
    }

    return adapted;
  };
}
