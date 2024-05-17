import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductSearchAndTableByCustomersComponent } from './product-search-and-table-by-customers.component';
import { ControlMessagesComponent } from './control-messages.component';
import { ValidationService } from './validation.service';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';


@NgModule({
  declarations: [ProductSearchAndTableByCustomersComponent, ControlMessagesComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [ProductSearchAndTableByCustomersComponent],
  providers: [ValidationService,
    { provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},
  ],
})
export class ProductSearchAndTableByCustomersModule { }
