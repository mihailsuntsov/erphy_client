import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KassaComponent } from './kassa.component';

const routes: Routes = [{ path: '', component: KassaComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KassaRoutingModule { }
