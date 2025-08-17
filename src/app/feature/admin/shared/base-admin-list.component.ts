import { Subscription } from 'rxjs';

export abstract class BaseAdminListComponent {
  loading = false;
  protected _errorMsg = '';
  protected _successMsg = '';

  get errorMsg() {
    return this._errorMsg;
  }
  get successMsg() {
    return this._successMsg;
  }
  protected sub = new Subscription();

  setLoading(val: boolean) {
    this.loading = val;
  }

  setError(msg: string) {
    this._errorMsg = msg;
    if (msg) setTimeout(() => (this._errorMsg = ''), 3000);
  }

  setSuccess(msg: string) {
    this._successMsg = msg;
    if (msg) setTimeout(() => (this._successMsg = ''), 3000);
  }

  // Call this in your component's ngOnDestroy if needed
  cleanupSubscriptions(): void {
    this.sub.unsubscribe();
  }
}
