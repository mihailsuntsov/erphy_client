import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MutualpaymentComponent } from './mutualpayment.component';

const routes: Routes = [{ path: '', component: MutualpaymentComponent },
                        { path: ':company/:option', component: MutualpaymentComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MutualpaymentRoutingModule { }
