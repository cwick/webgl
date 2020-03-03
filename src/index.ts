import GLShader from './GLShader';
import GLProgram from './GLProgram';
import GLBuffer from './GLBuffer';
import GLVertexArrayObject from './GLVertexArrayObject';
import { mat4 } from 'gl-matrix';
import { glMatrix } from 'gl-matrix';

const canvasElement = document.createElement('canvas');
canvasElement.width = 800;
canvasElement.height = 600;
document.body.append(canvasElement);

const gl = canvasElement.getContext('webgl2');
if (!gl) {
    console.error('WebGL 2.0 not available');
}

const vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
in vec4 a_color;
uniform mat4 u_transform;

out vec4 v_color;
 
// all shaders have a main function
void main() {
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = u_transform * vec4(a_position,0,1);
  
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
const transformLocation = program.getUniformLocation('u_transform');
const positionData: number[] = [];
const colorData: number[] = [];

function randomColor(): number {
    return Math.round(Math.random() * 255);
}

for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
        // Make a square
        positionData.push(
            row,
            column,
            row + 1,
            column,
            row + 1,
            column + 1,
            row,
            column,
            row + 1,
            column + 1,
            row,
            column + 1,
        );
        // Color the square
        for (let i = 0; i < 6; i++) {
            colorData.push(randomColor(), randomColor(), randomColor());
        }
    }
}

const positionBuffer = new GLBuffer(gl);
const colorBuffer = new GLBuffer(gl);
positionBuffer.floatBufferData(positionData);
colorBuffer.byteBufferData(colorData);

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

program.use();
const transform = mat4.fromTranslation(mat4.create(), [-4, -4, -16]);
mat4.multiply(transform, transform, mat4.fromXRotation(mat4.create(), glMatrix.toRadian(-45)));

const perspective = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45 * (gl.canvas.height / gl.canvas.width)),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100,
);
gl.uniformMatrix4fv(transformLocation, false, mat4.multiply(mat4.create(), perspective, transform));
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Clear the canvas
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

const primitiveType = gl.TRIANGLES;
const count = positionData.length / 2;
gl.drawArrays(primitiveType, 0, count);
