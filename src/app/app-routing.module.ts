import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';



const routes: Routes = [
  { path: '', loadChildren: () => import('./login/login.module').then(m => m.LoginModule) },
  { path: 'auth/login', loadChildren: () => import('./login/login.module').then(m => m.LoginModule) },
  { path: 'signup', loadChildren: () => import('./register/register.module').then(m => m.RegisterModule) },
  { path: 'restore', loadChildren: () => import('./restore/restore.module').then(m => m.RestoreModule) },
  { path: 'newpass', loadChildren: () => import('./newpass/newpass.module').then(m => m.NewpassModule) },
  { path: 'activate', loadChildren: () => import('./activate/activate.module').then(m => m.ActivateModule) },
  { path: 'onlinescheduling', loadChildren: () => import('./onlinescheduling/onlinescheduling.module').then(m => m.OnlineschedulingModule) },
  { path: 'ui', loadChildren: () => import('./ui/ui.module').then(m => m.UiModule) },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
