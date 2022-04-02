import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MovingDocRoutingModule } from './moving-doc-routing.module';
import { MovingDocComponent } from './moving-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsMovingDialogModule } from '../../../../modules/settings/settings-moving-dialog/settings-moving-dialog.module';
import { MovingProductsTableModule } from 'src/app/modules/trade-modules/moving-products-table/moving-products-table.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [MovingDocComponent],
  imports: [
    CommonModule,
    MovingDocRoutingModule,
    SettingsMovingDialogModule,
    MovingProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class MovingDocModule { }
