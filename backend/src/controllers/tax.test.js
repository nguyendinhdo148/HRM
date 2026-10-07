import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveInsuranceAdvance } from './tax.js';

test('keeps the custom insurance advance from the last tax record', () => {
  const value = resolveInsuranceAdvance({
    existingInsuranceAdvance: 750000,
    payrollInsuranceAdvance: 500000,
  });

  assert.equal(value, 750000);
});

test('falls back to payroll value when there is no saved tax value', () => {
  const value = resolveInsuranceAdvance({
    existingInsuranceAdvance: null,
    payrollInsuranceAdvance: 250000,
  });

  assert.equal(value, 250000);
});

test('uses default 500000 when no custom value exists anywhere', () => {
  const value = resolveInsuranceAdvance({
    existingInsuranceAdvance: undefined,
    payrollInsuranceAdvance: undefined,
  });

  assert.equal(value, 500000);
});
