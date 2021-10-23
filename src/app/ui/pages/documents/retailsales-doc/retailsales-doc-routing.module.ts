import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RetailsalesDocComponent } from './retailsales-doc.component';

const routes: Routes = [
  { path: '', component: RetailsalesDocComponent },
  { path: ':id', component: RetailsalesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RetailsalesDocRoutingModule { }
