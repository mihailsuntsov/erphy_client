import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AboutRoutingModule } from './about-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { WindowService } from '../../services/window.service';

@NgModule({
   declarations: [],
   providers: [, WindowService],
  imports: [
    CommonModule,
    AboutRoutingModule,
    SharedModule
  ]
})
export class AboutModule { }
