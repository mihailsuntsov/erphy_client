import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductSearchAndTableComponent } from './product-search-and-table.component';
import { ControlMessagesComponent } from './control-messages.component';
import { ValidationService } from './validation.service';

@NgModule({
  declarations: [ProductSearchAndTableComponent, ControlMessagesComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [ProductSearchAndTableComponent],
  providers: [ValidationService],
})
export class ProductSearchAndTableModule { }
