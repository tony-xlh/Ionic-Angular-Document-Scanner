import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, Photo } from '@capacitor/camera';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  initialized = false;
  constructor(private router: Router) {
    this.initialize();
  }

  async initialize(){
    try {
      let license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="; //public trial
      await DocumentNormalizer.initLicense({license:license});
      await DocumentNormalizer.initialize();
      this.initialized = true;
    } catch (error) {
      alert(error);
    }
  }
  
  liveScan(){
    console.log("scan pressed");
    if (this.initialized) {
      this.router.navigate(['/scanner']);
    }else{
      alert("Please wait for initialization.");
    }
  }

  photoScan(){
    console.log("scan pressed");
    if (this.initialized) {
      this.takePicture();
    }else{
      alert("Please wait for initialization.");
    }
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl
    });
  
    if (image) {
      //if ('ontouchstart' in document.documentElement && !Capacitor.isNativePlatform()) {
      //  if (image.dataUrl) {
      //    image.dataUrl = await this.scaleDownImageForWeb(image.dataUrl);
      //  }
      //}
      this.router.navigate(['/cropper'],{
        state: {
          image: image.dataUrl
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
            targetHeight = 1920;
            targetWidth = targetHeight/ratio;
          }else {
            targetWidth = 1920;
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
