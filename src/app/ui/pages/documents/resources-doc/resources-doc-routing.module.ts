import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResourcesDocComponent } from './resources-doc.component';

const routes: Routes = [
  { path: '', component: ResourcesDocComponent },
  { path: ':id', component: ResourcesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesDocRoutingModule { }
