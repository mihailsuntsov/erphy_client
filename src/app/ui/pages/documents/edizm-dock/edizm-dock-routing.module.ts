import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EdizmDockComponent } from './edizm-dock.component';

const routes: Routes = [
  { path: '', component: EdizmDockComponent },
  { path: ':id', component: EdizmDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EdizmDockRoutingModule { }
