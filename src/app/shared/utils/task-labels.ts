const taskTypeLabels: Record<string, string> = {
  Irrigation: 'الري',
  Fertilization: 'التسميد',
  PestControl: 'مكافحة الآفات',
  Pruning: 'التقليم',
  SoilTest: 'تحليل التربة',
  Harvest: 'الحصاد',
  ExportPrep: 'تجهيز التصدير',
  QualityCheck: 'فحص الجودة',
  Other: 'أخرى',
};

const taskStatusLabels: Record<string, string> = {
  Pending: 'قيد الانتظار',
  InProgress: 'قيد التنفيذ',
  Completed: 'مكتملة',
  Cancelled: 'ملغاة',
  Postponed: 'مؤجلة',
  Skipped: 'تم تجاوزها',
};

const taskPriorityLabels: Record<string, string> = {
  Low: 'منخفضة',
  Medium: 'متوسطة',
  High: 'عالية',
  Critical: 'حرجة',
};

export function taskTypeLabel(value: string): string {
  return taskTypeLabels[value] ?? value;
}

export function taskStatusLabel(value: string): string {
  return taskStatusLabels[value] ?? value;
}

export function taskPriorityLabel(value: string): string {
  return taskPriorityLabels[value] ?? value;
}
