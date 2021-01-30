import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KassaDockComponent } from './kassa-dock.component';

const routes: Routes = [
  { path: '', component: KassaDockComponent },
  { path: ':id', component: KassaDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KassaDockRoutingModule { }
