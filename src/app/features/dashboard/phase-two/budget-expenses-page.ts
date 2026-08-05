import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ApiError, ExportPlanDetails } from '@core/api/api.models';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import { PhaseTwoApi } from './phase-two-api.service';
import { Budget, CostDashboard, Expense, ExpenseAttachment, ExpenseAttachmentType, ExpenseCategory, PaymentMethod } from './phase-two.models';

interface ExpenseFormModel {
  expenseCategoryId: number;
  expenseDate: string;
  description: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  paymentMethod: PaymentMethod;
  notes: string;
}

type ExpenseFormField = keyof ExpenseFormModel | 'receipt';
type ExpenseFormErrors = Partial<Record<ExpenseFormField, string>>;

type FinanceTab = 'overview' | 'expenses' | 'budget' | 'receipts' | 'reports';
type ExpensePeriod = 'week' | 'month' | 'season';

@Component({
  selector: 'app-budget-expenses-page',
  imports: [FormsModule, RouterLink, PlantGrowthLoader],
  templateUrl: './budget-expenses-page.html',
  styleUrls: ['./plan-page.shared.css', './budget-expenses-page.css', './budget-expenses-insights.css', './budget-expenses-overlays.css', './budget-expenses-confirmation.css'],
})
export class BudgetExpensesPage {
  private readonly api = inject(PhaseTwoApi);
  private readonly coreApi = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private previewObjectUrl: string | null = null;
  private totalPulseTimer: ReturnType<typeof setTimeout> | null = null;

  public readonly planId = Number(this.route.snapshot.paramMap.get('id'));
  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly categories = signal<ExpenseCategory[]>([]);
  public readonly budget = signal<Budget | null>(null);
  public readonly expenses = signal<Expense[]>([]);
  public readonly costs = signal<CostDashboard | null>(null);
  public readonly attachments = signal<ExpenseAttachment[]>([]);
  public readonly selectedExpense = signal<Expense | null>(null);
  public readonly editingExpenseId = signal<number | null>(null);
  public readonly loading = signal(true);
  public readonly saving = signal(false);
  public readonly deletingId = signal<number | null>(null);
  public readonly filesLoading = signal(false);
  public readonly attachmentSaving = signal(false);
  public readonly attachmentPendingDelete = signal<ExpenseAttachment | null>(null);
  public readonly deletingAttachmentId = signal<number | null>(null);
  public readonly attachmentDeleteError = signal<string | null>(null);
  public readonly error = signal<string | null>(null);
  public readonly success = signal<string | null>(null);
  public readonly previewUrl = signal<string | SafeResourceUrl | null>(null);
  public readonly previewAttachment = signal<ExpenseAttachment | null>(null);
  public readonly search = signal('');
  public readonly categoryFilter = signal(0);
  public readonly receiptFilter = signal<'all' | 'with' | 'without'>('all');
  public readonly periodFilter = signal<ExpensePeriod>('season');
  public readonly attachmentsCount = signal<Record<number, number>>({});
  public readonly attachmentSearchIndex = signal<Record<number, string>>({});
  public readonly activeTab = signal<FinanceTab>('overview');
  public readonly expenseDrawerOpen = signal(false);
  public readonly budgetExpanded = signal(false);
  public readonly advancedFiltersOpen = signal(false);
  public readonly openRowMenuId = signal<number | null>(null);
  public readonly totalPulse = signal(false);
  public readonly reportFrom = signal('');
  public readonly reportTo = signal(new Date().toISOString().slice(0, 10));
  public readonly reportCategoryId = signal(0);
  public readonly exportingPdf = signal(false);
  public readonly exportingCsv = signal(false);
  public readonly pendingReceipt = signal<File | null>(null);
  public readonly expenseFormErrors = signal<ExpenseFormErrors>({});
  public readonly expenseFormMessage = signal<string | null>(null);

  public expenseForm: ExpenseFormModel = this.emptyExpenseForm();
  public budgetTotal: number | null = null;
  public budgetNotes = '';
  public budgetAllocations: Record<number, number | null> = {};
  public attachmentType: ExpenseAttachmentType = 'إيصال';
  public expenseAttachmentType: ExpenseAttachmentType = 'إيصال';
  public readonly paymentMethods: PaymentMethod[] = ['نقدي', 'تحويل بنكي', 'بطاقة', 'محفظة إلكترونية'];

