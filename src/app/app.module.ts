import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { httpInterceptorProviders } from './auth/auth-interceptor';
// import { ValidationService } from './services/validation.service';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslocoRootModule } from './transloco-root.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    TranslocoRootModule,
    FontAwesomeModule,
  ],
  exports: [
  ],
  providers: [
    httpInterceptorProviders,
    {
      provide: MatDialogRef,
      useValue: {}
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
