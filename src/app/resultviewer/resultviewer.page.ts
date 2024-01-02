import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getCanvasFromDataURL } from '../utils';

@Component({
  selector: 'app-resultviewer',
  templateUrl: './resultviewer.page.html',
  styleUrls: ['./resultviewer.page.scss'],
})
export class ResultviewerPage implements OnInit {
  dataURL:string = "";
  normalizedImageDataURL:string = "";
  shareSupported:boolean = true;
  isNative:boolean = false;
  templateName:string = "NormalizeDocument_Binary"
  private detectedQuadResult:DetectedQuadResultItem|undefined;
  constructor(private router: Router) { }

  ngOnInit() {
    this.isNative = Capacitor.isNativePlatform();
    if (!this.isNative) {
      if (!("share" in navigator)) {
        this.shareSupported = false;
      }
    }
    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      const routeState = navigation.extras.state;
      console.log(routeState);
      if (routeState) {
        this.dataURL = routeState["dataURL"];  
        this.detectedQuadResult = routeState["detectedQuadResult"];
        this.normalize();
      }
    }
  }

  async normalize() {
    if (this.detectedQuadResult) {
      let source;
      if (Capacitor.isNativePlatform()) {
        source = this.dataURL;
      }else{
        source = await getCanvasFromDataURL(this.dataURL)
      }
      let normalizedImageResult = await DocumentNormalizer.normalize({source:source,quad:this.detectedQuadResult.location,template:this.templateName,includeBase64:true});
      let data = normalizedImageResult.result.base64;
      if (data) {
        if (!data.startsWith("data")) {
          data = "data:image/jpeg;base64," + data;
        }
        this.normalizedImageDataURL = data;
      }
    }else{
      this.normalizedImageDataURL = this.dataURL;
    }
  }

  async colorModeChanged(event:any){
    console.log(event);
    if (event.target.value === "binary") {
      this.templateName = "NormalizeDocument_Binary";
    } else if (event.target.value === "gray") {
      this.templateName = "NormalizeDocument_Gray";
    } else {
      this.templateName = "NormalizeDocument_Color";
    }
    await this.normalize();
  }

  async share(){
    if (this.isNative) {
      let fileName = "normalized.jpg";
      let writingResult = await Filesystem.writeFile({
        path: fileName,
        data: this.normalizedImageDataURL,
        directory: Directory.Cache
      });
      Share.share({
        title: fileName,
        text: fileName,
        url: writingResult.uri,
      });
    } else {
      const blob = await (await fetch(this.normalizedImageDataURL)).blob();
      const file = new File([blob], 'normalized.png', { type: blob.type });
      navigator.share({
        title: 'Hello',
        text: 'Check out this image!',
        files: [file],
      })
    }
  }

  async download(){
    const blob = await (await fetch(this.normalizedImageDataURL)).blob();
    const imageURL = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = imageURL;
    link.download = 'normalized.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
