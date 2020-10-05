// Модуль для хранения переиспользуемых компонент, директив и пайпов
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { HomeComponent } from '../home/home.component';
import { WINDOW_PROVIDERS } from '../window.providers';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    // HomeComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
  ],
  providers: [WINDOW_PROVIDERS],
})
export class SharedModule { }
