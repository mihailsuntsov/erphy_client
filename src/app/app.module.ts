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
import { MatDialogRef } from '@angular/material/dialog';
import { ListUploadComponent } from './upload/list-upload/list-upload.component';
import { FormUploadComponent } from './upload/form-upload/form-upload.component';
import { DetailsUploadComponent } from './upload/details-upload/details-upload.component';
import { UploadFileService } from './upload/upload-file.service';


@NgModule({
  declarations: [
    AppComponent,
    ListUploadComponent,
    FormUploadComponent,
    DetailsUploadComponent,
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
    UploadFileService,// !!! Возможно это надо провайдить из app.module.ts
    {
      provide: MatDialogRef,
      useValue: {}
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
