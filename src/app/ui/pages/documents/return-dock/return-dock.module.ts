import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnDockRoutingModule } from './return-dock-routing.module';
import { ReturnDockComponent } from './return-dock.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsReturnDialogModule } from '../../../../modules/settings/settings-return-dialog/settings-return-dialog.module';
import { ReturnProductsTableModule } from 'src/app/modules/trade-modules/return-products-table/return-products-table.module';


@NgModule({
  declarations: [ReturnDockComponent],
  imports: [
    CommonModule,
    ReturnDockRoutingModule,
    SettingsReturnDialogModule,
    ReturnProductsTableModule,

    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class ReturnDockModule { }
