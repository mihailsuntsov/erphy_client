import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DepositingDocComponent } from './depositing-doc.component';

const routes: Routes = [
  { path: '', component: DepositingDocComponent },
  { path: ':id', component: DepositingDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DepositingDocRoutingModule { }
