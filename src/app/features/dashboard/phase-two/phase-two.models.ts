export interface PhaseApiResponse<T> {
  succeeded: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

export interface ChatSession {
  id: number;
  title: string;
  scope: string;
  exportPlanId: number | null;
  updatedAtUtc: string | null;
}

export interface ChatAttachment {
  id: number;
  chatMessageId: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  url?: string;
}

export interface ChatMessage {
  id: number;
  role: string;
  content: string;
  status: string;
  createdAt: string;
  taskChangeProposalId?: number | null;
  attachments?: ChatAttachment[];
  localImageUrls?: string[];
}

export interface ChatHistoryPage {
  items: ChatMessage[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface ChatStreamEvent {
  event: 'delta' | 'completed' | 'failed';
  status: string;
  delta: string | null;
  messageId: number | null;
  content: string | null;
  retryable: boolean;
  taskChangeProposalId?: number | null;
}

export interface TaskProposal {
  id: number;
  exportPlanId: number;
  status: string;
  expiresAtUtc: string;
  reviewedAtUtc: string | null;
  items: TaskProposalItem[];
}

export interface TaskProposalItem {
  id: number;
  operation: string;
  farmTaskId: number | null;
  originalValues: TaskProposalValues | null;
  proposedValues: TaskProposalValues;
  reason: string;
  isIncluded: boolean;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TaskProposalValues {
  farmTaskId?: number;
  taskTypeId: number;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  plannedDate: string;
  status?: string;
  priority: TaskPriority;
}

export interface DiagnosisChecklistItem {
  key: string;
  label: string;
  isComplete: boolean;
  isRequired: boolean;
}

export interface DiagnosisReadiness {
  isReady: boolean;
  checklist: DiagnosisChecklistItem[];
  missingItems: string[];
}

export interface DiagnosisFacts {
  affectedPart: string | null;
  onset: string | null;
  spreadPattern: string | null;
  affectedExtent: string | null;
  conditions: string | null;
  previousTreatments: string | null;
}

export interface DiagnosisImage {
  id: number;
  messageId: number | null;
  originalFileName: string;
  contentType: string;
  fileSize: number;
}

export interface DiagnosisMessage {
  id: number;
  role: string;
  content: string;
  status: string;
  createdAt: string;
  images: DiagnosisImage[];
}

export interface DiagnosisSource {
  id: number;
  sourceName: string;
  sourceUrl: string;
  publisher: string | null;
  sectionReference: string | null;
  excerpt: string;
  retrievedAtUtc: string;
  isOfficialOrAcademic: boolean;
}

export interface DiagnosisSummary {
  id: number;
  exportPlanId: number;
  title: string;
  status: string;
  observationDate: string;
  suspectedDisease: string | null;
  confidencePercentage: number | null;
  severity: string | null;
  imageCount: number;
  finalizedWithOverride: boolean;
  knowledgeVerified: boolean;
  createdAt: string;
  closedAtUtc: string | null;
  completedAtUtc: string | null;
}

export interface DiagnosisDetail {
  summary: DiagnosisSummary;
  readiness: DiagnosisReadiness;
  facts: DiagnosisFacts;
  recommendedActions: string | null;
  advisoryWarning: string | null;
  exportImpact: string | null;
  failureMessage: string | null;
  knowledgeFailureMessage: string | null;
  treatmentProposalId: number | null;
  messages: DiagnosisMessage[];
  sources: DiagnosisSource[];
}

export interface DiagnosisTurn {
  userMessage: DiagnosisMessage;
  assistantMessage: DiagnosisMessage;
  readiness: DiagnosisReadiness;
  facts: DiagnosisFacts;
}

export interface DiseaseReport {
  id: number;
  observationDate: string;
  affectedArea: string | null;
  userNotes: string | null;
  status: string;
  suspectedDisease: string | null;
  confidencePercentage: number | null;
  severity: string | null;
  observedSymptoms: string | null;
  recommendedActions: string | null;
  exportImpact: string | null;
  advisoryWarning: string | null;
  failureMessage: string | null;
  images: Array<{ id: number; originalFileName: string; contentType: string; fileSize: number }>;
}

export interface DiseaseReportPage {
  items: DiseaseReport[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface BudgetLine {
  expenseCategoryId: number;
  expenseCategoryName: string;
  plannedAmount: number;
}

export interface Budget {
  id: number;
  exportPlanId: number;
  effectivePlannedBudget: number | null;
  totalBudget: number | null;
  notes: string | null;
  lines: BudgetLine[];
  updatedAtUtc: string;
}

export type PaymentMethod = 'نقدي' | 'تحويل بنكي' | 'بطاقة' | 'محفظة إلكترونية';

export interface Expense {
  id: number;
  exportPlanId: number;
  expenseCategory: ExpenseCategory;
  taskId: number | null;
  expenseDate: string;
  description: string;
  supplier: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  currency: 'EGP';
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAtUtc: string | null;
}

export interface ExpensePage {
  items: Expense[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export type ExpenseAttachmentType = 'فاتورة' | 'إيصال';

export interface ExpenseAttachment {
  id: number;
  expenseId: number;
  attachmentType: ExpenseAttachmentType;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface CostDashboard {
  plannedBudget: number | null;
  totalExpenses: number;
  remainingBudget: number | null;
  budgetConsumptionPercentage: number | null;
  budgetVariance: number | null;
  costPerFeddan: number | null;
  highestSpendingCategory: { expenseCategoryName: string; total: number } | null;
  expensesByCategory: Array<{ expenseCategoryId: number; expenseCategoryName: string; total: number }>;
  expensesByMonth: Array<{ period: string; total: number }>;
  expensesByIsoWeek: Array<{ period: string; total: number }>;
  latestExpenses: Expense[];
}

export interface ExportPlanCostComparisonItem {
  exportPlanId: number;
  exportPlanName: string;
  plannedBudget: number | null;
  totalExpenses: number;
  budgetVariance: number | null;
  costPerFeddan: number | null;
}
