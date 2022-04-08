import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KkmComponent } from './kkm.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [KkmComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [KkmComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},
  ],
})
export class KkmModule { }
