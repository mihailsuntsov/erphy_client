import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VatinvoiceoutComponent } from './vatinvoiceout.component';

const routes: Routes = [{ path: '', component: VatinvoiceoutComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VatinvoiceoutRoutingModule { }
