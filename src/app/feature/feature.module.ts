import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Import các feature modules
import { AdminModule } from './admin/admin.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    AdminModule
  ],
  exports: [
    AdminModule
  ]
})
export class FeatureModule { }
