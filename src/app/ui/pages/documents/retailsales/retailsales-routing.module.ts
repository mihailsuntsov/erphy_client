import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RetailsalesComponent } from './retailsales.component';

const routes: Routes = [{ path: '', component: RetailsalesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RetailsalesRoutingModule { }
