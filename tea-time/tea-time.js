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
      let glslEditor = new GlslEditor('#glsl_editor', { 
        canvas_size: 500,
        canvas_draggable: false,
        theme: 'monokai',
        multipleBuffers: true,
        watchHash: true,
        menu: false,
        frag: THREE_CHANNEL_TEXT,
      });
      this.setState({
          canvas: glslEditor.shader.canvas,
          glslEditor,
      });

      // Disgusting hack because glslEditor has no flexibility or support
      // for anything other than fixed-position canvas
      // I'm surprised the editor itself (which is all I wanted) is so tightly
      // coupled to the strange canvas behavior
      let targetCanvas = document.getElementsByClassName("ge_canvas_container")[0];
      document.getElementById("canvas_container").appendChild(targetCanvas);
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
    let { images, canvas, glslEditor } = this.state;

    canvas.load(this.state.shaderText);
  
    for (let i = 0; i < MAX_TEXTURES; ++i) {
        if (images[i] == null) {
            continue;
        }

        canvas.setUniform("u_tex" + i, images[i].src);
    }
    glslEditor.update();
  }

  render() {
    let { images, variables, glslEditor } = this.state

    return (
      <div className="two-column">
          <div id="glsl_editor"></div>
          <div>
            <div style={{textAlign: 'center'}}>
            {images.map((img, i) => (
                <div className={"img-thumbnail" + (img == null ? " no-image" : "")}>
                    {img != null ? <img src={images[i].src} /> : <img src="upload.png" />}
                    <input className="img-upload" type="file" id="img" name="img" accept="image/*" onChange={(e) => {
                        this.handleImageUpload(i, e.target.files[0]);
                    }} />
                </div>
            ))}
            </div>
            <div style={{textAlign: 'center', margin: '20px 0px'}}>
                <b>Presets: </b>
                <select name="preset" id="preset" onChange={(e) => { glslEditor.setContent(PRESET_SHADER_MAP[e.target.value]); }}>
                    <option value="threecolor">three color channel</option>
                    <option value="paletteswap">palette swap</option>
                    <option value="golden">golden</option>
                    <option value="rainbow">rainbow noise</option>
                </select>
            </div>
            <div id="canvas_container"></div>
          </div>
      </div>
    )
  }
}

const domContainer = document.querySelector('#code_container');
ReactDOM.render(e(TeaTime), domContainer);