import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MovingComponent } from './moving.component';

const routes: Routes = [{ path: '', component: MovingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MovingRoutingModule { }
