import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminPageTitleService {
  private titleSubject = new BehaviorSubject<string>('Dashboard');
  title$ = this.titleSubject.asObservable();

  setTitle(title: string) {
    this.titleSubject.next(title);
  }
}