  public readonly filteredExpenses = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('ar');
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    return this.expenses().filter((expense) => {
      const searchable = `${expense.id} ${expense.description} ${expense.supplier ?? ''} ${this.attachmentSearchIndex()[expense.id] ?? ''}`.toLocaleLowerCase('ar');
      const matchesQuery = !query || searchable.includes(query);
      const matchesCategory = !this.categoryFilter() || expense.expenseCategory.id === this.categoryFilter();
      const count = this.attachmentsCount()[expense.id] ?? 0;
      const matchesReceipt = this.receiptFilter() === 'all' || (this.receiptFilter() === 'with' ? count > 0 : count === 0);
      const expenseDate = new Date(`${expense.expenseDate}T00:00:00`);
      const matchesPeriod = this.periodFilter() === 'season'
        || (this.periodFilter() === 'week' && expenseDate >= weekStart)
        || (this.periodFilter() === 'month' && expenseDate.getFullYear() === now.getFullYear() && expenseDate.getMonth() === now.getMonth());
      return matchesQuery && matchesCategory && matchesReceipt && matchesPeriod;
    });
  });
  public readonly budgetProgress = computed(() => Math.min(100, Math.max(0, this.costs()?.budgetConsumptionPercentage ?? 0)));
  public readonly receiptExpenses = computed(() => this.expenses().filter((expense) => (this.attachmentsCount()[expense.id] ?? 0) > 0));
  public readonly missingReceiptExpenses = computed(() => this.expenses().filter((expense) => (this.attachmentsCount()[expense.id] ?? 0) === 0));
  public readonly receiptCoverage = computed(() => this.expenses().length ? Math.round(this.receiptExpenses().length / this.expenses().length * 100) : 0);
  public readonly totalAttachments = computed(() => Object.values(this.attachmentsCount()).reduce((total, count) => total + count, 0));
  public readonly allocatedBudget = computed(() => this.budget()?.lines.reduce((total, line) => total + line.plannedAmount, 0) ?? 0);
  public readonly latestActivity = computed(() => [...this.expenses()].sort((a, b) => (b.createdAt || b.expenseDate).localeCompare(a.createdAt || a.expenseDate)).slice(0, 4));
  public readonly todayExpenseCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.expenses().filter((expense) => expense.expenseDate === today).length;
  });
  public readonly categoryBars = computed(() => {
    const items = this.costs()?.expensesByCategory ?? [];
    const max = Math.max(...items.map((item) => item.total), 1);
    return items.map((item) => {
      const planned = this.budget()?.lines.find((line) => line.expenseCategoryId === item.expenseCategoryId)?.plannedAmount ?? null;
      return {
        ...item,
        width: Math.max(4, item.total / max * 100),
        planned,
        usage: planned && planned > 0 ? Math.round(item.total / planned * 100) : null,
      };
    }).sort((a, b) => b.total - a.total);
  });
  public readonly budgetWarnings = computed(() => this.categoryBars()
    .filter((item) => item.usage !== null && item.usage >= 80)
    .sort((a, b) => (b.usage ?? 0) - (a.usage ?? 0))
    .slice(0, 3));
  public readonly monthlyBars = computed(() => {
    const items = this.costs()?.expensesByMonth ?? [];
    const max = Math.max(...items.map((item) => item.total), 1);
    return items.map((item) => ({ ...item, width: Math.max(4, item.total / max * 100) }));
  });
  public readonly reportExpenses = computed(() => this.expenses().filter((expense) => {
    const from = this.reportFrom();
    const to = this.reportTo();
    return (!from || expense.expenseDate >= from)
      && (!to || expense.expenseDate <= to)
      && (!this.reportCategoryId() || expense.expenseCategory.id === this.reportCategoryId());
  }));
  public readonly reportTotal = computed(() => this.reportExpenses().reduce((total, expense) => total + expense.amount, 0));

  public constructor() {
    this.destroyRef.onDestroy(() => {
      this.revokePreview();
      if (this.totalPulseTimer) clearTimeout(this.totalPulseTimer);
    });
    if (!Number.isInteger(this.planId) || this.planId <= 0) {
      this.loading.set(false);
      this.error.set('معرّف خطة التصدير غير صالح.');
      return;
    }
    this.load();
  }

  public saveExpense(): void {
    const form = this.expenseForm;
    const validationErrors = this.validateExpenseForm(form);
    this.expenseFormErrors.set(validationErrors);
    if (Object.keys(validationErrors).length) {
      this.expenseFormMessage.set('راجع الحقول الموضحة بالأسفل ثم حاول مرة أخرى.');
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector<HTMLElement>('.expense-form .invalid');
        firstInvalid?.focus();
      });
      return;
    }
    const request = {
      ...form,
      description: form.description.trim(),
      supplier: form.supplier.trim() || null,
      notes: form.notes.trim() || null,
    };
    const editingId = this.editingExpenseId();
    this.saving.set(true);
    this.expenseFormMessage.set(null);
    const operation = editingId
      ? this.api.updateExpense(this.planId, editingId, request)
      : this.api.createExpense(this.planId, request);
    const receipt = this.pendingReceipt();
    operation.pipe(
      switchMap((expense) => receipt
        ? this.api.uploadAttachment(this.planId, expense.id, this.expenseAttachmentType, receipt).pipe(
            map(() => ({ receiptUploaded: true, receiptUploadFailed: false })),
            catchError(() => of({ receiptUploaded: false, receiptUploadFailed: true })),
          )
        : of({ receiptUploaded: false, receiptUploadFailed: false })),
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ receiptUploaded, receiptUploadFailed }) => {
        const action = editingId ? 'تم تحديث المصروف بنجاح' : 'تم تسجيل المصروف بنجاح';
        if (receiptUploadFailed) {
          this.success.set(null);
          this.error.set(`${action}، لكن تعذر رفع الإيصال. يمكنك إضافته من تبويب الإيصالات.`);
        } else {
          this.success.set(receiptUploaded ? `${action} ورفع الإيصال.` : `${action}.`);
        }
        this.cancelEdit();
        this.expenseDrawerOpen.set(false);
        this.refreshFinancials();
      },
      error: (error: HttpErrorResponse) => this.handleExpenseSaveError(error, editingId !== null),
    });
  }

  public editExpense(expense: Expense): void {
    this.editingExpenseId.set(expense.id);
    this.expenseForm = {
      expenseCategoryId: expense.expenseCategory.id,
      expenseDate: expense.expenseDate,
      description: expense.description,
      supplier: expense.supplier ?? '',
      quantity: expense.quantity,
      unitPrice: expense.unitPrice,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes ?? '',
    };
    this.openRowMenuId.set(null);
    this.expenseDrawerOpen.set(true);
  }

  public cancelEdit(): void {
    this.editingExpenseId.set(null);
    this.expenseForm = this.emptyExpenseForm(this.categories()[0]?.id ?? 0);
    this.pendingReceipt.set(null);
    this.expenseAttachmentType = 'إيصال';
    this.expenseFormErrors.set({});
    this.expenseFormMessage.set(null);
  }

  public openExpenseDrawer(): void {
    this.cancelEdit();
    this.error.set(null);
    this.expenseDrawerOpen.set(true);
  }

  public closeExpenseDrawer(): void {
    if (this.saving()) return;
    this.expenseDrawerOpen.set(false);
    this.cancelEdit();
  }

  public selectTab(tab: FinanceTab): void {
    this.activeTab.set(tab);
    this.openRowMenuId.set(null);
  }

  public openBudgetSetup(): void {
    this.activeTab.set('budget');
    this.budgetExpanded.set(true);
  }

  public setPeriod(period: ExpensePeriod): void { this.periodFilter.set(period); }
  public toggleAdvancedFilters(): void { this.advancedFiltersOpen.update((value) => !value); }
  public toggleBudgetSetup(): void { this.budgetExpanded.update((value) => !value); }
  public toggleRowMenu(expenseId: number): void { this.openRowMenuId.update((current) => current === expenseId ? null : expenseId); }
  public expenseTotal(): number { return Number(this.expenseForm.quantity || 0) * Number(this.expenseForm.unitPrice || 0); }

  public pulseExpenseTotal(): void {
    this.totalPulse.set(false);
    if (this.totalPulseTimer) clearTimeout(this.totalPulseTimer);
    this.totalPulseTimer = setTimeout(() => {
      this.totalPulse.set(true);
      this.totalPulseTimer = setTimeout(() => this.totalPulse.set(false), 260);
    });
  }

  public clearExpenseFieldError(field: ExpenseFormField): void {
    this.expenseFormErrors.update((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (!Object.keys(this.expenseFormErrors()).length) this.expenseFormMessage.set(null);
  }

  public selectExpenseReceipt(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      input.value = '';
      this.pendingReceipt.set(null);
      this.expenseFormErrors.update((current) => ({
        ...current,
        receipt: 'الإيصال يجب أن يكون PDF أو JPG أو PNG وبحجم لا يتجاوز 10 ميجابايت.',
      }));
      return;
    }
    this.pendingReceipt.set(file);
    this.clearExpenseFieldError('receipt');
  }

  public removePendingReceipt(): void {
    this.pendingReceipt.set(null);
    this.clearExpenseFieldError('receipt');
  }

  @HostListener('document:keydown.escape')
  public closeTransientUi(): void {
    if (this.attachmentPendingDelete()) this.cancelAttachmentDelete();
    else if (this.selectedExpense()) this.closeFiles();
    else if (this.expenseDrawerOpen()) this.closeExpenseDrawer();
    else this.openRowMenuId.set(null);
  }

  public deleteExpense(expense: Expense): void {
    if (!window.confirm(`هل تريد حذف المصروف «${expense.description}» وكل ملفاته؟`)) return;
    this.deletingId.set(expense.id);
    this.api.deleteExpense(this.planId, expense.id).pipe(finalize(() => this.deletingId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.success.set('تم حذف المصروف.'); this.refreshFinancials(); },
      error: () => this.error.set('تعذر حذف المصروف.'),
    });
  }

  public saveBudget(): void {
    const lines = this.categories().map((category) => ({ expenseCategoryId: category.id, plannedAmount: Number(this.budgetAllocations[category.id] ?? 0) })).filter((line) => line.plannedAmount > 0);
    const allocated = lines.reduce((total, line) => total + line.plannedAmount, 0);
    if (this.budgetTotal !== null && (this.budgetTotal < 0 || allocated > this.budgetTotal)) {
      this.error.set('إجمالي توزيع الفئات يجب ألا يتجاوز الميزانية الكلية.');
      return;
    }
    this.saving.set(true);
    this.api.saveBudget(this.planId, this.budgetTotal, this.budgetNotes, lines).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.success.set('تم تحديث الميزانية.'); this.refreshFinancials(); },
      error: (error) => this.error.set(error.error?.error?.message ?? 'تعذر حفظ الميزانية.'),
    });
  }

  public openFiles(expense: Expense): void {
    this.selectedExpense.set(expense);
    this.attachments.set([]);
    this.attachmentPendingDelete.set(null);
    this.attachmentDeleteError.set(null);
    this.closePreview();
    this.loadAttachments(expense.id);
  }

  public closeFiles(): void {
    if (this.deletingAttachmentId() !== null) return;
    this.attachmentPendingDelete.set(null);
    this.attachmentDeleteError.set(null);
    this.selectedExpense.set(null);
    this.attachments.set([]);
    this.closePreview();
  }

  public uploadAttachment(event: Event): void {
    const expense = this.selectedExpense();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!expense || !file) return;
    this.attachmentSaving.set(true);
    this.api.uploadAttachment(this.planId, expense.id, this.attachmentType, file).pipe(finalize(() => this.attachmentSaving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { input.value = ''; this.success.set('تم رفع الملف.'); this.loadAttachments(expense.id); },
      error: (error) => this.error.set(error.error?.error?.message ?? 'تعذر رفع الملف.'),
    });
  }

  public preview(expenseId: number, attachment: ExpenseAttachment): void {
    this.api.downloadAttachment(this.planId, expenseId, attachment.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        this.revokePreview();
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl.set(this.isImage(attachment)
          ? this.previewObjectUrl
          : this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl));
        this.previewAttachment.set(attachment);
      },
      error: () => this.error.set('تعذر فتح الملف.'),
    });
  }

  public download(expenseId: number, attachment: ExpenseAttachment): void {
    this.api.downloadAttachment(this.planId, expenseId, attachment.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = attachment.originalFileName; anchor.click(); URL.revokeObjectURL(url); },
      error: () => this.error.set('تعذر تنزيل الملف.'),
    });
  }

  public requestAttachmentDelete(attachment: ExpenseAttachment): void {
    this.attachmentPendingDelete.set(attachment);
    this.attachmentDeleteError.set(null);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.attachment-delete-modal .cancel-delete')?.focus();
    });
  }

  public deleteAttachment(_expenseId: number, attachment: ExpenseAttachment): void {
    this.requestAttachmentDelete(attachment);
  }

  public cancelAttachmentDelete(): void {
    if (this.deletingAttachmentId() !== null) return;
    const attachmentId = this.attachmentPendingDelete()?.id;
    this.attachmentPendingDelete.set(null);
    this.attachmentDeleteError.set(null);
    if (attachmentId) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-attachment-delete-id="${attachmentId}"]`)?.focus();
      });
    }
  }

  public confirmAttachmentDelete(): void {
    const expense = this.selectedExpense();
    const attachment = this.attachmentPendingDelete();
    if (!expense || !attachment || this.deletingAttachmentId() !== null) return;

    this.deletingAttachmentId.set(attachment.id);
    this.attachmentDeleteError.set(null);
    this.api.deleteAttachment(this.planId, expense.id, attachment.id).pipe(
      finalize(() => this.deletingAttachmentId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        if (this.previewAttachment()?.id === attachment.id) this.closePreview();
        this.attachments.update((items) => items.filter((item) => item.id !== attachment.id));
        this.attachmentsCount.update((current) => ({
          ...current,
          [expense.id]: Math.max(0, (current[expense.id] ?? 1) - 1),
        }));
        this.attachmentSearchIndex.update((current) => {
          const next = { ...current };
          next[expense.id] = this.attachments().map((item) => item.originalFileName).join(' ');
          return next;
        });
        this.attachmentPendingDelete.set(null);
        this.success.set(`تم حذف ${attachment.attachmentType} بنجاح.`);
      },
      error: (error: HttpErrorResponse) => {
        this.attachmentDeleteError.set(
          error.error?.error?.message ?? 'تعذر حذف الملف الآن. تأكد من الاتصال ثم حاول مرة أخرى.',
        );
      },
    });
  }

  public closePreview(): void { this.revokePreview(); this.previewUrl.set(null); this.previewAttachment.set(null); }
  public isImage(attachment: ExpenseAttachment): boolean { return attachment.contentType.startsWith('image/'); }
  public formatMoney(value: number | null): string { return value === null ? 'غير محددة' : new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value); }
  public formatDate(value: string): string { return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', { dateStyle: 'medium' }); }
  public formatFileSize(bytes: number): string { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} ك.ب` : `${(bytes / 1024 / 1024).toFixed(1)} م.ب`; }
  public formatRelativeDate(value: string): string {
    const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days <= 0) return 'اليوم';
    if (days === 1) return 'أمس';
    return `منذ ${new Intl.NumberFormat('ar-EG').format(days)} أيام`;
  }
  public formatPeriod(value: string): string {
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return value;
    return new Date(year, month - 1, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }
  public exportCsv(): void {
    this.exportingCsv.set(true);
    this.error.set(null);
    this.api.exportExpenses(this.planId).pipe(
      finalize(() => this.exportingCsv.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (blob) => this.downloadBlob(blob, `plan-${this.planId}-expenses.csv`),
      error: (error) => this.error.set(error.error?.error?.message ?? error.error?.message ?? 'تعذر تصدير ملف CSV.'),
    });
  }

  public exportPdfReport(): void {
    const from = this.reportFrom();
    const to = this.reportTo();
    if (from && to && from > to) {
      this.error.set('تاريخ البداية يجب أن يسبق تاريخ النهاية.');
      return;
    }

    const params: Record<string, string> = {
      format: 'pdf',
      sections: 'spending',
      exportPlanId: this.planId.toString(),
    };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (this.reportCategoryId()) params['expenseCategoryId'] = this.reportCategoryId().toString();

    this.exportingPdf.set(true);
    this.error.set(null);
    this.coreApi.downloadReport(params).pipe(
      finalize(() => this.exportingPdf.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `greenmind-financial-report-plan-${this.planId}.pdf`);
        this.success.set('تم تجهيز تقرير PDF وتنزيله بنجاح.');
      },
      error: (error) => this.error.set(error.error?.error?.message ?? error.error?.message ?? 'تعذر إنشاء تقرير PDF.'),
    });
  }

  private load(): void {
    forkJoin({ plan: this.coreApi.exportPlan(this.planId), categories: this.api.categories(), budget: this.api.budget(this.planId), expenses: this.api.expenses(this.planId), costs: this.api.costDashboard(this.planId) }).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ plan, categories, budget, expenses, costs }) => {
        this.plan.set(plan);
        this.reportFrom.set(plan.plantingDate);
        this.applyFinancialData(categories, budget, expenses.items, costs);
      },
      error: () => this.error.set('تعذر تحميل بيانات الميزانية والمصروفات.'),
    });
  }

  private refreshFinancials(): void {
    forkJoin({ budget: this.api.budget(this.planId), expenses: this.api.expenses(this.planId), costs: this.api.costDashboard(this.planId) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ budget, expenses, costs }) => this.applyFinancialData(this.categories(), budget, expenses.items, costs),
      error: () => this.error.set('تعذر تحديث بيانات التكاليف.'),
    });
  }

  private applyFinancialData(categories: ExpenseCategory[], budget: Budget | null, expenses: Expense[], costs: CostDashboard): void {
    this.categories.set(categories); this.budget.set(budget); this.expenses.set(expenses); this.costs.set(costs);
    this.budgetTotal = budget?.totalBudget ?? null; this.budgetNotes = budget?.notes ?? '';
    this.budgetAllocations = Object.fromEntries(categories.map((category) => [category.id, budget?.lines.find((line) => line.expenseCategoryId === category.id)?.plannedAmount ?? null]));
    if (!this.expenseForm.expenseCategoryId && categories[0]) this.expenseForm.expenseCategoryId = categories[0].id;
    this.loadAttachmentCounts(expenses);
  }

  private loadAttachmentCounts(expenses: Expense[]): void {
    if (!expenses.length) { this.attachmentsCount.set({}); this.attachmentSearchIndex.set({}); return; }
    forkJoin(expenses.map((expense) => this.api.attachments(this.planId, expense.id))).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (groups) => {
        this.attachmentsCount.set(Object.fromEntries(expenses.map((expense, index) => [expense.id, groups[index].length])));
        this.attachmentSearchIndex.set(Object.fromEntries(expenses.map((expense, index) => [expense.id, groups[index].map((file) => `${file.id} ${file.originalFileName}`).join(' ')])));
      },
    });
  }

  private loadAttachments(expenseId: number): void {
    this.filesLoading.set(true);
    this.api.attachments(this.planId, expenseId).pipe(finalize(() => this.filesLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.attachments.set(items); this.attachmentsCount.update((current) => ({ ...current, [expenseId]: items.length })); },
      error: () => this.error.set('تعذر تحميل الملفات المرتبطة بالمصروف.'),
    });
  }

  private emptyExpenseForm(categoryId = 0): ExpenseFormModel { return { expenseCategoryId: categoryId, expenseDate: new Date().toISOString().slice(0, 10), description: '', supplier: '', quantity: 1, unitPrice: 0, paymentMethod: 'نقدي', notes: '' }; }
  private validateExpenseForm(form: ExpenseFormModel): ExpenseFormErrors {
    const errors: ExpenseFormErrors = {};
    if (!form.expenseCategoryId) errors.expenseCategoryId = 'اختر فئة المصروف.';
    if (!form.description.trim()) errors.description = 'اكتب وصف المصروف.';
    else if (form.description.trim().length > 500) errors.description = 'الوصف لا يمكن أن يتجاوز 500 حرف.';
    if (!form.expenseDate) errors.expenseDate = 'حدد تاريخ المصروف.';
    if (!this.paymentMethods.includes(form.paymentMethod)) errors.paymentMethod = 'اختر طريقة دفع صحيحة.';
    if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0) errors.quantity = 'الكمية يجب أن تكون أكبر من صفر.';
    if (!Number.isFinite(Number(form.unitPrice)) || Number(form.unitPrice) < 0) errors.unitPrice = 'سعر الوحدة يجب أن يكون صفرًا أو أكثر.';
    if (form.supplier.length > 300) errors.supplier = 'اسم المورد لا يمكن أن يتجاوز 300 حرف.';
    if (form.notes.length > 1000) errors.notes = 'الملاحظات لا يمكن أن تتجاوز 1000 حرف.';
    return errors;
  }
  private handleExpenseSaveError(error: HttpErrorResponse, editing: boolean): void {
    const payload = error.error as { error?: ApiError; traceId?: string } | null;
    const apiError = payload?.error;
    const serverFields = apiError?.validationErrors;
    if (serverFields) {
      const fieldMap: Record<string, ExpenseFormField> = {
        expensecategoryid: 'expenseCategoryId',
        expensedate: 'expenseDate',
        description: 'description',
        supplier: 'supplier',
        quantity: 'quantity',
        unitprice: 'unitPrice',
        paymentmethod: 'paymentMethod',
        notes: 'notes',
      };
      const mapped: ExpenseFormErrors = {};
      for (const [serverField, messages] of Object.entries(serverFields)) {
        const field = fieldMap[serverField.replace(/^request\./i, '').toLowerCase()];
        if (field && messages.length) {
          mapped[field] = /[\u0600-\u06FF]/.test(messages[0])
            ? messages[0]
            : this.expenseFieldErrorMessage(field);
        }
      }
      this.expenseFormErrors.update((current) => ({ ...current, ...mapped }));
    }

    let message: string;
    if (error.status === 0) {
      message = 'تعذر الاتصال بالخادم. تأكد أن الخدمة تعمل ثم حاول مرة أخرى.';
    } else if (error.status === 401) {
      message = 'انتهت جلسة الدخول. سجّل الدخول مرة أخرى لحفظ المصروف.';
    } else if (error.status === 403) {
      message = 'ليس لديك صلاحية لتعديل هذا المصروف.';
    } else if (error.status === 404) {
      message = editing
        ? 'المصروف لم يعد موجودًا أو تم حذفه. حدّث الصفحة ثم حاول مرة أخرى.'
        : 'خطة التصدير غير موجودة أو لم تعد متاحة.';
    } else if (error.status === 409) {
      message = 'تغيّرت بيانات المصروف منذ فتحه. حدّث الصفحة وراجع أحدث نسخة.';
    } else if (error.status === 400) {
      const serverMessage = apiError?.message;
      message = serverMessage && /[\u0600-\u06FF]/.test(serverMessage)
        ? serverMessage
        : 'بعض بيانات المصروف غير مقبولة. راجع الحقول الموضحة ثم حاول مرة أخرى.';
    } else if (error.status >= 500) {
      message = editing
        ? 'حدث خطأ أثناء تحديث المصروف ولم تُحفظ التعديلات. حاول مرة أخرى بعد قليل.'
        : 'حدث خطأ أثناء تسجيل المصروف ولم يتم الحفظ. حاول مرة أخرى بعد قليل.';
    } else {
      message = editing ? 'تعذر تحديث المصروف حاليًا.' : 'تعذر تسجيل المصروف حاليًا.';
    }
    this.expenseFormMessage.set(message);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.expense-form .invalid')?.focus());
  }
  private expenseFieldErrorMessage(field: ExpenseFormField): string {
    const messages: Record<ExpenseFormField, string> = {
      expenseCategoryId: 'فئة المصروف المختارة غير متاحة لهذه الخطة.',
      expenseDate: 'اختر تاريخًا صحيحًا للمصروف.',
      description: 'اكتب وصفًا واضحًا للمصروف بحد أقصى 500 حرف.',
      supplier: 'اسم المورد لا يمكن أن يتجاوز 300 حرف.',
      quantity: 'الكمية يجب أن تكون رقمًا أكبر من صفر، ويمكن أن تحتوي على كسور.',
      unitPrice: 'سعر الوحدة يجب أن يكون رقمًا يساوي صفرًا أو أكثر.',
      paymentMethod: 'اختر طريقة دفع صحيحة من القائمة.',
      notes: 'الملاحظات لا يمكن أن تتجاوز 1000 حرف.',
      receipt: 'اختر إيصالًا بصيغة PDF أو JPG أو PNG وبحجم لا يتجاوز 10 ميجابايت.',
    };
    return messages[field];
  }
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
  private revokePreview(): void { if (this.previewObjectUrl) { URL.revokeObjectURL(this.previewObjectUrl); this.previewObjectUrl = null; } }
}
