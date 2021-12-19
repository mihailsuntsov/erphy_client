import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MutualpaymentDetComponent } from './mutualpayment_det.component';

const routes: Routes = [{ path: '', component: MutualpaymentDetComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MutualpaymentDetRoutingModule { }
