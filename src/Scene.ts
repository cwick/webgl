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

export interface RenderBackend {
    render(mesh: Mesh, transform: mat4): void;
    destroyMesh(mesh: Mesh): void;
}

export class Scene {
    constructor(nodes: Array<SceneNode>) {
        this.rootNode = {
            children: nodes,
            localMatrix: mat4.identity(mat4.create()),
        };
    }

    readonly rootNode: RootNode;
    renderBackend?: RenderBackend;

    destroy(): void {
        this.destroyNode(this.rootNode);
    }

    render(): void {
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
