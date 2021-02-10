import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KkmComponent } from './kkm.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [KkmComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [KkmComponent],
})
export class KkmModule { }
