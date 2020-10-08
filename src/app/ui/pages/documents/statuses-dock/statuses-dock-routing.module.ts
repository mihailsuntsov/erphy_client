import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StatusesDockComponent } from './statuses-dock.component';

const routes: Routes = [{ path: '', component: StatusesDockComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StatusesDockRoutingModule { }
