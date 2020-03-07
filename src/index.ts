import { mat4 } from 'gl-matrix';
import { glMatrix } from 'gl-matrix';
import GLTFLoader from './GLTFLoader';
import WebGLRenderer from './webgl/WebGLRenderer';
import example from '../assets/example.gltf';
import box from '../assets/box.gltf';
import { Mesh } from './Mesh';

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

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 1);

let rotation = 0;
let lastTime: DOMHighResTimeStamp | null = null;

const renderer = new WebGLRenderer(gl);
renderer.wireframe = true;

function render3(mesh: Mesh): void {
    const transform = mat4.create();
    function render2(currentTime: DOMHighResTimeStamp): void {
        rotation += lastTime ? (currentTime - lastTime) * 0.01 : 0;

        mat4.fromYRotation(transform, glMatrix.toRadian(rotation));
        renderer.render(mesh, transform);

        lastTime = currentTime;
        requestAnimationFrame(render2);
    }

    render2(performance.now());
}

new GLTFLoader().load(box).then(mesh => {
    render3(mesh);
});
