import { Mesh } from './Mesh';
import { mat4, glMatrix } from 'gl-matrix';

export interface SceneNode {
    // TODO: make mesh inherit from SceneNode and delete these properties
    readonly mesh?: Mesh;
    readonly children: Array<SceneNode>;
    parent?: SceneNode;
    readonly name?: string;
    readonly localMatrix: mat4;
}

export class Camera implements SceneNode {
    constructor();
    constructor(fovDegrees: number, znear: number, zfar?: number);
    constructor(fovDegrees?: number, znear?: number, zfar?: number) {
        this.fov = fovDegrees ?? 60;
        this.znear = znear ?? 0.05;
        this.zfar = zfar ?? Infinity;
    }

    readonly localMatrix = mat4.identity(mat4.create());
    readonly children = [];
    readonly fov: number;
    readonly zfar: number;
    readonly znear: number;
}

export interface RenderBackend {
    render(mesh: Mesh, worldMatrix: mat4): void;
    destroyMesh(mesh: Mesh): void;
    clear(): void;
    projectionMatrix: mat4;
    viewMatrix: mat4;
    stats: {
        drawCalls: number;
        primitives: number;
        vertexBuffers: number;
        elementBuffers: number;
    };
}

export class Scene {
    constructor(nodes: Array<SceneNode>) {
        this.rootNode = { children: nodes, localMatrix: mat4.identity(mat4.create()) };
        this.rootNode.children.forEach(child => (child.parent = this.rootNode));
        this.camera = new Camera();
    }

    camera: Camera;
    canvas?: HTMLCanvasElement;
    readonly rootNode: SceneNode;
    renderBackend?: RenderBackend;

    destroy(): void {
        this.destroyNode(this.rootNode);
    }

    render(): void {
        if (!this.renderBackend) {
            return;
        }

        if (this.canvas) {
            mat4.perspective(
                this.renderBackend.projectionMatrix,
                glMatrix.toRadian(this.camera.fov),
                this.canvas.width / this.canvas.height,
                this.camera.znear,
                this.camera.zfar,
            );
        }

        this.renderBackend.viewMatrix = this.calculateViewMatrix();
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

    private calculateViewMatrix(): mat4 {
        let node: SceneNode | undefined = this.camera;
        const matrix = mat4.copy(mat4.create(), this.camera.localMatrix);

        while (node != null) {
            if (node.parent) {
                mat4.multiply(matrix, node.parent.localMatrix, matrix);
            }
            node = node.parent;
        }

        mat4.invert(matrix, matrix);
        return matrix;
    }
}
