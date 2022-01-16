import { useEffect, useRef, useState } from "react";
import GlslCanvas from "./GlslCanvas.js";

const ShaderCanvas = (props) => {
  let { images, otherUniforms, width, height } = props

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  let [sandbox, setSandbox] = useState(null);

  const resizer = (
    canvas,
    container
  ) => {
    canvas.width = container.clientWidth + window.devicePixelRatio;
    canvas.height = container.clientHeight + window.devicePixelRatio;
    canvas.style.width = container.clientWidth + "px";
    canvas.style.height = container.clientHeight + "px";
  };

  useEffect(() => {
    const node = canvasRef.current;
    const container = containerRef.current;
    setSandbox(new GlslCanvas(canvasRef.current));

    resizer(node, container);

    const handler = () => {
      if (
        node.clientWidth !== container.clientWidth ||
        node.clientHeight !== container.clientHeight
      )
        resizer(canvasRef.current, containerRef.current);
    };

    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  useEffect(() => {
    resizer(canvasRef.current, containerRef.current);
  }, [width, height]);

  useEffect(() => {
    if (sandbox == null) {
      return
    }

    sandbox.load(props.frag);
    for (let item of images.filter(k => k != null).map((k, i) => ["u_tex" + i, k.src])) {
      if (item[1] == null) {
        continue
      }

      sandbox.setUniform(item[0], item[1])
    }

  }, [props.frag, sandbox, images]);

  useEffect(() => {
    if (sandbox == null) {
      return
    }

    sandbox.load(props.frag);
    for (let item of otherUniforms) {
      if (item[1] == null) {
        continue
      }

      if (typeof item[1] == 'object') {
        sandbox.setUniform(item[0], ...item[1])
      } else {
        sandbox.setUniform(item[0], item[1])
      }
    }

  }, [props.frag, sandbox, otherUniforms]);

  return (
    <div className="shader-canvas" ref={containerRef} style={{ width, height }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default ShaderCanvas;