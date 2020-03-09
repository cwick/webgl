import { Mesh } from './Mesh';
import { mat4 } from 'gl-matrix';

export interface SceneNode {
    readonly mesh?: Mesh;
    readonly children: Array<SceneNode>;
    readonly name?: string;
    readonly localMatrix: mat4;
}

interface RootNode extends SceneNode {
    localMatrix: mat4;
}

interface RenderBackend {
    render(mesh: Mesh, transform: mat4): void;
}

export class Scene {
    constructor(nodes: Array<SceneNode>) {
        this.rootNode = {
            children: nodes,
            localMatrix: mat4.identity(mat4.create()),
        };
    }

    readonly rootNode: RootNode;

    render(backend: RenderBackend): void {
        this.backend = backend;
        this.renderNode(this.rootNode, mat4.identity(mat4.create()));
    }

    private renderNode(node: SceneNode, parentMatrix: mat4): void {
        const worldMatrix = mat4.multiply(mat4.create(), parentMatrix, node.localMatrix);
        if (node.mesh) {
            this.backend.render(node.mesh, worldMatrix);
        }
        node.children.forEach(child => this.renderNode(child, worldMatrix));
    }

    private backend: RenderBackend;
}
