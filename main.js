

$(document).ready(function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';

  const NODE_RADIUS = 60;
  const DEGREES_IN_CIRCLE = 360;

  let screenX = 0;
  let screenY = 0;
  let offsetScreenX = 0;
  let offsetScreenY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let scale = 1.0;
  let cameraX = 0;
  let cameraXY = 0;

  const locations = [];
  const player = {};

  let mouseDown = 0;

  let traveling = false;

  const firstNode = generateFirstNode();
  let selectedLocation = undefined;
  let traverseIndex = 0;

  explore();
  drawScene();

  $( "body" ).keypress(function( event ) {
    if (traveling) {
      switch(event.which) {
        case 44:
        event.preventDefault();
        traverseLeft();
        break;
        case 46:
        event.preventDefault();
        traverseRight();
        break;
        case 13:
        event.preventDefault();
        updatePlayerLocation();
        break;
      }
    } else {
      switch(event.which) {
        case 13:
        event.preventDefault();
        explore();
        break;
        case 97:
        event.preventDefault();
        zoomIn();
        break;
        case 122:
        event.preventDefault();
        zoomOut();
        break;
        case 116:
        event.preventDefault();
        travel();
        break;
      }
    }
  });

  $(document).mousemove(function(event) {
    if (mouseDown) {
      offsetScreenX = (event.pageX - mouseX) / scale;
      offsetScreenY = (event.pageY - mouseY) / scale;
    }
    drawScene();
  });

  $(document).mousedown(function(event) {
    if (!mouseDown) {
      mouseX = event.pageX;
      mouseY = event.pageY;
    }
    ++mouseDown;
  });

  $(document).mouseup(function() {
    --mouseDown;

    if (!mouseDown) {
      screenX = screenX + offsetScreenX;
      screenY = screenY + offsetScreenY;
      offsetScreenX = 0;
      offsetScreenY = 0;
    }
  });

  function updatePlayerLocation() {
    traveling = false;
    player.location = selectedLocation;
    drawScene();
  }

  function updateSelectedLocation() {
    const neighboursLength = player.location.neighbours.length;
    let index = Math.abs(traverseIndex) % neighboursLength;
    if (traverseIndex < 0) {
      index = neighboursLength - index;
      if (index === neighboursLength) {
        index = 0;
      }
    }
    selectedLocation = player.location.neighbours[index];
  }

  function traverseLeft() {
    if (traveling) {
      --traverseIndex;
      updateSelectedLocation()
      drawScene();
    }
  }

  function traverseRight() {
    if (traveling) {
      ++traverseIndex;
      updateSelectedLocation()
      drawScene();
    }
  }

  function travel() {
    traveling = true;
    traverseIndex = 0;
    selectedLocation = player.location.neighbours[traverseIndex];
    drawScene();
  }

  function zoomIn() {
    scale *= 0.5;
    screenX += canvas.width / scale / 4;
    screenY += canvas.height / scale / 4;
    drawScene();
  }

  function zoomOut() {
    scale *= 2;
    screenX -= canvas.width / scale / 2;
    screenY -= canvas.height / scale / 2;
    drawScene();
  }

  function drawScene() {
    cameraX = canvas.width / 2 * scale;
    cameraY = canvas.height / 2 * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFilledCircle(
      screenX + offsetScreenX + firstNode.x, screenY + offsetScreenY + firstNode.y, NODE_RADIUS * 10, 'yellow');
    locations.forEach((loc, i) => {
      drawCircle(screenX + offsetScreenX + loc.x, screenY + offsetScreenY + loc.y);
    });

    drawCenteredText(screenX + offsetScreenX, screenY + offsetScreenY, 'Hello');
    drawFilledCircle(screenX + offsetScreenX, screenY + offsetScreenY, 4, 'blue');

    const pairs = findPairs();
    pairs.forEach((pair, i) => {
      const edge = computeEdgeBetweenNodes(pair[0], pair[1]);
      drawEdge(edge.x1, edge.y1, edge.x2, edge.y2)
    });

    locations.forEach((loc, i) => {
      drawFilledCircle(screenX + offsetScreenX + loc.x, screenY + offsetScreenY + loc.y, NODE_RADIUS, 'white');
    });

    if (traveling) {
      player.location.neighbours.forEach((loc, i) => {
        drawFilledCircle(
          screenX + offsetScreenX + loc.x,
          screenY + offsetScreenY + loc.y,
          NODE_RADIUS, 'yellowgreen'
        );
      });
      drawFilledCircle(
        screenX + offsetScreenX + selectedLocation.x,
        screenY + offsetScreenY + selectedLocation.y,
        NODE_RADIUS, 'lightgreen'
      );
    }

    drawFilledCircle(
      screenX + offsetScreenX + player.location.x,
      screenY + offsetScreenY + player.location.y,
      NODE_RADIUS, 'green'
    );
  }

  function findPairs() {
    const pairs = [];

    locations.forEach((location, i) => {
      location.neighbours.forEach((neighbour, i) => {
        if (!existsPair(location, neighbour, pairs)) {
          pairs.push([location, neighbour]);
        }
      });
    });

    return pairs;
  }

  function existsPair(n1, n2, pairs) {
    pairs.forEach((pair, i) => {
      if ((pair[0] === n1 && pair[1] === n2)
      || (pair[0] === n2 && pair[1] === n1)) {
        return true;
      }
    });

    return false;
  }

  function drawCenteredText(x, y, text) {
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
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

  function drawEdge(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(scale * (offsetScreenX + screenX + x1), scale * (offsetScreenY + screenY + y1));
    ctx.lineTo(scale * (offsetScreenX + screenX + x2), scale * (offsetScreenY + screenY + y2));
    ctx.stroke();
  }

  function drawCircle(x, y) {
    ctx.beginPath();
    ctx.arc(scale * x, scale * y, scale * NODE_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();
  }

  function drawFilledCircle(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(scale * x, scale * y, scale * r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = 'black';
  }

  function explore() {
    const node = player.location;
    generateLocation(node);
    drawScene();
  }

  function locationCollitions(l, ls) {
    let collision = false;

    ls.forEach((ln, i) => {
      if (nodeCollition(l, ln)) {
        collision = true;
      }
    });

    return collision;
  }

  function edgeCollideLocations(n1, n2, ls) {
    let collision = false;
    const e = computeEdgeBetweenNodes(n1, n2);

    ls.forEach((ln, i) => {
      if (edgeCollideCircle(e.x1, e.y1, e.x2, e.y2, ln)) {
        collision = true;
      }
    });

    return collision;
  }

  function nodeCollition(n1, n2) {
    const x = n2.x - n1.x;
    const y = n2.y - n1.y;

    return (x * x + y * y) < ((n1.r + n2.r) * (n1.r + n2.r))
  }

  function generateLocation() {
    const node = player.location;
    const offsetX = node.x;
    const offsetY = node.y;
    let distanceBetweenNodeCenters = node.r * 3;

    let radius = NODE_RADIUS;
    let locationAdded = false

    while((distanceBetweenNodeCenters < (NODE_RADIUS * 10)) && !locationAdded) {
      let degrees = [...Array(365).keys()].map(i => i + 1);

      while (degrees.length > 0 && !locationAdded) {
        const index = Math.floor(Math.random() * degrees.length);
        const randomDegree = degrees.splice(index, 1);
        const randomRadian = degreesToRadians(randomDegree);

        const newNodeX = Math.cos(randomRadian) * distanceBetweenNodeCenters + offsetX;
        const newNodeY = Math.sin(randomRadian) * distanceBetweenNodeCenters + offsetY;
        const newNode = generateNode(newNodeX, newNodeY, NODE_RADIUS);

        if (!locationCollitions(newNode, locations) && !edgeCollideLocations(node, newNode, locations)) {
          locations.push(newNode);
          node.neighbours.push(newNode);
          newNode.neighbours.push(node);
          locationAdded = true;
        }
      }
      distanceBetweenNodeCenters += node.r * 3;
    }
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

    drawFilledCircle(
      screenX + offsetScreenX + closestX, screenY + offsetScreenY + closestY, 4, 'purple');

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

  function generateNodeIndex() {
    if ( typeof generateNodeIndex.counter == 'undefined' ) {
        generateNodeIndex.counter = 0;
    }

    return ++generateNodeIndex.counter;
  }

  function generateNode(x, y, r) {
    return { group: 'node', index: generateNodeIndex(), x, y, r, neighbours: [] };
  }

  function generateFirstNode() {
    const firstNodeX = 340;
    const firstNodeY = 340;
    const node = generateNode( firstNodeX, firstNodeY, NODE_RADIUS );
    locations.push( node );
    player.location = node;
    return node;
  }
});
