import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoresDocRoutingModule } from './stores-doc-routing.module';
import { StoresDocComponent } from './stores-doc.component';
import { RentStoreOrderDialog } from 'src/app/ui/dialogs/rent-store-order-dialog.component';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { SharedModule } from '../../../../modules/shared.module'; // !! FOR USING PIPE "SanitizedHtmlPipe"

@NgModule({
  declarations: [StoresDocComponent,RentStoreOrderDialog],
  imports: [
    CommonModule,
    StoresDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule,
    SharedModule
  ],
  exports:[
    RentStoreOrderDialog,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class StoresDocModule { }
