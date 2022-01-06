
window.onload = () => {
  let imageElement = document.querySelector('#img')

  var grid;
  var image = null;
  var displayImage = null;

  var state = 'awaitingPaste'

  function setInstructionsText(text) {
    var i = document.querySelector('#instructions')
    i.innerHTML = text

    var d = document.querySelector('.div_instructions')
    d.classList.remove('animated')
    d.classList.remove('bounce')
    void d.offsetWidth;
    d.classList.add('animated')
    d.classList.add('bounce')
  }

  function parseGrid(image) {
    let origMat = cv.imread(image)
    let mat = new cv.Mat();

    cv.cvtColor(origMat, mat, cv.COLOR_BGR2GRAY, 0)
    cv.threshold(mat, mat, 214, 255, cv.THRESH_BINARY)

    let contours = new cv.MatVector()
    let hierarchy = new cv.Mat()

    let dst = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3);

    cv.findContours(mat, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    let contoursList = []
    for (let i = 0; i < contours.size(); ++i) {
      let contour = contours.get(i)
      let bounds = cv.boundingRect(contour)

      if (3.3 * bounds.width < 2 * bounds.height ||
          3.3 * bounds.height < 2 * bounds.width) {
        continue;
      }
      if (cv.contourArea(contour) < 5) {
        continue;
      }
      if (cv.contourArea(contour) < 0.65 * (bounds.width * bounds.height)) {
        continue;
      }
      contoursList.push(contour)
    }

    let medianArea = contoursList.map(c => cv.contourArea(c))
                                 .sort((a, b) => a - b)
                                   [Math.floor(contoursList.length / 2)]
    let medianPerim = contoursList.map(c => cv.arcLength(c, true))
                                  .sort((a, b) => a - b)
                                   [Math.floor(contoursList.length / 2)]
    let side = medianPerim / 4

    contoursList = contoursList.filter(c =>
          Math.abs(cv.contourArea(c) - medianArea) <= 0.5 * medianArea
       && Math.abs(cv.arcLength(c, true) - medianPerim) < 0.5 * medianPerim)

    let contoursRects = contoursList.map(c => cv.boundingRect(c))

    let cx = contoursRects.map(c => c.x).sort((a, b) => a - b)
    let cy = contoursRects.map(c => c.y).sort((a, b) => a - b)

    let lowerBoundsX = []
    let lowerBoundsY = []
    let lastX = -9999999
    let lastY = -9999999

    for (let x of cx) {
      if (x - lastX > side / 2) {
        lowerBoundsX.push(x)
      }
      lastX = x
    }
    for (let y of cy) {
      if (y - lastY > side / 2) {
        lowerBoundsY.push(y)
      }
      lastY = y
    }

    let grid = Array.apply(null, Array(lowerBoundsY.length)).map(
      r => Array.apply(null, Array(lowerBoundsX.length)).map(c => new Object()))
    
    for (let i = 0; i < contoursRects.length; ++i) {
      let col = 0
      let row = 0
      while (col < lowerBoundsX.length && lowerBoundsX[col + 1] <= contoursRects[i]['x'] + 0.001) {
        ++col
      }
      while (row < lowerBoundsY.length && lowerBoundsY[row + 1] <= contoursRects[i]['y'] + 0.001) {
        ++row
      }
      grid[row][col] = {x: contoursRects[i]['x'],
                        y: contoursRects[i]['y'],
                        width: contoursRects[i]['width'],
                        height: contoursRects[i]['height'],
                        index: i,
                        border: []}
    }

    let avgDistance = 0.0;
    let numAdjacentSquares = 0;

    for (let r = 0; r < grid.length; ++r) {
      for (let c = 0; c < grid[r].length; ++c) {
        if (!grid[r][c]['border']) {
          continue;
        }

        let roi = new cv.Rect(grid[r][c]['x'], grid[r][c]['y'], grid[r][c]['width'], grid[r][c]['height']);
        let dest = origMat.roi(roi);
        let mean = cv.mean(dest);
        grid[r][c]['color'] = cv.mean(dest);

        if (r < grid.length - 1 && 'border' in grid[r+1][c]) {
            numAdjacentSquares += 1;
            avgDistance += (grid[r+1][c].y - (grid[r][c].y + grid[r][c].height));
        }
        if (c < grid[r].length - 1 && 'border' in grid[r][c+1]) {
            numAdjacentSquares += 1;
            avgDistance += (grid[r][c+1].x - (grid[r][c].x + grid[r][c].width));
        }
      }
    }
    avgDistance /= numAdjacentSquares;

    let nextClueNumber = 1;

    for (let r = 0; r < grid.length; ++r) {
      for (let c = 0; c < grid[r].length; ++c) {
        if (!grid[r][c]['border']) {
          continue;
        }
        let border = grid[r][c]['border']
        if (r == 0) border.push('top')
        if (r == grid.length - 1) border.push('bottom')
        if (c == 0) border.push('left')
        if (c == grid[r].length - 1) border.push('right')

        if (r < grid.length - 1 &&
            (grid[r+1][c].y - (grid[r][c].y + grid[r][c].height)) > avgDistance + 1) {
          border.push('bottom');
          if ('border' in grid[r+1][c]) {
              grid[r+1][c]['border'].push('top');
          }
        }
        if (c < grid[r].length - 1 &&
            (grid[r][c+1].x - (grid[r][c].x + grid[r][c].width)) > avgDistance + 1) {
          border.push('right');
          if ('border' in grid[r][c+1]) {
              grid[r][c+1]['border'].push('left');
          }
        }

        let topPathable = (border.indexOf('top') == -1 && r > 0 && 'border' in grid[r-1][c]);
        let botPathable = (border.indexOf('bottom') == -1 &&
                             r < grid.length - 1 &&
                             'border' in grid[r+1][c]);
        let leftPathable = (border.indexOf('left') == -1 && c > 0 && 'border' in grid[r][c-1]);
        let rightPathable = (border.indexOf('right') == -1 &&
                               c < grid[r].length - 1 &&
                               'border' in grid[r][c+1]);

        if ((!leftPathable && rightPathable) || (!topPathable && botPathable)) {
            grid[r][c]['clueNumber'] = nextClueNumber++;
        }
      }
    }

    /*for (let i = 0; i < contoursRects.length; ++i) {

      let color = new cv.Scalar(Math.round(255),
                                Math.round(Math.random() * 255),
                                Math.round(Math.random() * 255))
      let z = new cv.MatVector()
      z.push_back(contoursList[i])
      cv.drawContours(dst, z, -1, color, 1, cv.LINE_8)
    }
    cv.imshow('out', dst)*/

    return grid
  }

  function getBorderStyle(gridCell, borderWidth) {
    if (!gridCell['border']) {
      return 'background-color: #000000;'
    }

    let style = []

    let border = gridCell['border']
    for (let side of border) {
      style.push('border-' + side + ':' + borderWidth + 'px solid black;')
    }

    return style.join(' ')
  }

  function rgbToHex(c) {
      return "#" + ((1 << 24) + (c[0] << 16) + (c[1] << 8) + c[2]).toString(16).slice(1);
  }

  function generateTable(grid, borderWidth) {
    let html = String.raw`<table xmlns="http://www.w3.org/1999/xhtml"
           style="width: 0px; border-collapse: collapse; border: none;">
      <tbody>`

    for (let r = 0; r < grid.length; ++r) {
      html += '<tr>'

      for (let c = 0; c < grid[r].length; ++c) {
        let clue = ('clueNumber' in grid[r][c] ? grid[r][c]['clueNumber'].toString() : '');
        let colorHtml  = ('color' in grid[r][c] && grid[r][c]['color'][0] + grid[r][c]['color'][1] + grid[r][c]['color'][2] < 720 ?
                          'background-color: ' + rgbToHex(grid[r][c]['color']) + '; ' :
                          '')
        html += '<td valign="top" style="' + getBorderStyle(grid[r][c], borderWidth) +
          colorHtml + '" ' +
          'data-sheets-value="{' + clue + '}">'
        html += clue;
        html += '</td>';
      }

      html += '</tr>'
    }

    html += String.raw`
      </tbody>
    </table>`

    return html
  }

  function generateAndCopyTable(e, grid) {
    e.preventDefault()

    let html = String.raw`<html>
    <body>
    <meta name="generator" content="Sheets"/>`

    html += generateTable(grid, 3.0)
    
    let clipboardData = (e.clipboardData || e.originalEvent.clipboardData)
    let text = ''

    clipboardData.setData('text/plain', text)
    clipboardData.setData('text/html', html)

    setInstructionsText('Copied to clipboard!')
  }

  // Taken from https://stackoverflow.com/questions/490908/paste-an-image-from-clipboard-using-javascript
  readImage = function(e) {
    let clipboardData = (e.clipboardData || e.originalEvent.clipboardData)
    let items = clipboardData.items

    for (i in items) {
      let item = items[i]
      if (item.kind === 'file') {
        var blob = item.getAsFile()
        var reader = new FileReader()
        if (image !== null) {
          image.parentNode.removeChild(image)
        }
        if (displayImage !== null) {
          displayImage.parentNode.removeChild(displayImage)
        }
        reader.onload = function(e) { 
          displayImage = document.createElement('img')
          displayImage.classList.add('animated')
          displayImage.classList.add('fadeInDown')
          displayImage.src = e.target.result
          displayImage.onload = function(e) {
            if (displayImage.width > 300) {
              displayImage.width = 300
            }
          }
          document.querySelector('#imageContainer').appendChild(displayImage)

          image = document.createElement('img')
          image.src = e.target.result
          image.style = 'opacity: 0; position: absolute;'
          document.body.appendChild(image)
          image.onload = function(e) {
            grid = parseGrid(image)
            state = 'imageLoaded'
            document.querySelector('#tableContainer').innerHTML =
              generateTable(grid, 1.5)
            let table = document.querySelector('#tableDisplay table')
            table.classList.add('animated')
            table.classList.add('fadeInDown')
            let scale = (image.width > 300 ? 300 / image.width : 1);
            let longestSide = Math.max(grid.length, grid[0].length);
            let fontSize = (longestSide <= 8 ? 0.75 : longestSide <= 15 ? 0.6 : 0.5);
            table.style =
              'width: ' + (scale * image.width) +
              '; height: ' + (scale * image.height) + '; margin: auto; font-size: ' + fontSize + 'rem;';
            setInstructionsText('Copy to your clipboard! (Ctrl-C)')
            document.querySelector('#copyPasteBox').select()
          }
        }
        reader.readAsDataURL(blob)
      }
    }
  }

  document.querySelector('#instructions').innerHTML =
    'Paste an image of the crossword to parse! (Ctrl-V)'

  document.querySelector('#copyPasteBox').select()

  document.querySelector('#copyPasteBox').onpaste = function(e) {
    readImage(e)
  }

  document.querySelector('#copyPasteBox').oncopy = function(e) {
    if (state === 'imageLoaded') {
      generateAndCopyTable(e, grid)
    }
  }

  document.body.onclick = () => {
    document.querySelector('#copyPasteBox').select()
  }
}


