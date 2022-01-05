import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RemainsComponent } from './remains.component';

const routes: Routes = [{ path: '', component: RemainsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RemainsRoutingModule { }
