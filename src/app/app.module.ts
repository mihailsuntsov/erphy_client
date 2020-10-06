import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './modules/shared.module';
import { MaterialModule } from './modules/material.module';
import { httpInterceptorProviders } from './auth/auth-interceptor';
import { ValidationService } from './services/validation.service';
// import { UploadFileService } from './upload/upload-file.service';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule,
    MaterialModule,
    HttpClientModule,
  ],
  exports: [
    // MaterialModule
  ],
  providers: [
    httpInterceptorProviders,
    ValidationService,
    // UploadFileService,
    // {
      // provide: MatDialogRef,
      // useValue: {}
    // }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
