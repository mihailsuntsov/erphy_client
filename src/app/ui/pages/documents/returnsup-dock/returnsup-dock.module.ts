import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnsupDockRoutingModule } from './returnsup-dock-routing.module';
import { ReturnsupDockComponent } from './returnsup-dock.component';
// import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsReturnsupDialogModule } from '../../../../modules/settings/settings-returnsup-dialog/settings-returnsup-dialog.module';
import { ReturnsupProductsTableModule } from 'src/app/modules/trade-modules/returnsup-products-table/returnsup-products-table.module';
// import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';

@NgModule({
  declarations: [ReturnsupDockComponent],
  imports: [
    CommonModule,
    ReturnsupDockRoutingModule,
    SettingsReturnsupDialogModule,
    ReturnsupProductsTableModule,
    // KkmModule,
    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [/*ValidationService*/],
})
export class ReturnsupDockModule { }
