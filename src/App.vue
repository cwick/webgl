<template>
    <div>
        <canvas ref="canvas" width="800" height="600"></canvas>

        <select v-model="selectedModel">
            <option v-for="model in models" :key="model.name" v-bind:value="model">
                {{ model.name }}
            </option>
        </select>
    </div>
</template>

<script lang="ts">
import { mat4 } from 'gl-matrix';
import Vue from 'vue';
import Component from 'vue-class-component';

import GLTFLoader from './GLTFLoader';
import WebGLRenderBackend from './webgl/WebGLRenderBackend';
import { RenderBackend } from './Scene';

interface GLTFModel {
    name: string;
    variants: { [s: string]: object };
}

@Component({
    watch: {
        selectedModel: 'onModelChanged',
    },
})
export default class App extends Vue {
    selectedModel: GLTFModel | null = null;
    models: Array<GLTFModel> = [];
    renderer: RenderBackend | null = null;

    $refs: {
        canvas: HTMLCanvasElement;
    };

    async onModelChanged(e: GLTFModel) {
        const file = await fetch(
            `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/${e.name}/glTF-Embedded/${e.name}.gltf`,
        );
        new GLTFLoader().load(await file.json()).then(scene => {
            if (this.renderer) {
                scene.renderBackend = this.renderer;
            }
            scene.canvas = this.$refs.canvas;
            scene.render();
        });
    }

    async mounted() {
        const response = await fetch(
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/model-index.json',
        );
        this.models = (await response.json()).filter((e: GLTFModel) =>
            Boolean(e.variants['glTF-Embedded']),
        );
        this.initialize();
        this.selectedModel = this.models.find((m: GLTFModel) => m.name === 'DamagedHelmet') ?? null;
    }

    initialize(): void {
        const gl = this.createGLContext();
        this.renderer = new WebGLRenderBackend(gl);
        this.renderer.viewMatrix = mat4.fromTranslation(mat4.create(), [0, 0, -3]);
    }

    createGLContext(): WebGL2RenderingContext {
        const gl = this.$refs.canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL 2.0 not available');
        }

        return gl;
    }
}
</script>
