import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VatinvoiceoutDocComponent } from './vatinvoiceout-doc.component';

const routes: Routes = [
  { path: '', component: VatinvoiceoutDocComponent },
  { path: ':id', component: VatinvoiceoutDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VatinvoiceoutDocRoutingModule { }
