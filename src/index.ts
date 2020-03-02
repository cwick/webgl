import GLShader from './GLShader';
import GLProgram from './GLProgram';
import GLBuffer from './GLBuffer';
import GLVertexArrayObject from './GLVertexArrayObject';

const canvasElement = document.createElement('canvas');
document.body.append(canvasElement);

const gl = canvasElement.getContext('webgl2');
if (!gl) {
    console.error('WebGL 2.0 not available');
}

const vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

out vec4 v_color;
 
// all shaders have a main function
void main() {
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
in vec4 v_color;
 
void main() {
  outColor = v_color;
}
`;

const vertexShader = new GLShader(gl, gl.VERTEX_SHADER);
vertexShader.compile(vertexShaderSource);

const fragmentShader = new GLShader(gl, gl.FRAGMENT_SHADER);
fragmentShader.compile(fragmentShaderSource);

const program = new GLProgram(gl);
program.link(vertexShader, fragmentShader);

const positionAttributeLocation = program.getAttribLocation('a_position');
const colorAttributeLocation = program.getAttribLocation('a_color');
const positionBuffer = new GLBuffer(gl);

// three 2d points
positionBuffer.floatBufferData([0, 0, 0, 0.5, 0.7, 0]);

const colorBuffer = new GLBuffer(gl);
colorBuffer.byteBufferData([255, 0, 0, 0, 255, 0, 0, 0, 255]);

const vao = new GLVertexArrayObject(gl);
vao.vertexAttribPointer(
    positionBuffer,
    positionAttributeLocation,
    2, // size
    gl.FLOAT, // type,
    false, // normalize,
    0, // stride
    0, // offset
);

vao.vertexAttribPointer(
    colorBuffer,
    colorAttributeLocation,
    3, // size
    gl.UNSIGNED_BYTE, // type,
    true, // normalize,
    0, // stride
    0, // offset
);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Clear the canvas
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

// Tell it to use our program (pair of shaders)
program.use();

const primitiveType = gl.TRIANGLES;
const count = 3;
gl.drawArrays(primitiveType, 0, count);
