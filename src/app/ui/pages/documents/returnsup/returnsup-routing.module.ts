import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnsupComponent } from './returnsup.component';

const routes: Routes = [{ path: '', component: ReturnsupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReturnsupRoutingModule { }
