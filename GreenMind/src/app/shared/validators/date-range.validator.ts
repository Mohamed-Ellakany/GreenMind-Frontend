import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateAfterValidator(
  startControlName: string,
  endControlName: string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startValue = control.get(startControlName)?.value;
    const endValue = control.get(endControlName)?.value;

    if (!startValue || !endValue) {
      return null;
    }

    const startDate = new Date(startValue).getTime();
    const endDate = new Date(endValue).getTime();

    if (Number.isNaN(startDate) || Number.isNaN(endDate)) {
      return null;
    }

    return endDate <= startDate
      ? { dateAfter: { startControlName, endControlName } }
      : null;
  };
}
