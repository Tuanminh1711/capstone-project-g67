import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordDialogComponent } from './forgot-password-dialog';

describe('ForgotPassword', () => {
  let component: ForgotPasswordDialogComponent;
  let fixture: ComponentFixture<ForgotPasswordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
