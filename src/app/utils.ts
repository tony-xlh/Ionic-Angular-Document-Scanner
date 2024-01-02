import { DetectedQuad, Point } from './definitions';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer';

export async function getCanvasFromDataURL(dataURL:string):Promise<HTMLCanvasElement>{
  let blob = await (await fetch(dataURL)).blob();
  let bitmap = await createImageBitmap(blob);
  let canvas = document.createElement('canvas');
  canvas.width  = bitmap.width;
  canvas.height = bitmap.height;
  let ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
  }
  return canvas;
}

export function cleanedDetectionResult(result:DetectedQuadResultItem){
  console.log(result);
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