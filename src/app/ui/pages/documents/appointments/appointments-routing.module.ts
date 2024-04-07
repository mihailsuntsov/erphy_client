import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppointmentsComponent } from './appointments.component';

const routes: Routes = [{ path: '', component: AppointmentsComponent },
{ path: ':company/:option', component: AppointmentsComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule { }
