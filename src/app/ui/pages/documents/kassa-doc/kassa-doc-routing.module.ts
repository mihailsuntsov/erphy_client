import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KassaDocComponent } from './kassa-doc.component';

const routes: Routes = [
  { path: '', component: KassaDocComponent },
  { path: ':id', component: KassaDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KassaDocRoutingModule { }
