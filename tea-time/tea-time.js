'use strict';

const e = React.createElement;

var hexToRgb = (hex) => {
    var bigint = parseInt(hex.substring(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return [r, g, b];
}



class TeaTime extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        shaderText: DEFAULT_SHADER_TEXT,
        images: new Array(MAX_TEXTURES).fill(null),
        variables: {
            redColor: '#ff0000',
            greenColor: '#00ff00',
            blueColor: '#0000ff',
        },
    };

    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.compileAndRenderImage = this.compileAndRenderImage.bind(this);
    this.setFragmentShaderText = this.setFragmentShaderText.bind(this);
  }

  componentDidMount() {
  }

  setFragmentShaderText = (text) => {
      const colorRegex = /varying [.*] (.*)/g
      var idx = text.search(colorRegex)

      this.setState({
          shaderText: text
      })
  }

  handleImageUpload = (index, file) => {
      let reader = new FileReader();
      reader.onload = (evt) => {
          let image = new Image();
          image.src = evt.target.result;
          image.onload = this.compileAndRenderImage;

          let newImages = Array.from(this.state.images)
          newImages[index] = image
          this.setState({ images: newImages });
      };
      reader.readAsDataURL(file);
  }

  compileAndRenderImage() {
    let { images } = this.state;

    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
      return;
    }
  
    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, [VERTEX_SHADER_TEXT, this.state.shaderText]);
    gl.useProgram(program);
  
    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
  
    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();
  
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set a rectangle the same size as the image.
    this.setRectangle(gl, 0, 0, 600, 600);
    gl.canvas.width = 600;
    gl.canvas.height = 600;
  
    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0,
    ]), gl.STATIC_DRAW);
  
    for (let i = 0; i < MAX_TEXTURES; ++i) {
        if (images[i] == null) {
            continue;
        }

        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  
        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);

        var imageLoc = gl.getUniformLocation(program, "tex" + i);
        gl.uniform1i(imageLoc, i);
    }
  
    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);
  
    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);
  
    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);
  
    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);
  
    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  
    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset);
  
    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    var l = gl.getUniformLocation(program, 'redColor');
    var red = hexToRgb(this.state.variables["redColor"]);
    gl.uniform3f(l, red[0] / 255.0, red[1] / 255.0, red[2] / 255.0);

    l = gl.getUniformLocation(program, 'greenColor');
    red = hexToRgb(this.state.variables["greenColor"]);
    gl.uniform3f(l, red[0] / 255.0, red[1] / 255.0, red[2] / 255.0);

    l = gl.getUniformLocation(program, 'blueColor');
    red = hexToRgb(this.state.variables["blueColor"]);
    gl.uniform3f(l, red[0] / 255.0, red[1] / 255.0, red[2] / 255.0);
  
    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
  
  setRectangle = (gl, x, y, width, height) => {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2,
    ]), gl.STATIC_DRAW);
  }

  render() {
    let { images, variables } = this.state

    return (
      <div>
          {images.map((img, i) => (
              <div className="img-thumbnail">
                  {img != null ? <img src={images[i].src} /> : undefined}
                  <input type="file" id="img" name="img" accept="image/*" onChange={(e) => {
                    this.handleImageUpload(i, e.target.files[0]);
                  }} />
              </div>
          ))}
          <input type="file" id="img" name="img" accept="image/*" onChange={(e) => { this.handleImageUpload(e.target.files[0]); }} />
          <canvas class="glslCanvas" id="canvas"></canvas>
          
          <div>
              Red channel: <input type="color" value={variables["redColor"]} onChange={(e) => {
              this.setState({variables: {...variables, redColor: e.target.value}});
              this.compileAndRenderImage();
            }} />
          </div>
          <div>
              Green channel: <input type="color" value={variables["greenColor"]} onChange={(e) => {
              this.setState({variables: {...variables, greenColor: e.target.value}});
              this.compileAndRenderImage();
            }} />
          </div>
          <div>
              Blue channel: <input type="color" value={variables["blueColor"]} onChange={(e) => {
              this.setState({variables: {...variables, blueColor: e.target.value}});
              this.compileAndRenderImage();
            }} />
          </div>
          <div>Variables: {JSON.stringify(variables)}</div>
          <textarea
           style={{width: "600px", height: "600px"}}
           value={this.state.shaderText}
           onChange={(e) => { this.setFragmentShaderText(e.target.value); }}>
          </textarea>
          <button onClick={(e) => { this.compileAndRenderImage(); }}>Recompile!</button>
      </div>
    )
  }
}

const domContainer = document.querySelector('#code_container');
ReactDOM.render(e(TeaTime), domContainer);