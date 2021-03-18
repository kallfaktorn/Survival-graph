function NODE_RADIUS() {
  return 60;
}

function nodeCollideNodes(l, ls) {
  let collision = false;

  ls.forEach((ln, i) => {
    if (nodeCollideNode(l, ln)) {
      collision = true;
    }
  });

  return collision;
}

function edgeCollideNodes(n1, n2, ls) {
  let collision = false;
  const e = computeEdgeBetweenNodes(n1, n2);

  ls.forEach((ln, i) => {
    if (edgeCollideCircle(e.x1, e.y1, e.x2, e.y2, ln)) {
      collision = true;
    }
  });

  return collision;
}

function computeEdgeBetweenNodes(n1, n2) {
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  let ndx = dx / d;
  let ndy = dy / d;

  const x1 = n1.x + n1.r * ndx;
  const y1 = n1.y + n1.r * ndy;
  const x2 = n2.x - n2.r * ndx;
  const y2 = n2.y - n2.r * ndy;

  return {x1, y1, x2, y2};
}

function nodeCollideNode(n1, n2) {
  const x = n2.x - n1.x;
  const y = n2.y - n1.y;

  return (x * x + y * y) < ((n1.r + n2.r) * (n1.r + n2.r))
}

function generateLocation(n) {
  const offsetX = n.x;
  const offsetY = n.y;
  let distanceBetweenNodeCenters = n.r * 3;

  let radius = NODE_RADIUS();
  let locationAdded = false

  while((distanceBetweenNodeCenters < (NODE_RADIUS() * 10)) && !locationAdded) {
    let degrees = [...Array(365).keys()].map(i => i + 1);

    while (degrees.length > 0 && !locationAdded) {
      const index = Math.floor(Math.random() * degrees.length);
      const randomDegree = degrees.splice(index, 1);
      const randomRadian = degreesToRadians(randomDegree);

      const newNodeX = Math.cos(randomRadian) * distanceBetweenNodeCenters + offsetX;
      const newNodeY = Math.sin(randomRadian) * distanceBetweenNodeCenters + offsetY;
      const newNode = generateNode(newNodeX, newNodeY, NODE_RADIUS());

      if (!nodeCollideNodes(newNode, locations) && !edgeCollideNodes(n, newNode, locations)) {
        locations.push(newNode);
        n.neighbours.push(newNode);
        newNode.neighbours.push(n);
        locationAdded = true;
      }
    }
    distanceBetweenNodeCenters += n.r * 3;
  }
}

function generateNode(x, y, r) {
  const nrOfTrees = Math.floor(Math.random() * 10);
  const node = { group: 'node', index: generateNodeIndex(), x, y, r, neighbours: [], pois: [] };

  // Add trees to node
  for(let i = 0; i < nrOfTrees; i++) {
    addPoiToNode(node);
  }

  return node;
}

function addPoiToNode(n) {
  const nodeRadius = n.r;
  const poiRadius = 10;
  const rInterval = (nodeRadius) * 2;
  let xIntervals = [...Array(rInterval).keys()].map(i => i + 1);
  let yIntervals = [...Array(rInterval).keys()].map(i => i + 1);

  let intervalsXY = [];
  xIntervals.forEach(x => {
    yIntervals.forEach(y => {
      if (circleInsideCircle(n, {x, y, r: poiRadius})) {
        intervalsXY.push({x, y});
      }
    });
  });

  while (intervalsXY.length > 0) {
    const randomXYIndex = Math.floor(Math.random() * intervalsXY.length);
    const intervalXY = intervalsXY.splice(randomXYIndex, 1);
    const randomCircle = {x: intervalXY[0].x, y: intervalXY[0].y, r: poiRadius};

    let collision = false;

    for (var i = 0; i < n.pois.length; i++) {
      if (circleCollideCircle(randomCircle, n.pois[i])) {
        collision = true;
        //break;
      }
    }

    if (collision === false) {
      n.pois.push(randomCircle);
      break;
    }
  }
}

function generateNodeIndex() {
  if ( typeof generateNodeIndex.counter == 'undefined' ) {
      generateNodeIndex.counter = 0;
  }

  return ++generateNodeIndex.counter;
}


function edgeCollideCircle(x1, y1, x2, y2, c) {
  const inside1 = pointInCircle(x1, y1, c.x, c.y, c.r);
  const inside2 = pointInCircle(x2, y2, c.x, c.y, c.r);
  if (inside1 || inside2) return true;

  let distX = x1 - x2;
  let distY = y1 - y2;
  const len = Math.sqrt( (distX * distX) + (distY * distY) );

  const dot = ( ((c.x - x1) * (x2 - x1)) + ((c.y - y1) * (y2 - y1)) ) / (len * len);
  const closestX = x1 + (dot * (x2 - x1));
  const closestY = y1 + (dot * (y2 - y1));

//  drawFilledCircle(
//    screenX + offsetScreenX + closestX, screenY + offsetScreenY + closestY, 4, 'purple');

  const onSegment = pointOnLine(x1, y1, x2, y2, closestX, closestY);
  if (!onSegment) return false;

  distX = closestX - c.x;
  distY = closestY - c.y;
  const distance = Math.sqrt( (distX * distX) + (distY * distY) );

  if (distance <= c.r) {
    return true;
  }
  return false;
}

function circleInsideCircle(c1, c2) {
  let distX = c1.r - c2.x;
  let distY = c1.r - c2.y;
  const len = Math.sqrt( (distX * distX) + (distY * distY) );
  return len < (c1.r - c2.r);
}

function circleCollideCircle(c1, c2) {
  let distX = c1.x - c2.x;
  let distY = c1.y - c2.y;
  const len = Math.sqrt( (distX * distX) + (distY * distY) );
  return len < (c1.r + c2.r);
}

function pointOnLine(x1, y1, x2, y2, closestX, closestY) {
  const nX = x2 - x1;
  const nY = y2 - y1;
  const len = Math.sqrt(nX * nX + nY * nY);

  const c1X = closestX - x1;
  const c1Y = closestY - y1;
  const len1 = Math.sqrt(c1X * c1X + c1Y * c1Y);

  const c2X = closestX - x2;
  const c2Y = closestY - y2;
  const len2 = Math.sqrt(c2X * c2X + c2Y * c2Y);

  const buffer = 0.1;

  if (len1 + len2 >= len - buffer && len1 + len2 <= len + buffer) {
    return true;
  }
  return false;

  return (len1 + len2) < len;
}

function pointInCircle(x, y, cX, cY, cR) {
  const nX = x - cX;
  const nY = y - cY;

  return Math.sqrt(nX * nX + nY * nY) < cR;
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}
