export interface DetectedQuad {
  location: Quadrilateral;
  confidenceAsDocumentBoundary: number;
}

export interface Quadrilateral {
  points:[Point,Point,Point,Point]
}

export interface Point {
  x:number;
  y:number;
}