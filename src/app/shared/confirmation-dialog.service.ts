import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private dialogSubject = new BehaviorSubject<ConfirmationDialogData | null>(null);
  private resultSubject = new BehaviorSubject<boolean | null>(null);

  public dialogData$ = this.dialogSubject.asObservable();
  public result$ = this.resultSubject.asObservable();

  showDialog(data: ConfirmationDialogData): Observable<boolean> {
    this.dialogSubject.next(data);
    
    return new Observable(observer => {
      const subscription = this.result$.subscribe(result => {
        if (result !== null) {
          observer.next(result);
          observer.complete();
          this.resultSubject.next(null);
          subscription.unsubscribe();
        }
      });
    });
  }

  confirm(): void {
    this.dialogSubject.next(null);
    this.resultSubject.next(true);
  }

  cancel(): void {
    this.dialogSubject.next(null);
    this.resultSubject.next(false);
  }

  close(): void {
    this.dialogSubject.next(null);
    this.resultSubject.next(false);
  }
}
