import { mat4 } from 'gl-matrix';
import { glMatrix } from 'gl-matrix';
import GLTFLoader from './GLTFLoader';
import WebGLRenderBackend from './webgl/WebGLRenderBackend';
import { Scene } from './Scene';
import Vue from 'vue';
import App from './App.vue';

const vue = new Vue(App);

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

let lastTime: DOMHighResTimeStamp | null = null;

const renderer = new WebGLRenderBackend(gl);
renderer.viewMatrix = mat4.fromTranslation(mat4.create(), [0, 0, -3]);
let scene: Scene;

(function(): void {
    let rotation = 0;

    function render(currentTime: DOMHighResTimeStamp): void {
        rotation += lastTime ? (currentTime - lastTime) * 0.01 : 0;
        const rootTransform = mat4.create();
        mat4.fromYRotation(rootTransform, glMatrix.toRadian(rotation));

        if (scene) {
            scene.rootNode.localMatrix = rootTransform;
            scene.render();
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
        new GLTFLoader().load(await file.json()).then(s => {
            scene?.destroy();
            scene = s;
            scene.renderBackend = renderer;
            scene.viewport = { width: gl.canvas.width, height: gl.canvas.height };
            console.log(s);
        });
    });
    document.body.appendChild(select);
})();
