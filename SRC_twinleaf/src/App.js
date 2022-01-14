import './Twinleaf.css';
import { useEffect, useRef, useState } from 'react';

import { DEFAULT_SHADER_TEXT } from './constants.js';
import { PRESET_SHADER_MAP } from './presets.js';
import { serializeWorkspace, loadWorkspace } from './utils.js';
import ShaderCanvas from './ShaderCanvas.js';
import ShaderVariableDisplay from './ShaderVariableDisplay.js';

import AceEditor from "react-ace";

import 'ace-builds/webpack-resolver';

import leaf from './leaf.png';
import upload from './upload.png';

let DEFAULT_VALUE_FROM_VARIABLE_TYPE = {
  'vec2': [0, 0],
  'vec3': [0, 0, 0],
  'vec4': [0, 0, 0, 0],
  'float': 0,
};

let findVariablesInText = (text, existingVariables) => {
  let variableMatch = /^uniform *([\w.]+) *(.*);$/;

  let results = []
  for (let line of text.split('\n')) {
    var m = line.match(variableMatch);
    if (!m) {
      continue
    }

    let valueToAssign = m[1] in DEFAULT_VALUE_FROM_VARIABLE_TYPE ? DEFAULT_VALUE_FROM_VARIABLE_TYPE[m[1]] : null;
    for (let i = 0; i < existingVariables.length; ++i) {
      console.log(existingVariables[i][1], " / ", m[1], " / ", (existingVariables[i][1] != m[1]))
      if (existingVariables[i][1] != m[1]) {
        continue
      }
      valueToAssign = existingVariables[i][2]
    }
    results.push([m[1], m[2], valueToAssign])
  }
  return results
};

function Twinleaf() {
  let [ images, setImages ] = useState(new Array(8).fill(null))
  let [ variables, setVariables ] = useState([])
  let [ editorText, setEditorText ] = useState('')

  const aceEditorRef = useRef(null);

  let handleImageUpload = (index, file) => {
    let reader = new FileReader();
    reader.onload = (evt) => {
        let image = new Image();
        image.src = evt.target.result;
        image.onload = () => {
          let newImages = Array.from(images)
          newImages[index] = image
          console.log("set index " + index + " to " + image.src.length);
          setImages(newImages);
        }
    };
    reader.readAsDataURL(file);
  }

  let downloadWorkspace = () => {
    let serialized = serializeWorkspace(editorText, images, variables)

    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + serialized);
    element.setAttribute('download', 'workspace.txt');
  
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  let uploadWorkspace = (f) => {
    let workspace = loadWorkspace(f)
    console.log(workspace)

    setEditorText(workspace[0])
    setImages([...workspace[1], ...new Array(8 - workspace[1].length).fill(null)])
    setVariables(workspace[2])
  }

  useEffect(() => {
    setEditorText(DEFAULT_SHADER_TEXT)
    setVariables(findVariablesInText(DEFAULT_SHADER_TEXT, variables))
  }, [])

  return (<>
    <nav>
      <img src={leaf} style={{width: '50px'}} /> Twinleaf

      <div className="nav-button download" onClick={() => { downloadWorkspace(); }}>
       Download workspace
      </div>
      <div className="nav-button upload">
        <input type="file" name="workspace" accept="text/*" onChange={(e) => {
          if (e.target.files.length > 0) {
            var r = new FileReader();
            r.onload = (evt) => { uploadWorkspace(evt.target.result); }
            r.readAsText(e.target.files[0], "UTF-8");
          }
        }} />
        Upload workspace
      </div>
      
      <div style={{textAlign: 'center', margin: '20px 0px'}}>
              <b>Presets: </b>
              <select name="preset" id="preset" onChange={(e) => {
                setEditorText(PRESET_SHADER_MAP[e.target.value]);
                setVariables(findVariablesInText(PRESET_SHADER_MAP[e.target.value], variables))
              }}>
                  <option value="default">default</option>
                  <option value="threecolor">three color channel</option>
                  <option value="paletteswap">palette swap</option>
                  <option value="golden">golden</option>
                  <option value="rainbow">rainbow noise</option>
              </select>
          </div>
    </nav>
    <div className="two-column">
        <AceEditor
         mode='java'
         theme='monokai'
         name='editor'
         width='50%'
         height='auto'
         value={editorText}
         onChange={(t, evt) => {
           setEditorText(t)
           setVariables(findVariablesInText(t, variables))
         }}
         />
        <div>
          <div style={{textAlign: 'center'}}>
          {images.map((img, i) => (
              <div className={"img-thumbnail" + (img == null ? " no-image" : "")} key={"thumb_" + i}>
                  {img != null ? <img src={images[i].src} /> : <img src={upload} />}
                  <input className="img-upload" type="file" id="img" name="img" accept="image/*" onChange={(e) => {
                    if (e.target.files.length > 0) {
                      handleImageUpload(i, e.target.files[0]);
                    }
                  }} />
              </div>
          ))}
          </div>
          <ShaderVariableDisplay variables={variables} setVariables={setVariables} />
          <div className="shader-canvas-container">
            <ShaderCanvas
             frag={editorText}
             images={images}
             otherUniforms={variables.map(k => [k[1], k[2]])} />
          </div>
          <div>{JSON.stringify(variables.map(i => [i[1], i[2]]).filter(i => i[1] != null))}</div>
        </div>
    </div>
  </>)
}

export default Twinleaf;

