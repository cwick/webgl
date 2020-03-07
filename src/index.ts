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

async function fetchModelIndex(): Promise<Array<object>> {
    const response = await fetch(
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/model-index.json',
    );
    return response.json();
}

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

(async (): Promise<void> => {
    const modelIndex = await fetchModelIndex();
    const select = document.createElement('select');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modelIndex
        .filter((e: { variants: { [s: string]: object } }) => Boolean(e.variants['glTF-Embedded']))
        .map((e: { name: string }) => {
            const option = document.createElement('option');
            option.value = e.name;
            option.innerHTML = option.value;
            return option;
        })
        .forEach(option => {
            select.appendChild(option);
        });

    document.body.appendChild(select);
})();
