import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompaniesDocRoutingModule } from './companies-doc-routing.module';
import { CompaniesDocComponent } from './companies-doc.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ContactsModule } from 'src/app/modules/other/contacts/contacts.module';

@NgModule({
  declarations: [CompaniesDocComponent],
  imports: [
    CommonModule,
    CompaniesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    DragDropModule,
    TranslocoModule,
    ContactsModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class CompaniesDocModule { }
