import { Component, OnInit } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { CameraPreview } from 'capacitor-plugin-dynamsoft-camera-preview';
import { DocumentNormalizer, intersectionOverUnion } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { DetectedQuadResult } from 'dynamsoft-document-normalizer';
import { ScreenOrientation } from "@awesome-cordova-plugins/screen-orientation";
import { Router } from '@angular/router';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
})
export class ScannerPage implements OnInit {
  onPlayedListener:PluginListenerHandle|undefined;
  frameWidth:number = 1280;
  frameHeight:number = 720;
  viewBox:string = "0 0 1280 720";
  interval:any;
  photoTaken:string|undefined;
  scanning = false;
  previousResults:DetectedQuadResult[] = [];
  detectionResults:DetectedQuadResult[] = [];
  showConfirmation = false;
  constructor(private router: Router) {}

  async ngOnInit() {
    await CameraPreview.initialize();
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.onChange().subscribe(() => {
        this.updateViewBox(this.frameWidth,this.frameHeight);
      });
    }
    if (this.onPlayedListener) {
      await this.onPlayedListener.remove();
    }
    this.onPlayedListener = await CameraPreview.addListener('onPlayed', async (res) => {
      let width = res.resolution.split("x")[0];
      let height = res.resolution.split("x")[1];
      this.frameWidth = parseInt(width);
      this.frameHeight = parseInt(height);
      this.updateViewBox(this.frameWidth,this.frameHeight);
    });
    
    await CameraPreview.requestCameraPermission();
    await CameraPreview.startCamera();
    this.startScanning();
  }

  startScanning(){
    this.photoTaken = undefined;
    this.previousResults = [];
    this.scanning = false;

    const captureAndDetect = async () => {
      if (this.scanning === true) {
        return;
      }
      if (this.photoTaken) {
        return;
      }
      let results:DetectedQuadResult[] = [];
      this.scanning = true;
      let base64;
      let frame;
      try {
        if (Capacitor.isNativePlatform()) {
          let result = await CameraPreview.takeSnapshot({quality:100});
          base64 = result.base64;
          results = (await DocumentNormalizer.detect({source:base64})).results;
        } else {
          let result = await CameraPreview.takeSnapshot2();
          frame = result.frame;
          results = (await DocumentNormalizer.detect({source:frame})).results;
        }
        this.drawOverlay(results);
        let ifSteady = this.checkIfSteady(results);
        if (ifSteady) {
          if (!base64 && frame) {
            base64 = frame.toCanvas().toDataURL("image/jpeg");
          }
          this.photoTaken = base64;
          if (!this.photoTaken!.startsWith("data")) {
            this.photoTaken = "data:image/jpeg;base64," + this.photoTaken;
          }
          this.stopScanning();
          this.showConfirmation = true;
        }
        
      } catch (error) {
        console.log(error);
      }
      this.scanning = false;
      console.log(results);
    }
    this.interval = setInterval(captureAndDetect,100);
  }
  
  stopScanning(){
    clearInterval(this.interval);
    this.scanning = false;
  }

  checkIfSteady(results:DetectedQuadResult[]) {
    if (results.length>0) {
      let result = results[0];
      if (this.previousResults.length >= 3) {
        if (this.steady() == true) {
          console.log("steady");
          return true;
        }else{
          console.log("shift and add result");
          this.previousResults.shift();
          this.previousResults.push(result);
        }
      }else{
        console.log("add result");
        this.previousResults.push(result);
      }
    }
    return false;
  }

  steady(){
    if (this.previousResults[0] && this.previousResults[1] && this.previousResults[2]) {
      let iou1 = intersectionOverUnion(this.previousResults[0].location.points,this.previousResults[1].location.points);
      let iou2 = intersectionOverUnion(this.previousResults[1].location.points,this.previousResults[2].location.points);
      let iou3 = intersectionOverUnion(this.previousResults[2].location.points,this.previousResults[1].location.points);
      console.log(iou1);
      console.log(iou2);
      console.log(iou3);
      if (iou1>0.9 && iou2>0.9 && iou3>0.9) {
        return true;
      }else{
        return false;
      }
    }
    return false;
  }

  drawOverlay(results:DetectedQuadResult[]){
    this.detectionResults = results;
  }

  retake(){
    this.showConfirmation = false;
    this.startScanning();
  }

  okay(){
    console.log(this.photoTaken);
    this.router.navigate(['/cropper'],{
      state: {
        image: this.photoTaken
      }
    });
  }

  getPointsData(result:DetectedQuadResult){
    let location = result.location;
    let pointsData = location.points[0].x + "," + location.points[0].y + " ";
    pointsData = pointsData + location.points[1].x + "," + location.points[1].y +" ";
    pointsData = pointsData + location.points[2].x + "," + location.points[2].y +" ";
    pointsData = pointsData + location.points[3].x + "," + location.points[3].y;
    return pointsData;
  }

  updateViewBox(width:number, height:number){
    if (Capacitor.isNativePlatform()) {
      if (ScreenOrientation.type.toLowerCase().indexOf("portrait") != -1) {
        console.log("switch width and height");
        let temp = width;
        width = height;
        height = temp;
      }
    }
    this.viewBox = "0 0 "+width+" "+height;
  }
}
