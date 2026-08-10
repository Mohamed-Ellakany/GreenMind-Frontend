import { meetsPasswordPolicy, passwordRequirements } from './password-policy';

describe('password policy', () => {
  it('does not count an Arabic letter as a symbol', () => {
    const password = 'Abcdef1ع';

    expect(passwordRequirements(password).find((item) => item.key === 'symbol')?.met).toBe(false);
    expect(meetsPasswordPolicy(password)).toBe(false);
  });

  it('accepts a real symbol when the remaining requirements are met', () => {
    expect(meetsPasswordPolicy('Abcdef1!')).toBe(true);
  });
});
