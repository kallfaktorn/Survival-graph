
var locations = [];

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
