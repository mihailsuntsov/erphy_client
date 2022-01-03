import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceoutComponent } from './invoiceout.component';

const routes: Routes = [{ path: '', component: InvoiceoutComponent },
                        { path: ':option', component: InvoiceoutComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceoutRoutingModule { }
