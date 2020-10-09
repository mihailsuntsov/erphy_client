import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WriteoffComponent } from './writeoff.component';

const routes: Routes = [{ path: '', component: WriteoffComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WriteoffRoutingModule { }
