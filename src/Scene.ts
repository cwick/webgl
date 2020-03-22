import { Mesh } from './Mesh';
import { mat4, glMatrix } from 'gl-matrix';

export interface SceneNode {
    // TODO: make mesh and camera inherit from SceneNode and delete these properties
    readonly mesh?: Mesh;
    readonly camera?: Camera;
    readonly children: Array<SceneNode>;
    readonly name?: string;
    readonly localMatrix: mat4;
}

interface RootNode extends SceneNode {
    localMatrix: mat4;
}

export class Camera {
    constructor();
    constructor(fovDegrees: number, znear: number, zfar?: number);
    constructor(fovDegrees?: number, znear?: number, zfar?: number) {
        this.fov = fovDegrees ?? 60;
        this.znear = znear ?? 0.05;
        this.zfar = zfar ?? Infinity;
    }

    readonly fov: number;
    readonly zfar: number;
    readonly znear: number;
}

interface Viewport {
    width: number;
    height: number;
}

export interface RenderBackend {
    render(mesh: Mesh, transform: mat4): void;
    destroyMesh(mesh: Mesh): void;
    projectionMatrix: mat4;
    clear(): void;
}

export class Scene {
    constructor(nodes: Array<SceneNode>) {
        this.rootNode = {
            children: nodes,
            localMatrix: mat4.identity(mat4.create()),
        };
        this.camera = new Camera();
    }

    camera: Camera;
    viewport?: Viewport;
    readonly rootNode: RootNode;
    renderBackend?: RenderBackend;

    destroy(): void {
        this.destroyNode(this.rootNode);
    }

    render(): void {
        if (!this.renderBackend) {
            return;
        }

        if (this.viewport) {
            mat4.perspective(
                this.renderBackend.projectionMatrix,
                glMatrix.toRadian(this.camera.fov),
                this.viewport.width / this.viewport.height,
                this.camera.znear,
                this.camera.zfar,
            );
        }
        this.renderBackend.clear();
        this.renderNode(this.rootNode, mat4.identity(mat4.create()));
    }

    private destroyNode(node: SceneNode): void {
        if (node.mesh) {
            this.renderBackend?.destroyMesh(node.mesh);
        }

        node.children.forEach(child => {
            this.destroyNode(child);
        });
    }

    private renderNode(node: SceneNode, parentMatrix: mat4): void {
        const worldMatrix = mat4.multiply(mat4.create(), parentMatrix, node.localMatrix);
        if (node.mesh) {
            this.renderBackend?.render(node.mesh, worldMatrix);
        }
        node.children.forEach(child => this.renderNode(child, worldMatrix));
    }
}
