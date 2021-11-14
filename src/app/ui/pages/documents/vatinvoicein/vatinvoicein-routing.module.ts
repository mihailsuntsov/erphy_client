import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VatinvoiceinComponent } from './vatinvoicein.component';

const routes: Routes = [{ path: '', component: VatinvoiceinComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VatinvoiceinRoutingModule { }
