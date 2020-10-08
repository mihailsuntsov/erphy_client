import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CagentsDockRoutingModule } from './cagents-dock-routing.module';
import { CagentsDockComponent } from './cagents-dock.component';


@NgModule({
  declarations: [CagentsDockComponent],
  imports: [
    CommonModule,
    CagentsDockRoutingModule
  ]
})
export class CagentsDockModule { }
