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

export type PasswordStrength = {
  score: number;
  percentage: number;
  label: string;
  colorClass: string;
  barColorClass: string;
};

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      percentage: 0,
      label: '',
      colorClass: 'text-[#7c8981]',
      barColorClass: 'bg-[#dde6df]',
    };
  }

  const reqs = passwordRequirements(password);
  const metCount = reqs.filter((r) => r.met).length;

  if (metCount <= 2) {
    return {
      score: metCount,
      percentage: Math.max(20, metCount * 20),
      label: 'ضعيفة',
      colorClass: 'text-[#dc2626]',
      barColorClass: 'bg-[#dc2626]',
    };
  }
  if (metCount <= 4) {
    return {
      score: metCount,
      percentage: metCount * 20,
      label: 'متوسطة',
      colorClass: 'text-[#d97706]',
      barColorClass: 'bg-[#d97706]',
    };
  }
  return {
    score: 5,
    percentage: 100,
    label: 'قوية جداً',
    colorClass: 'text-[#0f7a3d]',
    barColorClass: 'bg-[#0f7a3d]',
  };
}

