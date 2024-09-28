import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OnlineschedulingComponent } from './onlinescheduling.component';

const routes: Routes = [{ path: '', component: OnlineschedulingComponent },]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnlineschedulingRoutingModule { }
 