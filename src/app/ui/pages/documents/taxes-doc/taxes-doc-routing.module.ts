import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TaxesDocComponent } from './taxes-doc.component';

const routes: Routes = [
  { path: '', component: TaxesDocComponent },
  { path: ':id', component: TaxesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaxesDocRoutingModule { }
