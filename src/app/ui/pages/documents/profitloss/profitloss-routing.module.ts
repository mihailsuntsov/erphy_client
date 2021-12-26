import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfitlossComponent } from './profitloss.component';

const routes: Routes = [{ path: '', component: ProfitlossComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfitlossRoutingModule { }
