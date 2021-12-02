import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReceiptsRoutingModule } from './receipts-routing.module';
import { ReceiptsComponent } from './receipts.component';

// import { SettingsReceiptsDialogModule } from '../../../../modules/settings/settings-receipts-dialog/settings-receipts-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [ReceiptsComponent],
  imports: [
    CommonModule,
    ReceiptsRoutingModule,
    // SettingsReceiptsDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class ReceiptsModule { }
