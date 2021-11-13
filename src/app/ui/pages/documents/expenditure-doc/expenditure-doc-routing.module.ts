import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExpenditureDocComponent } from './expenditure-doc.component';

const routes: Routes = [
  { path: '', component: ExpenditureDocComponent },
  { path: ':id', component: ExpenditureDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpenditureDocRoutingModule { }
