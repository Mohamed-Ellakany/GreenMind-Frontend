import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  Provider,
  createComponent,
  forwardRef,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

interface CalendarDay {
  date: string;
  day: number;
  outside: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
}

const DATE_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => DatePickerDirective),
  multi: true,
};

@Component({
  selector: 'app-calendar-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="calendar"
      role="dialog"
      aria-modal="false"
      aria-label="اختيار التاريخ"
      dir="rtl"
    >
      <header>
        <div>
          <span>اختر التاريخ</span>
          <strong aria-live="polite">{{ monthLabel() }}</strong>
        </div>
        <nav aria-label="التنقل بين الشهور">
          <button type="button" (click)="moveMonth(-1)" aria-label="الشهر السابق">‹</button>
          <button type="button" (click)="goToToday()" aria-label="العودة إلى الشهر الحالي">
            ●
          </button>
          <button type="button" (click)="moveMonth(1)" aria-label="الشهر التالي">›</button>
        </nav>
      </header>

      <div class="weekdays" aria-hidden="true">
        @for (weekday of weekdays; track weekday) {
          <span>{{ weekday }}</span>
        }
      </div>
      <div class="days" role="grid">
        @for (item of days(); track item.date) {
          <button
            type="button"
            role="gridcell"
            [class.outside]="item.outside"
            [class.today]="item.today"
            [class.selected]="item.selected"
            [disabled]="item.disabled"
            [attr.aria-label]="dayLabel(item.date)"
            [attr.aria-selected]="item.selected"
            (click)="choose(item.date)"
          >
            {{ item.day }}
          </button>
        }
      </div>

      <footer>
        <button type="button" class="clear" (click)="choose('')">مسح</button>
        <button type="button" class="today-action" (click)="choose(today)">اليوم</button>
      </footer>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      z-index: 250;
      display: block;
      width: min(22rem, calc(100vw - 1.5rem));
    }
    .calendar {
      overflow: hidden;
      border: 1px solid #d6e3da;
      border-radius: 1.25rem;
      background: #fff;
      color: #10231b;
      box-shadow:
        0 24px 70px rgb(16 35 27 / 0.22),
        0 3px 12px rgb(16 35 27 / 0.08);
      font-family: inherit;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.1rem 0.9rem;
      background: linear-gradient(145deg, #f1faf4, #fbfdfb);
      border-bottom: 1px solid #e5ece7;
    }
    header div {
      display: grid;
      gap: 0.1rem;
    }
    header span {
      color: #64766d;
      font-size: 0.7rem;
      font-weight: 800;
    }
    header strong {
      color: #0b6136;
      font-size: 1rem;
      font-weight: 900;
    }
    nav {
      display: flex;
      gap: 0.3rem;
      direction: ltr;
    }
    nav button {
      display: grid;
      width: 2.15rem;
      height: 2.15rem;
      place-items: center;
      border: 1px solid #dce6df;
      border-radius: 0.7rem;
      background: #fff;
      color: #0b6136;
      font-size: 1.35rem;
      line-height: 1;
    }
    nav button:nth-child(2) {
      color: #36a662;
      font-size: 0.55rem;
    }
    nav button:hover {
      border-color: #8fc59c;
      background: #eaf7ee;
    }
    .weekdays,
    .days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      direction: rtl;
    }
    .weekdays {
      padding: 0.8rem 0.8rem 0.25rem;
      color: #718078;
      font-size: 0.72rem;
      font-weight: 900;
      text-align: center;
    }
    .days {
      gap: 0.18rem;
      padding: 0.25rem 0.8rem 0.8rem;
    }
    .days button {
      position: relative;
      aspect-ratio: 1;
      min-width: 0;
      border: 0;
      border-radius: 0.72rem;
      background: transparent;
      color: #263b31;
      font-size: 0.85rem;
      font-weight: 750;
    }
    .days button:hover:not(:disabled) {
      background: #eaf7ee;
      color: #076f3c;
    }
    .days button.outside {
      color: #a8b3ac;
    }
    .days button.today {
      box-shadow: inset 0 0 0 1.5px #76b88a;
      color: #076f3c;
    }
    .days button.today::after {
      content: '';
      position: absolute;
      inset-inline-start: 50%;
      bottom: 0.23rem;
      width: 0.22rem;
      height: 0.22rem;
      translate: -50% 0;
      border-radius: 50%;
      background: currentColor;
    }
    .days button.selected {
      background: #087a42;
      color: #fff;
      box-shadow: 0 7px 16px rgb(8 122 66 / 0.28);
    }
    .days button.selected:hover {
      background: #055d31;
      color: #fff;
    }
    .days button:disabled {
      cursor: not-allowed;
      opacity: 0.28;
    }
    footer {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-top: 1px solid #e5ece7;
      background: #fbfcfb;
    }
    footer button {
      border: 0;
      border-radius: 0.65rem;
      background: transparent;
      padding: 0.45rem 0.7rem;
      font-size: 0.78rem;
      font-weight: 900;
    }
    footer .clear {
      color: #a33b35;
    }
    footer .today-action {
      color: #087a42;
    }
    footer button:hover {
      background: #eef5f0;
    }
    @media (max-width: 420px) {
      :host {
        inset-inline: 0.75rem !important;
        width: auto;
      }
    }
  `,
})
class CalendarPopoverComponent {
  public selected = '';
  public min = '';
  public max = '';
  public readonly today = toIsoDate(new Date());
  public readonly weekdays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  public visibleMonth = startOfMonth(parseIsoDate(this.selected) ?? new Date());
  public selectDate: (value: string) => void = () => undefined;

  public monthLabel(): string {
    return new Intl.DateTimeFormat('ar-EG', {
      calendar: 'gregory',
      month: 'long',
      year: 'numeric',
    }).format(this.visibleMonth);
  }

  public days(): CalendarDay[] {
    const first = startOfMonth(this.visibleMonth);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const iso = toIsoDate(date);
      return {
        date: iso,
        day: date.getDate(),
        outside: date.getMonth() !== first.getMonth(),
        today: iso === this.today,
        selected: iso === this.selected,
        disabled: (!!this.min && iso < this.min) || (!!this.max && iso > this.max),
      };
    });
  }

  public moveMonth(offset: number): void {
    this.visibleMonth = new Date(
      this.visibleMonth.getFullYear(),
      this.visibleMonth.getMonth() + offset,
      1,
    );
  }

  public goToToday(): void {
    this.visibleMonth = startOfMonth(new Date());
  }

  public choose(value: string): void {
    if (value && ((this.min && value < this.min) || (this.max && value > this.max))) return;
    this.selectDate(value);
  }

  public dayLabel(value: string): string {
    const date = parseIsoDate(value);
    return date
      ? new Intl.DateTimeFormat('ar-EG', { calendar: 'gregory', dateStyle: 'full' }).format(date)
      : value;
  }
}

@Directive({
  selector: 'input[appDatePicker]',
  providers: [DATE_VALIDATOR],
  host: {
    type: 'text',
    readonly: 'true',
    autocomplete: 'off',
    'aria-haspopup': 'dialog',
    'aria-expanded': 'false',
    'data-platform-date': '',
  },
})
export class DatePickerDirective implements Validator {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private calendarRef: ComponentRef<CalendarPopoverComponent> | null = null;
  private stopOutsideListener: (() => void) | null = null;
  private stopResizeListener: (() => void) | null = null;
  private stopScrollListener: (() => void) | null = null;
  private validatorChange: () => void = () => undefined;

  public constructor() {
    this.element.readOnly = true;
    this.element.placeholder ||= 'YYYY-MM-DD';
  }

  @HostListener('click', ['$event'])
  public handleClick(event: MouseEvent): void {
    event.preventDefault();
    this.open();
  }

  @HostListener('keydown', ['$event'])
  public handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
    }
  }

  public validate(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '');
    if (!value) return null;
    if (!parseIsoDate(value)) return { date: true };
    const min = this.element.min;
    const max = this.element.max;
    if (min && value < min) return { minDate: { min, actual: value } };
    if (max && value > max) return { maxDate: { max, actual: value } };
    return null;
  }

  public registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }

  private open(): void {
    if (this.element.disabled) return;
    if (this.calendarRef) {
      this.close();
      return;
    }

    const ref = createComponent(CalendarPopoverComponent, { environmentInjector: this.injector });
    ref.instance.selected = this.element.value;
    ref.instance.min = this.element.min;
    ref.instance.max = this.element.max;
    ref.instance.visibleMonth = startOfMonth(parseIsoDate(this.element.value) ?? new Date());
    ref.instance.selectDate = (value) => this.select(value);
    this.appRef.attachView(ref.hostView);
    this.document.body.appendChild(ref.location.nativeElement);
    this.calendarRef = ref;
    this.element.setAttribute('aria-expanded', 'true');
    this.position();
    ref.changeDetectorRef.detectChanges();

    // Delay the outside handler so the opening pointer event cannot close it.
    setTimeout(() => {
      this.stopOutsideListener = this.listen(this.document, 'pointerdown', (event) => {
        const target = event.target as Node | null;
        if (target && target !== this.element && !ref.location.nativeElement.contains(target))
          this.close();
      });
    });
    this.stopResizeListener = this.listen(window, 'resize', () => this.position());
    this.stopScrollListener = this.listen(this.document, 'scroll', () => this.position(), true);
  }

  private select(value: string): void {
    this.element.value = value;
    this.element.dispatchEvent(new Event('input', { bubbles: true }));
    this.element.dispatchEvent(new Event('change', { bubbles: true }));
    this.validatorChange();
    this.close();
    this.element.focus();
  }

  private position(): void {
    if (!this.calendarRef) return;
    const host = this.calendarRef.location.nativeElement as HTMLElement;
    const inputRect = this.element.getBoundingClientRect();
    const width = Math.min(352, window.innerWidth - 24);
    const estimatedHeight = 440;
    const below = window.innerHeight - inputRect.bottom;
    const top =
      below >= estimatedHeight || below >= inputRect.top
        ? inputRect.bottom + 8
        : Math.max(12, inputRect.top - estimatedHeight - 8);
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, inputRect.right - width));
    host.style.top = `${top}px`;
    host.style.left = `${left}px`;
  }

  private close(): void {
    const ref = this.calendarRef;
    if (!ref) return;
    this.stopOutsideListener?.();
    this.stopResizeListener?.();
    this.stopScrollListener?.();
    this.stopOutsideListener = null;
    this.stopResizeListener = null;
    this.stopScrollListener = null;
    this.appRef.detachView(ref.hostView);
    ref.destroy();
    this.calendarRef = null;
    this.element.setAttribute('aria-expanded', 'false');
  }

  private listen(
    target: EventTarget,
    eventName: string,
    handler: EventListener,
    capture = false,
  ): () => void {
    target.addEventListener(eventName, handler, capture);
    return () => target.removeEventListener(eventName, handler, capture);
  }
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
