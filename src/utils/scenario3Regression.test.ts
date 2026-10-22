import {
  parseDelimitedStringToArray,
  parseBooleanToIntegerFlag,
  isStringArrayDelimitedField,
  isBooleanToIntegerFlagField,
  generateAdapterCode,
  PayloadCompatibilityError,
} from './adapterGenerator';
import { detectPayloadDrift } from './diffEngine';
import { runCompatibilitySuite } from './testRunner';
import { SAMPLE_PRESETS } from '../data/samplePresets';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`Deep equality assertion failed: ${message}\nExpected: ${expectedStr}\nActual:   ${actualStr}`);
  }
}

function assertThrows(fn: () => void, errorType: any, message: string) {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
    if (errorType && !(err instanceof errorType)) {
      throw new Error(`Expected error instance of ${errorType.name}, got ${err}`);
    }
  }
  if (!threw) {
    throw new Error(`Expected function to throw: ${message}`);
  }
}

console.log('--- Starting DriftShield AI Regression Suite ---\n');

// 1. parseDelimitedStringToArray tests
console.log('1. Testing parseDelimitedStringToArray...');
assertDeepEqual(
  parseDelimitedStringToArray('read,write,delete'),
  ['read', 'write', 'delete'],
  'converts comma-delimited string to array'
);
assertDeepEqual(
  parseDelimitedStringToArray(' read , write , delete '),
  ['read', 'write', 'delete'],
  'trims whitespace and filters empty items'
);
assertDeepEqual(
  parseDelimitedStringToArray('single_item'),
  ['single_item'],
  'handles single item string'
);
assertDeepEqual(
  parseDelimitedStringToArray(''),
  [],
  'empty string produces empty array'
);
assertDeepEqual(
  parseDelimitedStringToArray(['read', 'write']),
  ['read', 'write'],
  'preserves pre-existing array'
);
assert(
  parseDelimitedStringToArray(null) === undefined,
  'null returns undefined for required-field validation'
);
assert(
  parseDelimitedStringToArray(undefined) === undefined,
  'undefined returns undefined for required-field validation'
);
assertThrows(
  () => parseDelimitedStringToArray(12345),
  PayloadCompatibilityError,
  'rejects numbers with PayloadCompatibilityError'
);
assertThrows(
  () => parseDelimitedStringToArray({ role: 'admin' }),
  PayloadCompatibilityError,
  'rejects objects with PayloadCompatibilityError'
);
console.log('   ✓ parseDelimitedStringToArray passed all assertions.');

// 2. parseBooleanToIntegerFlag tests
console.log('2. Testing parseBooleanToIntegerFlag...');
assert(parseBooleanToIntegerFlag(true) === 1, 'boolean true converts to integer 1');
assert(parseBooleanToIntegerFlag(false) === 0, 'boolean false converts to integer 0');
assert(parseBooleanToIntegerFlag(1) === 1, 'numeric 1 preserved');
assert(parseBooleanToIntegerFlag(0) === 0, 'numeric 0 preserved');
assert(parseBooleanToIntegerFlag('true') === 1, 'string "true" converts to 1');
assert(parseBooleanToIntegerFlag('false') === 0, 'string "false" converts to 0');
assert(parseBooleanToIntegerFlag('1') === 1, 'string "1" converts to 1');
assert(parseBooleanToIntegerFlag('0') === 0, 'string "0" converts to 0');
assert(parseBooleanToIntegerFlag(null) === undefined, 'null returns undefined');
assert(parseBooleanToIntegerFlag(undefined) === undefined, 'undefined returns undefined');
assertThrows(
  () => parseBooleanToIntegerFlag('pending'),
  PayloadCompatibilityError,
  'rejects string "pending"'
);
assertThrows(
  () => parseBooleanToIntegerFlag('active'),
  PayloadCompatibilityError,
  'rejects arbitrary non-boolean strings'
);
console.log('   ✓ parseBooleanToIntegerFlag passed all assertions.');

// 3. Evidence predicate tests
console.log('3. Testing evidence predicates...');
assert(
  isStringArrayDelimitedField('permissions', ['read', 'write'], {
    id: 't1',
    path: 'permissions',
    type: 'TYPE_CHANGED',
    severity: 'BREAKING',
    oldType: 'array',
    newType: 'string',
    description: '',
  }),
  'recognizes array-to-string type change on permissions'
);
assert(
  !isStringArrayDelimitedField('permissions', 'read,write'),
  'rejects when legacy is not an array'
);
assert(
  !isStringArrayDelimitedField('tags', ['a', 'b'], {
    id: 't2',
    path: 'tags',
    type: 'TYPE_CHANGED',
    severity: 'BREAKING',
    oldType: 'array',
    newType: 'number',
    description: '',
  }),
  'rejects when incoming type is not string'
);

assert(
  isBooleanToIntegerFlagField('is_verified', 1, {
    id: 't3',
    path: 'is_verified',
    type: 'TYPE_CHANGED',
    severity: 'BREAKING',
    oldType: 'number',
    newType: 'boolean',
    description: '',
  }),
  'recognizes number-to-boolean type change on integer flag'
);
assert(
  !isBooleanToIntegerFlagField('is_verified', 'true'),
  'rejects when legacy is not a number'
);
assert(
  !isBooleanToIntegerFlagField('amount', 2500, {
    id: 't4',
    path: 'amount',
    type: 'TYPE_CHANGED',
    severity: 'BREAKING',
    oldType: 'number',
    newType: 'string',
    description: '',
  }),
  'rejects non-boolean incoming drift on numeric field'
);
console.log('   ✓ Evidence predicates passed all assertions.');

