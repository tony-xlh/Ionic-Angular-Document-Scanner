import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DetectedQuadResult } from 'dynamsoft-document-normalizer';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  private detectedQuadResult:DetectedQuadResult|undefined;
  constructor(private router: Router) { }

  ngOnInit() {
    this.isNative = Capacitor.isNativePlatform();
    if (!this.isNative) {
      this.shareSupported = "share" in navigator;
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
      let normalizedImageResult = await DocumentNormalizer.normalize({source:this.dataURL,quad:this.detectedQuadResult.location});
      let data = normalizedImageResult.result.data;
      if (!data.startsWith("data")) {
        data = "data:image/jpeg;base64," + data;
      }
      this.normalizedImageDataURL = data;
    }
  }

  async colorModeChanged(event:any){
    console.log(event);
    let template;
    if (event.target.value === "binary") {
      template = "{\"GlobalParameter\":{\"Name\":\"GP\",\"MaxTotalImageDimension\":0},\"ImageParameterArray\":[{\"Name\":\"IP-1\",\"NormalizerParameterName\":\"NP-1\",\"BaseImageParameterName\":\"\"}],\"NormalizerParameterArray\":[{\"Name\":\"NP-1\",\"ContentType\":\"CT_DOCUMENT\",\"ColourMode\":\"ICM_BINARY\"}]}";
    } else if (event.target.value === "gray") {
      template = "{\"GlobalParameter\":{\"Name\":\"GP\",\"MaxTotalImageDimension\":0},\"ImageParameterArray\":[{\"Name\":\"IP-1\",\"NormalizerParameterName\":\"NP-1\",\"BaseImageParameterName\":\"\"}],\"NormalizerParameterArray\":[{\"Name\":\"NP-1\",\"ContentType\":\"CT_DOCUMENT\",\"ColourMode\":\"ICM_GRAYSCALE\"}]}";
    } else {
      template = "{\"GlobalParameter\":{\"Name\":\"GP\",\"MaxTotalImageDimension\":0},\"ImageParameterArray\":[{\"Name\":\"IP-1\",\"NormalizerParameterName\":\"NP-1\",\"BaseImageParameterName\":\"\"}],\"NormalizerParameterArray\":[{\"Name\":\"NP-1\",\"ContentType\":\"CT_DOCUMENT\",\"ColourMode\":\"ICM_COLOUR\"}]}";
    }
    await DocumentNormalizer.initRuntimeSettingsFromString({template:template});
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
