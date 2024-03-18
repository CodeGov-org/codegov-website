import { AbstractControl } from '@angular/forms';

export function formHasError(
  formControl: AbstractControl | null | undefined,
): boolean {
  return (
    ((formControl?.dirty || formControl?.touched) && formControl?.invalid) ??
    false
  );
}
