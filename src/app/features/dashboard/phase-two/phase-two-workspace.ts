import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { PhaseTwoApi } from './phase-two-api.service';
import {
  Budget,
  ChatMessage,
  ChatSession,
  CostDashboard,
  DiseaseReport,
  Expense,
  ExpenseAttachment,
  ExpenseAttachmentType,
  ExpenseCategory,
  PaymentMethod,
  TaskProposal,
} from './phase-two.models';

type WorkspaceTab = 'chat' | 'disease' | 'costs';

@Component({
  selector: 'app-phase-two-workspace',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './phase-two-workspace.html',
  styleUrl: './phase-two-workspace.css',
})
export class PhaseTwoWorkspace {
  private readonly api = inject(PhaseTwoApi);
  private readonly coreApi = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  public readonly planId = Number(this.route.snapshot.paramMap.get('id'));
  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly activeTab = signal<WorkspaceTab>('chat');
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);

  public readonly chatSession = signal<ChatSession | null>(null);
  public readonly chatMessages = signal<ChatMessage[]>([]);
  public readonly chatSending = signal(false);
  public readonly selectedProposal = signal<TaskProposal | null>(null);
  public readonly proposalLoading = signal(false);
  public chatInput = '';

  public readonly diseaseReports = signal<DiseaseReport[]>([]);
  public readonly diseaseSubmitting = signal(false);
  public diseaseDate = new Date().toISOString().slice(0, 10);
  public diseaseArea = '';
  public diseaseNotes = '';
  public diseaseImages: File[] = [];

  public readonly categories = signal<ExpenseCategory[]>([]);
  public readonly budget = signal<Budget | null>(null);
  public readonly expenses = signal<Expense[]>([]);
  public readonly costs = signal<CostDashboard | null>(null);
  public readonly attachmentsByExpense = signal<Record<number, ExpenseAttachment[]>>({});
  public readonly financeSaving = signal(false);
  public budgetTotal: number | null = null;
  public budgetNotes = '';
  public budgetAllocations: Record<number, number | null> = {};
  public attachmentTypes: Record<number, ExpenseAttachmentType> = {};
  public expenseForm = this.emptyExpenseForm();

  public readonly paymentMethods: PaymentMethod[] = [
    'نقدي',
    'تحويل بنكي',
    'بطاقة',
    'محفظة إلكترونية',
  ];

  public constructor() {
    if (!Number.isInteger(this.planId) || this.planId <= 0) {
      this.loading.set(false);
      this.error.set('معرّف خطة التصدير غير صالح.');
      return;
    }

    this.coreApi.exportPlan(this.planId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plan) => this.plan.set(plan),
        error: () => this.error.set('تعذر تحميل خطة التصدير.'),
      });
    this.loadChat();
    this.loadFinancials();
    timer(0, 5000).pipe(
      switchMap(() => this.api.diseaseReports(this.planId)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (page) => this.diseaseReports.set(page.items),
      error: () => this.error.set('تعذر تحديث سجل صحة المحصول.'),
    });
  }

  public selectTab(tab: WorkspaceTab): void {
    this.activeTab.set(tab);
  }

  public async sendChat(): Promise<void> {
    const content = this.chatInput.trim();
    const session = this.chatSession();
    if (!content || !session || this.chatSending()) return;

    this.chatInput = '';
    this.chatSending.set(true);
    this.error.set(null);
    const temporaryUserId = -Date.now();
    const temporaryAssistantId = temporaryUserId - 1;
    this.chatMessages.update((messages) => [
      ...messages,
      {
        id: temporaryUserId,
        role: 'المستخدم',
        content,
        status: 'مكتمل',
        createdAt: new Date().toISOString(),
      },
      {
        id: temporaryAssistantId,
        role: 'المساعد',
        content: '',
        status: 'جارٍ الإرسال',
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      await this.api.streamMessage(this.planId, session.id, content, (event) => {
        this.chatMessages.update((messages) => messages.map((message) => {
          if (message.id !== temporaryAssistantId) return message;
          return {
            ...message,
            id: event.messageId ?? message.id,
            content: event.event === 'delta'
              ? message.content + (event.delta ?? '')
              : (event.content ?? message.content),
            status: event.status,
            taskChangeProposalId: event.taskChangeProposalId ?? message.taskChangeProposalId,
          };
        }));
      });
      this.refreshMessages();
    } catch {
      this.error.set('تعذر إكمال رد المستشار. يمكنك إعادة المحاولة.');
      this.chatMessages.update((messages) => messages.map((message) =>
        message.id === temporaryAssistantId
          ? { ...message, status: 'فشل', content: 'تعذر إنشاء الرد حاليًا.' }
          : message));
    } finally {
      this.chatSending.set(false);
    }
  }

  public openProposal(proposalId: number): void {
    this.proposalLoading.set(true);
    this.api.proposal(proposalId).pipe(
      finalize(() => this.proposalLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (proposal) => this.selectedProposal.set(proposal),
      error: () => this.error.set('تعذر تحميل اقتراح تعديل المهام.'),
    });
  }

  public reviewProposal(action: 'apply' | 'reject'): void {
    const proposal = this.selectedProposal();
    if (!proposal || this.proposalLoading()) return;
    this.proposalLoading.set(true);
    const request = action === 'apply'
      ? this.api.applyProposal(proposal.id)
      : this.api.rejectProposal(proposal.id);
    request.pipe(
      finalize(() => this.proposalLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updated) => {
        this.selectedProposal.set(updated);
        if (action === 'apply') {
          this.error.set(null);
          this.coreApi.dashboard(this.planId).pipe(
            takeUntilDestroyed(this.destroyRef),
          ).subscribe();
        }
      },
      error: (error) => this.error.set(
        error.error?.error?.message ?? 'تعذر مراجعة الاقتراح.'),
    });
  }

  public chooseDiseaseImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.diseaseImages = Array.from(input.files ?? []).slice(0, 5);
  }

  public submitDisease(): void {
    if (!this.diseaseImages.length || this.diseaseSubmitting()) {
      this.error.set('اختر صورة واحدة على الأقل للمحصول.');
      return;
    }
    this.diseaseSubmitting.set(true);
    this.error.set(null);
    this.api.submitDisease(
      this.planId,
      this.diseaseDate,
      this.diseaseArea,
      this.diseaseNotes,
      this.diseaseImages,
    ).pipe(
      finalize(() => this.diseaseSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (report) => {
        this.diseaseReports.update((items) => [report, ...items]);
        this.diseaseImages = [];
        this.diseaseArea = '';
        this.diseaseNotes = '';
      },
      error: (error) => this.error.set(
        error.error?.error?.message ?? 'تعذر إرسال الصور للتحليل.'),
    });
  }

  public retryDisease(reportId: number): void {
    this.api.retryDisease(this.planId, reportId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (report) => this.diseaseReports.update((items) =>
          items.map((item) => item.id === report.id ? report : item)),
        error: (error) => this.error.set(
          error.error?.error?.message ?? 'تعذرت إعادة التحليل.'),
      });
  }

  public saveBudget(): void {
    if (this.budgetTotal !== null && this.budgetTotal < 0) return;
    const lines = this.categories()
      .map((category) => ({
        expenseCategoryId: category.id,
        plannedAmount: Number(this.budgetAllocations[category.id] ?? 0),
      }))
      .filter((line) => line.plannedAmount > 0);
    const allocatedTotal = lines.reduce((total, line) => total + line.plannedAmount, 0);
    if (lines.some((line) => !Number.isFinite(line.plannedAmount)) ||
        (this.budgetTotal !== null && allocatedTotal > this.budgetTotal)) {
      this.error.set('إجمالي توزيع الفئات يجب ألا يتجاوز الميزانية الكلية.');
      return;
    }
    this.financeSaving.set(true);
    this.api.saveBudget(this.planId, this.budgetTotal, this.budgetNotes, lines)
      .pipe(
        finalize(() => this.financeSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (budget) => {
          this.budget.set(budget);
          this.loadFinancials();
        },
        error: (error) => this.error.set(
          error.error?.error?.message ?? 'تعذر حفظ الميزانية.'),
      });
  }

  public createExpense(): void {
    const form = this.expenseForm;
    if (!form.expenseCategoryId || !form.description.trim() || form.quantity <= 0 || form.unitPrice < 0) {
      this.error.set('راجع فئة المصروف والوصف والكمية والسعر.');
      return;
    }
    this.financeSaving.set(true);
    this.api.createExpense(this.planId, {
      ...form,
      description: form.description.trim(),
      supplier: form.supplier.trim() || null,
      notes: form.notes.trim() || null,
    }).pipe(
      finalize(() => this.financeSaving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.expenseForm = this.emptyExpenseForm(this.categories()[0]?.id ?? 0);
        this.loadFinancials();
      },
      error: (error) => this.error.set(
        error.error?.error?.message ?? 'تعذر حفظ المصروف.'),
    });
  }

  public deleteExpense(expenseId: number): void {
    if (!window.confirm('هل تريد حذف هذا المصروف؟')) return;
    this.api.deleteExpense(this.planId, expenseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadFinancials(),
        error: () => this.error.set('تعذر حذف المصروف.'),
      });
  }

  public uploadReceipt(expenseId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.api.uploadAttachment(
      this.planId,
      expenseId,
      this.attachmentTypes[expenseId] ?? 'إيصال',
      file,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          input.value = '';
          this.loadExpenseAttachments(expenseId);
        },
        error: (error) => this.error.set(
          error.error?.error?.message ?? 'تعذر رفع الإيصال.'),
      });
  }

  public attachmentsFor(expenseId: number): ExpenseAttachment[] {
    return this.attachmentsByExpense()[expenseId] ?? [];
  }

  public downloadAttachment(expenseId: number, attachment: ExpenseAttachment): void {
    this.api.downloadAttachment(this.planId, expenseId, attachment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = attachment.originalFileName;
          anchor.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.error.set('تعذر تنزيل المرفق.'),
      });
  }

  public deleteAttachment(expenseId: number, attachmentId: number): void {
    if (!window.confirm('هل تريد حذف هذا المرفق؟')) return;
    this.api.deleteAttachment(this.planId, expenseId, attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadExpenseAttachments(expenseId),
        error: () => this.error.set('تعذر حذف المرفق.'),
      });
  }

  public exportCsv(): void {
    this.api.exportExpenses(this.planId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `مصروفات-الخطة-${this.planId}.csv`;
          anchor.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.error.set('تعذر تصدير المصروفات.'),
      });
  }

  public formatMoney(value: number | null): string {
    if (value === null) return 'غير محددة';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 2,
    }).format(value);
  }

  public formatDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' })
      .format(new Date(`${value}T00:00:00`));
  }

  private loadChat(): void {
    this.api.sessions(this.planId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessions) => {
          const existing = sessions[0];
          if (existing) {
            this.chatSession.set(existing);
            this.refreshMessages();
          } else {
            this.api.createSession(this.planId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (session) => this.chatSession.set(session),
                error: () => this.error.set('تعذر إنشاء محادثة الخطة.'),
              });
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('تعذر تحميل محادثة الخطة.');
        },
      });
  }

  private refreshMessages(): void {
    const session = this.chatSession();
    if (!session) return;
    this.api.messages(this.planId, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (page) => this.chatMessages.set(page.items) });
  }

  private loadFinancials(): void {
    forkJoin({
      categories: this.api.categories(),
      budget: this.api.budget(this.planId),
      expenses: this.api.expenses(this.planId),
      costs: this.api.costDashboard(this.planId),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ categories, budget, expenses, costs }) => {
        this.categories.set(categories);
        this.budget.set(budget);
        this.expenses.set(expenses.items);
        this.costs.set(costs);
        this.budgetTotal = budget?.totalBudget ?? null;
        this.budgetNotes = budget?.notes ?? '';
        this.budgetAllocations = Object.fromEntries(
          categories.map((category) => [
            category.id,
            budget?.lines.find((line) => line.expenseCategoryId === category.id)?.plannedAmount ?? null,
          ]),
        );
        this.attachmentTypes = Object.fromEntries(
          expenses.items.map((expense) => [expense.id, this.attachmentTypes[expense.id] ?? 'إيصال']),
        );
        this.loadAllAttachments(expenses.items);
        if (!this.expenseForm.expenseCategoryId && categories[0]) {
          this.expenseForm.expenseCategoryId = categories[0].id;
        }
      },
      error: () => this.error.set('تعذر تحميل بيانات التكاليف.'),
    });
  }

  private loadAllAttachments(expenses: Expense[]): void {
    if (!expenses.length) {
      this.attachmentsByExpense.set({});
      return;
    }
    forkJoin(expenses.map((expense) => this.api.attachments(this.planId, expense.id)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => this.attachmentsByExpense.set(Object.fromEntries(
          expenses.map((expense, index) => [expense.id, groups[index]]),
        )),
        error: () => this.error.set('تعذر تحميل مرفقات المصروفات.'),
      });
  }

  private loadExpenseAttachments(expenseId: number): void {
    this.api.attachments(this.planId, expenseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (attachments) => this.attachmentsByExpense.update((current) => ({
          ...current,
          [expenseId]: attachments,
        })),
        error: () => this.error.set('تعذر تحديث مرفقات المصروف.'),
      });
  }

  private emptyExpenseForm(categoryId = 0): {
    expenseCategoryId: number;
    expenseDate: string;
    description: string;
    supplier: string;
    quantity: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    notes: string;
  } {
    return {
      expenseCategoryId: categoryId,
      expenseDate: new Date().toISOString().slice(0, 10),
      description: '',
      supplier: '',
      quantity: 1,
      unitPrice: 0,
      paymentMethod: 'نقدي',
      notes: '',
    };
  }
}
