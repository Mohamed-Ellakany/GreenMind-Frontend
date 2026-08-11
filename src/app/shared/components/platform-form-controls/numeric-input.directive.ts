import { Directive, ElementRef, HostListener, Provider, forwardRef, inject } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

const NUMERIC_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NumericInputDirective),
  multi: true,
};

const NUMERIC_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => NumericInputDirective),
  multi: true,
};

/**
 * Gives numeric fields normal text-input editing while keeping their Angular
 * model values numeric. Invalid characters are removed as the user types and
 * min/max/step constraints remain enforced.
 */
@Directive({
  selector: 'input[appNumericInput]',
  providers: [NUMERIC_VALUE_ACCESSOR, NUMERIC_VALIDATOR],
  host: {
    type: 'text',
    autocomplete: 'off',
    'data-platform-numeric': '',
  },
})
export class NumericInputDirective implements ControlValueAccessor, Validator {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private validatorChange: () => void = () => undefined;

  public constructor() {
    this.element.inputMode = this.usesWholeNumbersOnly() ? 'numeric' : 'decimal';
    this.element.pattern = '-?[0-9]+([.,][0-9]+)?';
  }

  @HostListener('focus')
  public selectExistingValue(): void {
    // Selecting after focus lets the first keystroke replace a default value
    // such as 0, while a second click still allows precise cursor placement.
    queueMicrotask(() => this.element.select());
  }

  @HostListener('input', ['$event'])
  public handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = this.sanitize(input.value);
    if (input.value !== sanitized) input.value = sanitized;

    const parsed = this.parse(sanitized);
    this.onChange(parsed);
    this.validatorChange();
  }

  @HostListener('blur')
  public handleBlur(): void {
    const parsed = this.parse(this.element.value);
    if (parsed === null && this.element.value) this.element.value = '';
    this.onChange(parsed);
    this.onTouched();
  }

  public writeValue(value: number | string | null | undefined): void {
    this.element.value = value === null || value === undefined || value === '' ? '' : String(value);
  }

  public registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(disabled: boolean): void {
    this.element.disabled = disabled;
  }

  public validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'number' || !Number.isFinite(value)) return { number: true };

    const min = this.constraint('min');
    const max = this.constraint('max');
    const step = this.constraint('step');

    if (min !== null && value < min) return { min: { min, actual: value } };
    if (max !== null && value > max) return { max: { max, actual: value } };
    if (step !== null && step > 0) {
      const base = min ?? 0;
      const quotient = (value - base) / step;
      if (Math.abs(quotient - Math.round(quotient)) > 1e-8) {
        return { step: { step, actual: value } };
      }
    }

    return null;
  }

  public registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }

  private sanitize(raw: string): string {
    const normalized = raw
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٫,]/g, '.');
    const allowNegative = (this.constraint('min') ?? -1) < 0;
    let result = '';
    let hasDecimal = false;

    for (const character of normalized) {
      if (/\d/.test(character)) {
        result += character;
      } else if (character === '.' && !hasDecimal && !this.usesWholeNumbersOnly()) {
        result += character;
        hasDecimal = true;
      } else if (character === '-' && allowNegative && result.length === 0) {
        result = '-';
      }
    }

    return result;
  }

  private parse(value: string): number | null {
    if (!value || value === '-' || value === '.' || value === '-.') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private usesWholeNumbersOnly(): boolean {
    const step = this.constraint('step');
    return step !== null && Number.isInteger(step);
  }

  private constraint(name: 'min' | 'max' | 'step'): number | null {
    const raw = this.element.getAttribute(name);
    if (raw === null || raw === '' || raw === 'any') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
