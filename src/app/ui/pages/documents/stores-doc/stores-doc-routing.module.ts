import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StoresDocComponent } from './stores-doc.component';

const routes: Routes = [
  { path: '', component: StoresDocComponent },
  { path: ':id', component: StoresDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoresDocRoutingModule { }
