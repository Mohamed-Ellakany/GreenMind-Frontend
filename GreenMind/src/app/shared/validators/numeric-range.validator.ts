import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function rangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isNaN(numericValue) || numericValue < min || numericValue > max
      ? { numericRange: { min, max, actual: value } }
      : null;
  };
}
