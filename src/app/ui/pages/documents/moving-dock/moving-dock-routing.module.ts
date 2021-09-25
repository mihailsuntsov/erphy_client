import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MovingDockComponent } from './moving-dock.component';

const routes: Routes = [
  { path: '', component: MovingDockComponent },
  { path: ':id', component: MovingDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MovingDockRoutingModule { }
