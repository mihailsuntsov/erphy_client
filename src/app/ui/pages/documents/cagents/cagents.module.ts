import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CagentsRoutingModule } from './cagents-routing.module';
import { CagentsComponent } from './cagents.component';
import { CagentCategoriesSelectModule } from 'src/app/modules/trade-modules/cagent-categories-select/cagent-categories-select.module';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [CagentsComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    CagentsRoutingModule,
    CagentCategoriesSelectModule,
    MaterialModule,
    FormsModule,
    DragDropModule,
    TranslocoModule
  ]
})
export class CagentsModule { }
