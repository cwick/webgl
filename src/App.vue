<template>
    <div>
        <canvas ref="canvas" width="800" height="600"></canvas>

        <select v-model="selectedModel">
            <option v-for="model in models" :key="model.name" :value="model">{{ model.name }}</option>
        </select>
        <table>
            <caption>Stats</caption>
            <tbody>
                <tr v-for="statName in Object.keys(renderStats)" :key="statName">
                    <th>{{statName}}</th>
                    <td>{{renderStats[statName]}}</td>
                </tr>
            </tbody>
        </table>
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

interface RenderStat {
    [key: string]: any;
}

@Component({
    watch: {
        selectedModel: 'onModelChanged',
    },
})
export default class App extends Vue {
    selectedModel: GLTFModel | null = null;
    models: Array<GLTFModel> = [];
    renderBackend: RenderBackend | null = null;
    renderStats: { [key: string]: any } = {};

    $refs!: {
        canvas: HTMLCanvasElement;
    };

    async onModelChanged(e: GLTFModel) {
        const file = await fetch(
            `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/${e.name}/glTF-Embedded/${e.name}.gltf`,
        );
        new GLTFLoader(await file.json()).load().then(scene => {
            scene.renderBackend = this.renderBackend!;
            scene.canvas = this.$refs.canvas;
            scene.render();
            this.renderStats = this.renderBackend!.stats;
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
        this.selectedModel = this.models.find((m: GLTFModel) => m.name === 'GearboxAssy') ?? null;
    }

    initialize(): void {
        const gl = this.createGLContext();
        this.renderBackend = new WebGLRenderBackend(gl);
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
