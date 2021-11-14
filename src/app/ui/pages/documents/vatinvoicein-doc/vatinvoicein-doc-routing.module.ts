import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VatinvoiceinDocComponent } from './vatinvoicein-doc.component';

const routes: Routes = [
  { path: '', component: VatinvoiceinDocComponent },
  { path: ':id', component: VatinvoiceinDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VatinvoiceinDocRoutingModule { }
