import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MoneyflowDetComponent } from './moneyflow_det.component';

const routes: Routes = [{ path: '', component: MoneyflowDetComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MoneyflowDetRoutingModule { }
