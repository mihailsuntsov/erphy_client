import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesdockRoutingModule } from './filesdock-routing.module';
import { FilesdockComponent } from './filesdock.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [FilesdockComponent],
  imports: [
    CommonModule,
    FilesdockRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class FilesdockModule { }
