import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentSelectComponent } from './payment-select.component';
import { SharedModule } from '../../modules/shared.module'; // !! FOR USING PIPE "SanitizedHtmlPipe"
import { MaterialModule } from '../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PaymentSelectComponent],
  imports: [
    CommonModule,
    SharedModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class PaymentSelectModule { }
