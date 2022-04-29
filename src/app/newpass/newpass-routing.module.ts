import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NewpassComponent } from './newpass.component';

const routes: Routes = [{ path: '', component: NewpassComponent },
{ path: ':uuid', component: NewpassComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NewpassRoutingModule { }
