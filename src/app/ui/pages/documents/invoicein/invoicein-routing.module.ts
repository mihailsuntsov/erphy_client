import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceinComponent } from './invoicein.component';

const routes: Routes = [{ path: '', component: InvoiceinComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceinRoutingModule { }
