import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompaniesDocComponent } from './companies-doc.component';

const routes: Routes = [
  { path: '', component: CompaniesDocComponent },
  { path: ':id', component: CompaniesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompaniesDocRoutingModule { }
