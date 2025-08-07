import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VipPaymentSuccessService {
  private data: any = null;

  setData(data: any) {
    this.data = data;
  }

  getData() {
    return this.data;
  }

  clear() {
    this.data = null;
  }
}
