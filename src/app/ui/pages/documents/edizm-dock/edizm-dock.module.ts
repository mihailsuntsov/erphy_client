import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EdizmDockRoutingModule } from './edizm-dock-routing.module';
import { EdizmDockComponent } from './edizm-dock.component';


@NgModule({
  declarations: [EdizmDockComponent],
  imports: [
    CommonModule,
    EdizmDockRoutingModule
  ]
})
export class EdizmDockModule { }
