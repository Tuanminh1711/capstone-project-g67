import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  constructor(private fb: FormBuilder) {}

  createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
}
