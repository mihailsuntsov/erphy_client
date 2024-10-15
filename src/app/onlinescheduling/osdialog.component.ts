import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'osdialog',
    templateUrl: './osdialog.component.html',
    styleUrls: ['./osdialog.component.css'],
})

export class OsDialogComponent implements OnInit {
    // variables

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public OsDialog: MatDialogRef<OsDialogComponent>,
  ) { }

  ngOnInit(): void {
    console.log('data:',this.data)
  }

  onNoClick(): void {
    this.OsDialog.close();
  }


}