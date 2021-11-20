import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BoxofficeDocComponent } from './boxoffice-doc.component';

const routes: Routes = [
  { path: '', component: BoxofficeDocComponent },
  { path: ':id', component: BoxofficeDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoxofficeDocRoutingModule { }
