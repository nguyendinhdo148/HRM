import test from 'node:test';
import assert from 'node:assert/strict';

import { calcMealAllowance } from './payroll.js';

test('meal allowance is capped at the monthly limit', () => {
  const defaultEmp = { salaryAndBenefits: { mealRate: 0 } };
  assert.equal(calcMealAllowance(defaultEmp, 29), 1800000);

  const customEmp = { salaryAndBenefits: { mealRate: 2000000 } };
  assert.equal(calcMealAllowance(customEmp, 29), 2000000);
  assert.equal(calcMealAllowance(customEmp, 10), 769231);
});
