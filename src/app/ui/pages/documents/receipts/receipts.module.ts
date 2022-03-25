import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReceiptsRoutingModule } from './receipts-routing.module';
import { ReceiptsComponent } from './receipts.component';

// import { SettingsReceiptsDialogModule } from '../../../../modules/settings/settings-receipts-dialog/settings-receipts-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ReceiptsComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ReceiptsRoutingModule,
    // SettingsReceiptsDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class ReceiptsModule { }
