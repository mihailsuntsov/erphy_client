import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AcceptanceComponent } from './acceptance.component';

const routes: Routes = [{ path: '', component: AcceptanceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcceptanceRoutingModule { }
