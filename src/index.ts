import GLShader from './webgl/GLShader';
import GLProgram from './webgl/GLProgram';
import GLBuffer from './webgl/GLBuffer';
import GLVertexArrayObject from './webgl/GLVertexArrayObject';
import { mat4 } from 'gl-matrix';
import { glMatrix } from 'gl-matrix';
import GLTFLoader from './GLTFLoader';

const canvasElement = document.createElement('canvas');
canvasElement.width = 800;
canvasElement.height = 600;
document.body.append(canvasElement);

function getGLContext(): WebGL2RenderingContext {
    const gl = canvasElement.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL 2.0 not available');
    }
    return gl;
}
const gl = getGLContext();

const vertexShaderSource = `#version 300 es
 
in vec2 a_position;
in vec4 a_color;
uniform mat4 u_transform;
uniform mat4 u_projection;

out vec4 v_color;
 
void main() {
  gl_Position = u_projection * u_transform * vec4(a_position,0,1);
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;
 
out vec4 outColor;
in vec4 v_color;
 
void main() {
    outColor = vec4(gl_FragCoord.x / 800.0, gl_FragCoord.y / 600.0, 1, 1.0);
//   outColor = v_color;
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
const projectionLocation = program.getUniformLocation('u_projection');
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

const perspective = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45 * (gl.canvas.height / gl.canvas.width)),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100,
);
gl.uniformMatrix4fv(projectionLocation, false, perspective);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 1);

let rotation = 0;
let lastTime: DOMHighResTimeStamp | null = null;

function render(currentTime: DOMHighResTimeStamp): void {
    rotation += lastTime ? (currentTime - lastTime) * 0.1 : 0;

    gl.clear(gl.COLOR_BUFFER_BIT);

    const transform = mat4.fromTranslation(mat4.create(), [-4, -4, 0]);
    mat4.multiply(transform, mat4.fromXRotation(mat4.create(), glMatrix.toRadian(rotation)), transform);
    mat4.multiply(transform, mat4.fromTranslation(mat4.create(), [0, 0, -15]), transform);
    gl.uniformMatrix4fv(transformLocation, false, transform);

    const primitiveType = gl.TRIANGLES;
    const count = positionData.length / 2;
    gl.drawArrays(primitiveType, 0, count);

    lastTime = currentTime;
    requestAnimationFrame(render);
}

new GLTFLoader().load();

render(performance.now());
