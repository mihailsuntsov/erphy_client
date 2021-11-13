import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExpenditureComponent } from './expenditure.component';

const routes: Routes = [{ path: '', component: ExpenditureComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpenditureRoutingModule { }
