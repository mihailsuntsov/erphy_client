import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WithdrawalDocComponent } from './withdrawal-doc.component';

const routes: Routes = [
  { path: '', component: WithdrawalDocComponent },
  { path: ':id', component: WithdrawalDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WithdrawalDocRoutingModule { }
