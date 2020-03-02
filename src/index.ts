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
 
// all shaders have a main function
void main() {
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`;

const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant reddish-purple
  outColor = vec4(1, 0, 0.5, 1);
}
`;

const vertexShader = new GLShader(gl, gl.VERTEX_SHADER);
vertexShader.compile(vertexShaderSource);

const fragmentShader = new GLShader(gl, gl.FRAGMENT_SHADER);
fragmentShader.compile(fragmentShaderSource);

const program = new GLProgram(gl);
program.link(vertexShader, fragmentShader);

const positionAttributeLocation = program.getAttribLocation('a_position');
const positionBuffer = new GLBuffer(gl);

// three 2d points
positionBuffer.bufferData([0, 0, 0, 0.5, 0.7, 0]);

const vao = new GLVertexArrayObject(gl, positionBuffer);
gl.enableVertexAttribArray(positionAttributeLocation);

const size = 2; // 2 components per iteration
const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
const offset = 0; // start at the beginning of the buffer
vao.vertexAttribPointer(positionAttributeLocation, size, stride, offset);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Clear the canvas
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

// Tell it to use our program (pair of shaders)
program.use();

const primitiveType = gl.TRIANGLES;
const count = 3;
gl.drawArrays(primitiveType, offset, count);
