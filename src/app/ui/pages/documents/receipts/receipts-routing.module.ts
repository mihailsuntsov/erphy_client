import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReceiptsComponent } from './receipts.component'; 

const routes: Routes = [
  { path: '', component: ReceiptsComponent },
  { path: ':id', component: ReceiptsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReceiptsRoutingModule { }
