import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavigator } from './top-navigator/top-navigator';

@NgModule({
  imports: [
    CommonModule,
    TopNavigator
  ],
  exports: [TopNavigator]
})
export class SharedModule { }
