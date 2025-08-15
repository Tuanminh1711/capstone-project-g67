import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Directive({
  selector: '[appExpertOnly]',
  standalone: true
})
export class ExpertOnlyDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input() set appExpertOnly(condition: boolean) {
    const userRole = this.authService.getCurrentUserRole();
    const isExpert = userRole === 'EXPERT';
    
    // Chỉ hiển thị nếu user là EXPERT và condition là true (hoặc không có condition)
    const shouldShow = isExpert && (condition !== false);
    
    if (shouldShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!shouldShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
