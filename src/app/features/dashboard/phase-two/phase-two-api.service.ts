import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  Budget,
  ChatHistoryPage,
  ChatSession,
  ChatStreamEvent,
  CostDashboard,
  DiseaseReport,
  DiseaseReportPage,
  Expense,
  ExpenseAttachment,
  ExpenseAttachmentType,
  ExpenseCategory,
  ExpensePage,
  PaymentMethod,
  PhaseApiResponse,
  TaskProposal,
} from './phase-two.models';

@Injectable({ providedIn: 'root' })
export class PhaseTwoApi {
  private readonly http = inject(HttpClient);

  public sessions(planId: number): Observable<ChatSession[]> {
    return this.get(`/api/export-plans/${planId}/chat/sessions`);
  }

  public createSession(planId: number): Observable<ChatSession> {
    return this.post(`/api/export-plans/${planId}/chat/sessions`, { title: 'محادثة الخطة مع عم خضر' });
  }

  public messages(planId: number, sessionId: number): Observable<ChatHistoryPage> {
    return this.get(`/api/export-plans/${planId}/chat/sessions/${sessionId}/messages?pageSize=100`);
  }

  public farmSessions(): Observable<ChatSession[]> {
    return this.get('/api/farm/chat/sessions');
  }

  public createFarmSession(title = 'محادثة مع عم خضر'): Observable<ChatSession> {
    return this.post('/api/farm/chat/sessions', { title });
  }

  public farmMessages(sessionId: number): Observable<ChatHistoryPage> {
    return this.get(`/api/farm/chat/sessions/${sessionId}/messages?pageSize=100`);
  }

  public streamFarmMessage(
    sessionId: number,
    content: string,
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<void> {
    return this.stream(`/api/farm/chat/sessions/${sessionId}/messages/stream`, content, onEvent);
  }

  public async streamMessage(
    planId: number,
    sessionId: number,
    content: string,
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<void> {
    return this.stream(
      `/api/export-plans/${planId}/chat/sessions/${sessionId}/messages/stream`,
      content,
      onEvent,
    );
  }

  private async stream(
    url: string,
    content: string,
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<void> {
    const token = localStorage.getItem('greenmind_access_token');
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content, idempotencyKey: crypto.randomUUID() }),
      },
    );
    if (!response.ok || !response.body) throw new Error('تعذر بدء المحادثة.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const result = await reader.read();
      buffer += decoder.decode(result.value, { stream: !result.done });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const dataLine = block.split('\n').find((line) => line.startsWith('data:'));
        if (dataLine) onEvent(JSON.parse(dataLine.slice(5).trim()) as ChatStreamEvent);
      }
      if (result.done) break;
    }
  }

  public proposal(proposalId: number): Observable<TaskProposal> {
    return this.get(`/api/task-change-proposals/${proposalId}`);
  }

  public applyProposal(proposalId: number): Observable<TaskProposal> {
    return this.post(`/api/task-change-proposals/${proposalId}/apply`, {});
  }

  public rejectProposal(proposalId: number): Observable<TaskProposal> {
    return this.post(`/api/task-change-proposals/${proposalId}/reject`, {});
  }

  public diseaseReports(planId: number): Observable<DiseaseReportPage> {
    return this.get(`/api/export-plans/${planId}/disease-reports?pageSize=50`);
  }

  public submitDisease(
    planId: number,
    observationDate: string,
    affectedArea: string,
    notes: string,
    images: File[],
  ): Observable<DiseaseReport> {
    const form = new FormData();
    form.append('ObservationDate', observationDate);
    if (affectedArea.trim()) form.append('AffectedArea', affectedArea.trim());
    if (notes.trim()) form.append('Notes', notes.trim());
    images.forEach((image) => form.append('Images', image, image.name));
    return this.post(`/api/export-plans/${planId}/disease-reports`, form);
  }

  public retryDisease(planId: number, reportId: number): Observable<DiseaseReport> {
    return this.post(`/api/export-plans/${planId}/disease-reports/${reportId}/retry`, {});
  }

  public categories(): Observable<ExpenseCategory[]> {
    return this.get('/api/expense-categories');
  }

  public budget(planId: number): Observable<Budget | null> {
    return this.get(`/api/export-plans/${planId}/budget`);
  }

  public saveBudget(
    planId: number,
    totalBudget: number | null,
    notes: string,
    lines: Array<{ expenseCategoryId: number; plannedAmount: number }>,
  ): Observable<Budget> {
    return this.put(`/api/export-plans/${planId}/budget`, {
      totalBudget,
      notes: notes.trim() || null,
      lines,
    });
  }

  public expenses(planId: number): Observable<ExpensePage> {
    return this.get(`/api/export-plans/${planId}/expenses?pageSize=100`);
  }

  public createExpense(planId: number, request: {
    expenseCategoryId: number;
    expenseDate: string;
    description: string;
    supplier: string | null;
    quantity: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    notes: string | null;
  }): Observable<Expense> {
    return this.post(`/api/export-plans/${planId}/expenses`, request);
  }

  public deleteExpense(planId: number, expenseId: number): Observable<void> {
    return this.http.delete<void>(`/api/export-plans/${planId}/expenses/${expenseId}`);
  }

  public costDashboard(planId: number): Observable<CostDashboard> {
    return this.get(`/api/export-plans/${planId}/cost-dashboard`);
  }

  public exportExpenses(planId: number): Observable<Blob> {
    return this.http.get(`/api/export-plans/${planId}/expenses/export.csv`, {
      responseType: 'blob',
    });
  }

  public uploadAttachment(
    planId: number,
    expenseId: number,
    attachmentType: ExpenseAttachmentType,
    file: File,
  ): Observable<ExpenseAttachment> {
    const form = new FormData();
    form.append('AttachmentType', attachmentType);
    form.append('File', file, file.name);
    return this.post(`/api/export-plans/${planId}/expenses/${expenseId}/attachments`, form);
  }

  public attachments(planId: number, expenseId: number): Observable<ExpenseAttachment[]> {
    return this.get(`/api/export-plans/${planId}/expenses/${expenseId}/attachments`);
  }

  public downloadAttachment(planId: number, expenseId: number, attachmentId: number): Observable<Blob> {
    return this.http.get(
      `/api/export-plans/${planId}/expenses/${expenseId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' },
    );
  }

  public deleteAttachment(planId: number, expenseId: number, attachmentId: number): Observable<void> {
    return this.http.delete<void>(
      `/api/export-plans/${planId}/expenses/${expenseId}/attachments/${attachmentId}`,
    );
  }

  private get<T>(url: string): Observable<T> {
    return this.http.get<PhaseApiResponse<T>>(url).pipe(map((response) => response.data));
  }

  private post<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<PhaseApiResponse<T>>(url, body).pipe(map((response) => response.data));
  }

  private put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<PhaseApiResponse<T>>(url, body).pipe(map((response) => response.data));
  }
}
