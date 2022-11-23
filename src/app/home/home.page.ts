import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private router: Router) {
    let license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="; //public trial
    if (Capacitor.isNativePlatform()) {
      license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMTAwMjI3NzYzLVRYbE5iMkpwYkdWUWNtOXFYMlJrYmciLCJvcmdhbml6YXRpb25JRCI6IjEwMDIyNzc2MyIsImNoZWNrQ29kZSI6MTM0ODY2MDUyMn0=";
    }else{
      license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMTAwMjI3NzYzLVRYbFhaV0pRY205cVgyUmtiZyIsIm9yZ2FuaXphdGlvbklEIjoiMTAwMjI3NzYzIiwiY2hlY2tDb2RlIjotMTY2NDUwOTcxMH0=";
    }
    DocumentNormalizer.initLicense({license:license});
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
      if ('ontouchstart' in document.documentElement && !Capacitor.isNativePlatform()) {
        if (image.dataUrl) {
          image.dataUrl = await this.scaleDownImageForWeb(image.dataUrl);
        }
      }
      this.router.navigate(['/cropper'],{
        state: {
          image: image
        }
      });
    }
  };

  scaleDownImageForWeb(dataURL:string):Promise<string>{
    console.log("regenerate DataURL");
    return new Promise(function (resolve, reject) {
      try {
        let img = document.createElement("img");
        img.onload = function() {
          let canvas = document.createElement("canvas");
          let ctx = canvas.getContext("2d");
          let targetWidth;
          let targetHeight;
          let ratio = img.naturalHeight/img.naturalWidth;
          if (img.naturalHeight>img.naturalWidth) {
            targetHeight = 320;
            targetWidth = targetHeight/ratio;
          }else {
            targetWidth = 320;
            targetHeight = targetWidth*ratio;
          }
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          if (ctx) {
            ctx.drawImage(img,0,0,targetWidth,targetHeight);
          }
          let scaled = canvas.toDataURL('image/jpeg');
          resolve(scaled);
        };
        img.src = dataURL;
      } catch (error) {
        reject(error);
      }
    });
  }
  


}
