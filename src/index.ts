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
let mesh: Mesh;

(function(): void {
    const transform = mat4.create();
    function render(currentTime: DOMHighResTimeStamp): void {
        rotation += lastTime ? (currentTime - lastTime) * 0.01 : 0;

        mat4.fromYRotation(transform, glMatrix.toRadian(rotation));
        if (mesh) {
            renderer.render(mesh, transform);
        }

        lastTime = currentTime;
        requestAnimationFrame(render);
    }

    render(performance.now());
})();

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

    select.addEventListener('change', async () => {
        const name = select.selectedOptions[0].value;
        const file = await fetch(
            `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/${name}/glTF-Embedded/${name}.gltf`,
        );
        new GLTFLoader().load(await file.json()).then(m => {
            mesh = m;
        });
    });
    document.body.appendChild(select);
})();
