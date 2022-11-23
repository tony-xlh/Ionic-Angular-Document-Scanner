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