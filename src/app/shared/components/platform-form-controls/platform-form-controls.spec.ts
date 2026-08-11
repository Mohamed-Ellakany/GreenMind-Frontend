import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DatePickerDirective } from './date-picker.directive';
import { NumericInputDirective } from './numeric-input.directive';

@Component({
  imports: [FormsModule, NumericInputDirective],
  template: `
    <input
      appNumericInput
      type="text"
      min="0"
      step="0.1"
      name="amount"
      [(ngModel)]="amount"
    />
  `,
})
class NumericHost {
  public amount: number | null = 0;
}

@Component({
  imports: [FormsModule, DatePickerDirective],
  template: `
    <input
      appDatePicker
      type="text"
      min="2026-08-01"
      name="plannedDate"
      [(ngModel)]="plannedDate"
    />
  `,
})
class DateHost {
  public plannedDate = '2026-08-11';
}

describe('platform form controls', () => {
  afterEach(() => document.querySelector('app-calendar-popover')?.remove());

  it('keeps a numeric model while filtering text input', async () => {
    const fixture = await createFixture(NumericHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '١٢x٫٣';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(input.value).toBe('12.3');
    expect(fixture.componentInstance.amount).toBe(12.3);
  });

  it('enforces numeric step constraints through Angular validation', async () => {
    const fixture = await createFixture(NumericHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '12.35';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.classList.contains('ng-invalid')).toBe(true);
  });

  it('opens the custom calendar and updates the bound ISO date', async () => {
    const fixture = await createFixture(DateHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const calendar = document.querySelector('app-calendar-popover');
    expect(calendar).not.toBeNull();
    const day = Array.from(calendar!.querySelectorAll<HTMLButtonElement>('.days button')).find(
      (button) => !button.classList.contains('outside') && button.textContent?.trim() === '12',
    );
    expect(day).toBeDefined();
    day!.click();
    await fixture.whenStable();

    expect(input.value).toBe('2026-08-12');
    expect(fixture.componentInstance.plannedDate).toBe('2026-08-12');
    expect(document.querySelector('app-calendar-popover')).toBeNull();
  });
});

async function createFixture<T>(component: new () => T): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}