// 4. Scenario 1: Customer & Amount Drift
console.log('4. Testing Scenario 1 (Customer & Amount Drift)...');
const preset1 = SAMPLE_PRESETS[0];
const oldObj1 = JSON.parse(preset1.oldPayload);
const newObj1 = JSON.parse(preset1.newPayload);
const drift1 = detectPayloadDrift(oldObj1, newObj1);
const suite1 = runCompatibilitySuite(oldObj1, newObj1, drift1.items, {
  amountRule: 'CENTS_TO_DOLLARS',
  includeRuntimeAssertions: true,
  strictTypes: true,
  allowPartial: false,
});
for (const test of suite1) {
  assert(test.passed, `Preset 1 test '${test.name}' failed: ${test.errorMessage || JSON.stringify(test.fieldMismatches)}`);
}
console.log('   ✓ Scenario 1 passed all 3 verification suite tests (100%).');

// 5. Scenario 2: Payment Webhook v1 to v2 Envelope
console.log('5. Testing Scenario 2 (Payment Webhook v1 to v2 Envelope)...');
const preset2 = SAMPLE_PRESETS[1];
const oldObj2 = JSON.parse(preset2.oldPayload);
const newObj2 = JSON.parse(preset2.newPayload);
const drift2 = detectPayloadDrift(oldObj2, newObj2);
const suite2 = runCompatibilitySuite(oldObj2, newObj2, drift2.items, {
  amountRule: 'CENTS_TO_DOLLARS',
  includeRuntimeAssertions: true,
  strictTypes: true,
  allowPartial: false,
});
for (const test of suite2) {
  assert(test.passed, `Preset 2 test '${test.name}' failed: ${test.errorMessage || JSON.stringify(test.fieldMismatches)}`);
}
// Check specific values in adapted output of forward compatibility
const forwardTest2 = suite2.find(t => t.id === 'test-forward-compatibility')!;
const out2 = forwardTest2.output as Record<string, any>;
assert(out2.subtotal === 4900, `subtotal must be 4900, got ${out2.subtotal}`);
assert(out2.currency === 'usd', `currency must be 'usd', got ${out2.currency}`);
assert(out2.paid === true, `paid must be true, got ${out2.paid}`);
assert(typeof out2.paid === 'boolean', `paid must be boolean`);
console.log('   ✓ Scenario 2 passed all 3 verification suite tests and specific assertions.');

// 6. Scenario 3: User Identity & Permissions Schema Drift
console.log('6. Testing Scenario 3 (User Identity & Permissions Schema)...');
const preset3 = SAMPLE_PRESETS[2];
const oldObj3 = JSON.parse(preset3.oldPayload);
const newObj3 = JSON.parse(preset3.newPayload);
const drift3 = detectPayloadDrift(oldObj3, newObj3);
const suite3 = runCompatibilitySuite(oldObj3, newObj3, drift3.items, {
  amountRule: 'PARSE_FLOAT',
  includeRuntimeAssertions: true,
  strictTypes: true,
  allowPartial: false,
});
for (const test of suite3) {
  assert(test.passed, `Preset 3 test '${test.name}' failed: ${test.errorMessage || JSON.stringify(test.fieldMismatches)}`);
}
const forwardTest3 = suite3.find(t => t.id === 'test-forward-compatibility')!;
const out3 = forwardTest3.output as Record<string, any>;
assertDeepEqual(
  out3.permissions,
  ['read', 'write', 'delete'],
  'permissions adapted from "read,write,delete" to ["read", "write", "delete"]'
);
assert(
  out3.is_verified === 1,
  `is_verified adapted from true to integer 1, got ${out3.is_verified}`
);
assert(
  typeof out3.is_verified === 'number',
  'is_verified runtime type is number'
);
assert(
  out3.userId === 'usr_882',
  `userId adapted from user.id: 'usr_882', got ${out3.userId}`
);
assert(
  out3.role === 'admin',
  `role adapted from user.role_info.name: 'admin', got ${out3.role}`
);
console.log('   ✓ Scenario 3 passed all 3 verification suite tests and verified legacy contract preservation.');

// 7. Verify generated TypeScript code for Scenario 3
console.log('7. Testing TypeScript adapter generation code for Scenario 3...');
const code3 = generateAdapterCode(oldObj3, newObj3, drift3.items, {
  amountRule: 'PARSE_FLOAT',
  includeRuntimeAssertions: true,
  strictTypes: true,
  allowPartial: false,
});
assert(code3.includes('parseDelimitedStringToArray'), 'generated code contains parseDelimitedStringToArray call');
assert(code3.includes('parseBooleanToIntegerFlag'), 'generated code contains parseBooleanToIntegerFlag call');
assert(code3.includes('export function parseDelimitedStringToArray'), 'generated code exports parseDelimitedStringToArray');
assert(code3.includes('export function parseBooleanToIntegerFlag'), 'generated code exports parseBooleanToIntegerFlag');
console.log('   ✓ Generated adapter code successfully contains exported helpers and field conversions.');

console.log('\n--- ALL REGRESSION SUITE TESTS PASSED SUCCESSFULLY! ---');
