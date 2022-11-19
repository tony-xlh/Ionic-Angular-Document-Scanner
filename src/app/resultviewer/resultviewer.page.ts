import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DetectedQuadResult } from 'dynamsoft-document-normalizer';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

@Component({
  selector: 'app-resultviewer',
  templateUrl: './resultviewer.page.html',
  styleUrls: ['./resultviewer.page.scss'],
})
export class ResultviewerPage implements OnInit {
  dataURL:string = "";
  normalizedImageDataURL:string = "";
  private detectedQuadResult:DetectedQuadResult|undefined;
  constructor(private router: Router) { }

  ngOnInit() {
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
      this.normalizedImageDataURL = normalizedImageResult.result.data;
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
    const blob = await (await fetch(this.normalizedImageDataURL)).blob();
    const file = new File([blob], 'fileName.png', { type: blob.type });
    navigator.share({
      title: 'Hello',
      text: 'Check out this image!',
      files: [file],
    })
  }

}
