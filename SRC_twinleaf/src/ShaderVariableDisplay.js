import './Twinleaf.css';

function colorArrayToHexString(colorArray) {
  return '#' + colorArray.map(k => Math.floor(255 * parseFloat(k)).toString(16).padStart(2, '0')).join('')
}

function hexIntensityToDecimal(intensity) {
  return Math.round(100.0 * parseInt(intensity, 16) / 255.0) / 100.0
}

function hexStringToColorArray(colorStr) {
  return [
    hexIntensityToDecimal(colorStr.substring(1, 3)),
    hexIntensityToDecimal(colorStr.substring(3, 5)),
    hexIntensityToDecimal(colorStr.substring(5, 7)),
  ];
}

function ShaderVariableDisplay(props) {
  let { variables, setVariables } = props

  let setVariableAtIndex = (index, value) => {
    let newVariables = [...variables];
    newVariables[index] = [newVariables[index][0], newVariables[index][1], value]
    setVariables(newVariables)
  }

  let displaySelectorForType = (v, i) => {
    if (v[0] == "vec3") {
      return <>
        <b>{v[1]}</b> <input type="color" value={colorArrayToHexString(v[2])} onChange={(e) => {
          setVariableAtIndex(i, hexStringToColorArray(e.target.value));
        }} />
      </>
    }

    return <></>
  }

  return (
    <div className="two-column">
      {variables.map((v, i) => (
        <div key={i}>
          {displaySelectorForType(v, i)}
        </div>
      ))}
    </div>
  )
}

export default ShaderVariableDisplay;