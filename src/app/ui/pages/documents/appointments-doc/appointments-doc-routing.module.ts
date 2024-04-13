import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppointmentsDocComponent } from './appointments-doc.component';

const routes: Routes = [
  { path: '', component: AppointmentsDocComponent },
  { path: ':id', component: AppointmentsDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsDocRoutingModule { }
