import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CagentsRoutingModule } from './cagents-routing.module';
import { CagentsComponent } from './cagents.component';


@NgModule({
  declarations: [CagentsComponent],
  imports: [
    CommonModule,
    CagentsRoutingModule
  ]
})
export class CagentsModule { }
