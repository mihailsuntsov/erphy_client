import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InvoiceoutDocComponent } from './invoiceout-doc.component';

const routes: Routes = [
  { path: '', component: InvoiceoutDocComponent },
  { path: ':id', component: InvoiceoutDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceoutDocRoutingModule { }
