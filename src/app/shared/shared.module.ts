import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from '../pages/about/about.component';


@NgModule({
  declarations: [AboutComponent],
  imports: [
    CommonModule
  ],
  exports: [
    AboutComponent
  ]
})
export class SharedModule { }
