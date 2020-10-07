import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompaniesDockComponent } from './companies-dock.component';

const routes: Routes = [
  { path: '', component: CompaniesDockComponent },
  { path: ':id', component: CompaniesDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompaniesDockRoutingModule { }
