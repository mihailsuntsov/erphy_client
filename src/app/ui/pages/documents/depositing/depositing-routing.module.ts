import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DepositingComponent } from './depositing.component';

const routes: Routes = [{ path: '', component: DepositingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DepositingRoutingModule { }
