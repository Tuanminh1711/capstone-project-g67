import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminPageTitleService {
  private titleSubject = new BehaviorSubject<string>('Dashboard');
  title$ = this.titleSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  setTitle(title: string) {
    // Sử dụng ngZone.runOutsideAngular để tránh ExpressionChangedAfterItHasBeenCheckedError
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.titleSubject.next(title);
        });
      }, 0);
    });
  }
}
