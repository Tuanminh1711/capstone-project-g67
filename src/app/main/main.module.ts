import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { TermsOfUseComponent } from './terms-of-use/terms-of-use.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    MatDialogModule,
    TermsOfUseComponent,
    PrivacyPolicyComponent
  ]
})
export class MainModule { }
