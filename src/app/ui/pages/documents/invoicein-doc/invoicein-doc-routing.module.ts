import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InvoiceinDocComponent } from './invoicein-doc.component';

const routes: Routes = [
  { path: '', component: InvoiceinDocComponent },
  { path: ':id', component: InvoiceinDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceinDocRoutingModule { }
