import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType } from '@capacitor/camera';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private router: Router) {
    DocumentNormalizer.initLicense({license:"DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="});
    DocumentNormalizer.initialize();
  }
  
  scan(){
    console.log("scan pressed");
    this.takePicture();
  }


  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl
    });
  
    if (image) {
      this.router.navigate(['/cropper'],{
        state: {
          image: image
        }
      });
    }
  };




}
