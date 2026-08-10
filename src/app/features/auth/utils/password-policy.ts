export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_MESSAGE =
  'استخدم 8 أحرف على الأقل، تتضمن حرفاً كبيراً وحرفاً صغيراً ورقماً ورمزاً.';

export type PasswordRequirement = {
  key: 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol';
  label: string;
  met: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      key: 'length',
      label: `${PASSWORD_MIN_LENGTH} أحرف على الأقل`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    { key: 'lowercase', label: 'حرف إنجليزي صغير', met: /[a-z]/.test(password) },
    { key: 'uppercase', label: 'حرف إنجليزي كبير', met: /[A-Z]/.test(password) },
    { key: 'number', label: 'رقم واحد', met: /\d/.test(password) },
    {
      key: 'symbol',
      label: 'رمز واحد مثل ! أو @',
      // Match a true non-letter/non-number character. An Arabic or other
      // Unicode letter must not be mistaken for the symbol Identity requires.
      met: /[^\p{L}\p{N}]/u.test(password),
    },
  ];
}

export function meetsPasswordPolicy(password: string): boolean {
  return passwordRequirements(password).every((requirement) => requirement.met);
}
