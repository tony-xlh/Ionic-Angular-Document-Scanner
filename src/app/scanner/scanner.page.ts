import { Component, OnInit } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { CameraPreview, EnumResolution } from 'capacitor-plugin-camera';
import { DocumentNormalizer, intersectionOverUnion } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer';
import { Router } from '@angular/router';
import { DetectedQuad, Point, Quadrilateral } from '../definitions';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
})
export class ScannerPage implements OnInit {
  onOrientationChangedListener:PluginListenerHandle|undefined;
  onPlayedListener:PluginListenerHandle|undefined;
  frameWidth:number = 1280;
  frameHeight:number = 720;
  viewBox:string = "0 0 1280 720";
  canvasForDetection = document.createElement("canvas");
  canvasForFullFrame:HTMLCanvasElement = document.createElement("canvas");
  interval:any;
  photoTaken:string|undefined;
  cameras:string[] = [];
  selectedCamera:string = "";
  scanning = false;
  previousResults:DetectedQuadResultItem[] = [];
  detectionResults:DetectedQuadResultItem[] = [];
  showConfirmation = false;
  usingWhiteBackgroundTemplate = false;
  preserveAspectRatio = "xMidYMid slice";
  constructor(private router: Router) {}

  async ngOnInit() {
    await CameraPreview.initialize();

    if (this.onOrientationChangedListener) {
      await this.onOrientationChangedListener.remove();
    }
    if (this.onPlayedListener) {
      await this.onPlayedListener.remove();
    }
    this.onOrientationChangedListener = await CameraPreview.addListener('onOrientationChanged', () => {
      this.updateViewBox(this.frameWidth,this.frameHeight);
    });
    this.onPlayedListener = await CameraPreview.addListener('onPlayed', async (res) => {
      this.selectedCamera = (await CameraPreview.getSelectedCamera()).selectedCamera;
      let width = res.resolution.split("x")[0];
      let height = res.resolution.split("x")[1];
      this.frameWidth = parseInt(width);
      this.frameHeight = parseInt(height);
      this.updateViewBox(this.frameWidth,this.frameHeight);
      this.startScanning();
    });
    
    await CameraPreview.requestCameraPermission();
    this.cameras = (await CameraPreview.getAllCameras()).cameras;
    await CameraPreview.setResolution({resolution:EnumResolution.RESOLUTION_1080P});
    await CameraPreview.startCamera();
  }

  async ngOnDestroy() {
    console.log("stop camera");
    this.stopScanning();
    await CameraPreview.stopCamera();
  }

  startScanning(){
    this.stopScanning();
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
      let results:DetectedQuadResultItem[] = [];
      this.scanning = true;
      let base64;
      let scaleRatio = 1.0;
      try {
        if (Capacitor.isNativePlatform()) {
          results = (await DocumentNormalizer.detectBitmap({})).results;
        } else {
          let snapshotResult = await CameraPreview.takeSnapshot2({canvas:this.canvasForDetection,maxLength:1280});
          if (snapshotResult.scaleRatio) {
            scaleRatio = snapshotResult.scaleRatio;
          };
          results = (await DocumentNormalizer.detect({source:this.canvasForDetection})).results;
        }
        if (scaleRatio != 1.0) {
          this.scaleResults(results,scaleRatio,scaleRatio);
        }
        this.drawOverlay(results);
        let ifSteady = this.checkIfSteady(results);
        if (ifSteady) {
          if (Capacitor.isNativePlatform()) {
            base64 = (await CameraPreview.takeSnapshot({quality:100})).base64;
          }else{
            await CameraPreview.takeSnapshot2({canvas:this.canvasForFullFrame});
            base64 = this.canvasForFullFrame.toDataURL("image/jpeg");
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

  checkIfSteady(results:DetectedQuadResultItem[]) {
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

  drawOverlay(results:DetectedQuadResultItem[]){
    this.detectionResults = results;
  }

  scaleResults(results:DetectedQuadResultItem[],scaleX:number,scaleY:number){
    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      this.scaleResult(result,scaleX,scaleY);
    }
  }

  scaleResult(result:DetectedQuadResultItem,scaleX:number,scaleY:number){
    let location = result.location;
    location.points[0].x = location.points[0].x/scaleX;
    location.points[1].x = location.points[1].x/scaleX;
    location.points[2].x = location.points[2].x/scaleX;
    location.points[3].x = location.points[3].x/scaleX;
    location.points[0].y = location.points[0].y/scaleY;
    location.points[1].y = location.points[1].y/scaleY;
    location.points[2].y = location.points[2].y/scaleY;
    location.points[3].y = location.points[3].y/scaleY;
  }

  retake(){
    this.showConfirmation = false;
    this.startScanning();
  }

  okay(){
    this.router.navigate(['/cropper'],{
      state: {
        image: this.photoTaken,
        detectionResult: this.cleanedDetectionResult(this.detectionResults[0])
      }
    });
  }

  cleanedDetectionResult(result:DetectedQuadResultItem){
    let cleaned:DetectedQuad;
    let points:[Point,Point,Point,Point] = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
    for (let index = 0; index < result.location.points.length; index++) {
      const p = result.location.points[index];
      points[index].x = p.x;
      points[index].y = p.y;
    }
    cleaned = {
      location:{points:points},
      confidenceAsDocumentBoundary:result.confidenceAsDocumentBoundary
    }
    return cleaned;
  }

  getPointsData(result:DetectedQuadResultItem){
    let location = result.location;
    let pointsData = location.points[0].x + "," + location.points[0].y + " ";
    pointsData = pointsData + location.points[1].x + "," + location.points[1].y +" ";
    pointsData = pointsData + location.points[2].x + "," + location.points[2].y +" ";
    pointsData = pointsData + location.points[3].x + "," + location.points[3].y;
    return pointsData;
  }

  async updateViewBox(width:number, height:number){
    if (Capacitor.isNativePlatform()) {
      let orientation = (await CameraPreview.getOrientation()).orientation;
      if (orientation === "PORTRAIT") {
        console.log("switch width and height");
        let temp = width;
        width = height;
        height = temp;
      }
    }
    this.viewBox = "0 0 "+width+" "+height;
  }

  getSVGWidth(svgElement:any){
    let imgRatio = this.frameWidth/this.frameHeight;
    let width = svgElement.clientHeight * imgRatio;
    return width;
  }

  close(){
    this.router.navigate(['/home']);
  }

  async switchCamera(){
    this.stopScanning();
    await CameraPreview.selectCamera({cameraID:this.selectedCamera});
  }
}
