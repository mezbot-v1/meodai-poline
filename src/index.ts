export type FuncNumberReturn = (arg0: number) => Vector2;
export type Vector2 = [number, number];
export type Vector3 = [number, number, number];

export const pointToHSL = (
  x: number,
  y: number,
  z: number
): Vector3 => {
  const cy = 0.5;
  const cx = 0.5;
  const radians = Math.atan2(y - cy, x - cx);
  let deg = radians * (180 / Math.PI);
  deg = (deg + 90) % 360;
  const s = z;

  const dist = Math.sqrt(Math.pow(y - cy, 2) + Math.pow(x - cx, 2));

  const l = dist / cx;

  return [deg, s, l];
};

export const hslToPoint = (hsl: Vector3): Vector3 => {
  const [h, s, l] = hsl;
  const cx = 0.5;
  const cy = 0.5;

  const radians = h / (180 / Math.PI) - 90;
  const dist = l * cx;
  const x = cx + dist * Math.cos(radians);
  const y = cy + dist * Math.sin(radians);
  const z = s;

  return [x, y, z];
};

export const randomHSLPair = (
  minHDiff = 90,
  minSDiff = 0,
  minLDiff = 0.25,
  previousColor: Vector3 | null = null
): [Vector3, Vector3] => {
  let h1, s1, l1;

  if (previousColor) {
    [h1, s1, l1] = previousColor;
  } else {
    h1 = Math.random() * 360;
    s1 = Math.random();
    l1 = Math.random();
  }

  const h2 =
    (360 + (h1 + minHDiff + Math.random() * (360 - minHDiff * 2))) % 360;
  const s2 = minSDiff + Math.random() * (1 - minSDiff);
  const l2 = minSDiff + Math.random() * (1 - minLDiff);

  return [
    [h1, s1, l1],
    [h2, s2, l2],
  ];
};

export const vectorsOnLine = (
  p1: Vector3,
  p2: Vector3,
  numPoints = 4,
  f = (t, r) => t,
  invert = false
):Vector3[] => {
  const points:Vector3[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const tModified = f(t, invert);
    const x = (1 - tModified) * p1[0] + tModified * p2[0];
    const y = (1 - tModified) * p1[1] + tModified * p2[1];
    const z = (1 - tModified) * p1[2] + tModified * p2[2];

    points.push([x, y, z]);
  }

  return points;
};

const linearPosition = (t: number, reverse = false) => {
  return t;
};

const exponentialPosition = (t: number, reverse = false) => {
  if (reverse) {
     return 1 - (1 - t) ** 2
  }
  return t ** 2;
};

const quadraticPosition = (t: number, reverse = false) => {
  if (reverse) {
    return 1 - (1 - t) ** 3
  }
  return t ** 3;
};

const sinusoidalPosition = (t: number, reverse = false) => {
  if (reverse) {
    return 1 - Math.sin((1 - t) * Math.PI / 2);
  }
  return Math.sin(t * Math.PI / 2);
};

const circularPosition = (t: number, reverse = false) => {
  if (reverse) {
    return 1 - Math.sqrt(1 - (1 - t) ** 2);
  }
  return 1 - Math.sqrt(1 - t ** 2);
};

const arcPosition = (t: number, reverse = false) => {
  if (reverse) {
    return Math.sqrt(1 - (1 - t) ** 2);
  }
  return 1 - Math.sqrt(1 - t);
};

export const positionFunctions = {
  linearPosition,
  exponentialPosition,
  quadraticPosition,
  sinusoidalPosition,
  circularPosition,
  arcPosition,
};

const distance = (p1, p2) => {
  const a = p2[0] - p1[0];
  const b = p2[1] - p1[1];
  const c = p2[2] - p1[2];

  return Math.sqrt(a * a + b * b + c * c);
}
class ColorPoint {
  constructor({ 
    x = null, 
    y = null, 
    z = null, 
    color = null, 
  } = {}) {
    this.position = { x, y, z, color };
  }

  x: number | null;
  y: number | null;
  z: number | null;
  color: Vector3 | null;

  public set position({ 
    x = null, 
    y = null, 
    z = null, 
    color = null, 
  }) {
    if (x && y && y && color) {
      throw new Error("Point must be initialized with either x,y,z or hsl");
    } else if (x && y && z) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.color = pointToHSL(this.x, this.y, this.z);
    } else if (color) {
      this.color = color;
      [this.x, this.y, this.z]  = hslToPoint(this.color);
    }
  }

  get position (): Vector3 {
    return [this.x, this.y, this.z];
  }

  get hslCSS (): string {
    return `hsl(${this.color[0]}, ${this.color[1] * 100}%, ${this.color[2] * 100}%)`;
  }
}


export class Poline {
  constructor(
    anchorColors = randomHSLPair(), 
    numPoints = 5,
    positionFunction = sinusoidalPosition,
  ) {
    this.anchorPoints = anchorColors.map(
      point => new ColorPoint({x: null, y: null, z: null, color: point})
    );

    this.numPoints = numPoints;
    
    this.updatePointPairs();
  }

  anchorPoints: ColorPoint[];
  numPoints: number;
  points: ColorPoint[][];
  positionFunction: sinusoidalPosition;

  updatePointPairs() {
    const pairs = [];
    for (let i = 0; i < this.anchorPoints.length - 1; i++) {
      pairs.push(
        [this.anchorPoints[i], this.anchorPoints[i + 1]]
      );
    }
    this.points = pairs.map((pair, i) => {
      return vectorsOnLine(
        pair[0].position,
        pair[1].position,
        this.numPoints,
        this.positionFunction,
        i % 2,
      ).map((p) => new ColorPoint(
        {x: p[0], y: p[1], z: p[2], color: null}
      ));
    });
  }

  addAnchorPoint({x, y, z, color}) {
    const newAnchor = new ColorPoint({x, y, z, color});
    this.anchorPoints.push(newAnchor);
    this.updatePointPairs();
  }

  getClosestAnchorPoint(point: Vector3, maxDistance: 1) {
    const distances = this.anchorPoints.map((anchor) => {
      return distance(anchor.position, point);
    });

    const minDistance = Math.min(...distances);
    if (minDistance > maxDistance) {
      return null;
    }

    const closestAnchorIndex = distances.indexOf(minDistance);
    
    return this.anchorPoints[closestAnchorIndex];
  }

  public set anchorPoint({pointReference, pointIndex, x,y,z, color}) {
    let index = pointIndex;

    if (pointReference) {
      index = this.anchorPoints.indexOf(pointReference);
    }
      
    this.anchorPoints[index] = new ColorPoint({x, y, z, color});

    this.updatePointPairs();
  }

  get flattenedPoints() {
    return this.points.flat().filter(
      (p, i) => i != 0 ? i % this.numPoints : true
    );
  }

  get colors() {
    return this.flattenedPoints.map((p) => p.color);
  }

  get colorsCSS() {
    return this.flattenedPoints.map((c) => c.hslCSS);
  }
}