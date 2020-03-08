import {
    Mesh,
    BufferView,
    BufferTarget,
    Accessor,
    PrimitiveAttributes,
    AttributeType,
    PrimitiveMode,
} from './Mesh';
import { GlTf, Node as GlTfNode } from '*.gltf';
import { SceneNode, Scene } from './Scene';
import { mat4, quat } from 'gl-matrix';

export default class GLTFLoader {
    private file: GlTf;

    async load(gltfFile: GlTf): Promise<Scene | null> {
        this.file = gltfFile;

        const version = this.file.asset.version;
        if (!version.startsWith('2.')) {
            this.notSupported(`glTF version ${version} not supported.`);
        }

        // prettier-ignore
        const meshes = this.loadMeshes(
            this.loadAccessors(
                this.loadBufferViews(
                    await this.loadBuffers())),
        );

        const scenes = this.loadScenes(this.loadNodes(meshes));
        return this.file.scene != null ? scenes[this.file.scene] : null;
    }

    private loadScenes(nodes: Array<SceneNode>): Array<Scene> {
        return (
            this.file.scenes?.map(scene => ({
                nodes: scene.nodes?.map(n => nodes[n]) ?? [],
            })) ?? []
        );
    }

    private loadNodes(meshes: Array<Mesh>): Array<SceneNode> {
        const nodeList: Array<SceneNode> = [];

        return this.file.nodes?.map(node => this.createNode(node, nodeList, meshes)) ?? [];
    }

    private createNode(
        gltfNode: GlTfNode,
        nodeList: Array<SceneNode>,
        meshList: Array<Mesh>,
    ): SceneNode {
        const node = {
            mesh: gltfNode.mesh != null ? meshList[gltfNode.mesh] : undefined,
            name: gltfNode.name,
            children:
                gltfNode.children?.map(
                    n =>
                        nodeList[n] ??
                        this.createNode(
                            (this.file.nodes as Array<GlTfNode>)[n],
                            nodeList,
                            meshList,
                        ),
                ) ?? [],
            matrix: gltfNode.rotation
                ? mat4.fromQuat(mat4.create(), gltfNode.rotation as quat)
                : undefined,
        };
        nodeList.push(node);
        return node;
    }

    private loadMeshes(accessors: Array<Accessor>): Array<Mesh> {
        return (
            this.file.meshes?.map(mesh => ({
                primitives: mesh.primitives.map(primitive => ({
                    indices: primitive.indices != null ? accessors[primitive.indices] : undefined,
                    attributes: this.mapPrimitiveAttributes(primitive.attributes, accessors),
                    mode: primitive.mode ?? PrimitiveMode.TRIANGLES,
                })),
            })) ?? []
        );
    }

    private loadAccessors(bufferViews: Array<BufferView>): Array<Accessor> {
        return (
            this.file.accessors?.map(accessor =>
                Object.assign(accessor, {
                    bufferView: bufferViews[accessor.bufferView ?? 0],
                    type: AttributeType[accessor.type as keyof typeof AttributeType],
                    normalized: accessor.normalized ?? false,
                    byteOffset: accessor.byteOffset ?? 0,
                }),
            ) ?? []
        );
    }

    private loadBufferViews(buffers: Array<ArrayBuffer>): Array<BufferView> {
        return (
            this.file.bufferViews?.map(view =>
                Object.assign(view, {
                    buffer: buffers[view.buffer],
                    target: view.target ?? BufferTarget.ARRAY_BUFFER,
                    byteStride: view.byteStride ?? 0,
                    byteOffset: view.byteOffset ?? 0,
                }),
            ) ?? []
        );
    }

    private async loadBuffers(): Promise<Array<ArrayBuffer>> {
        const bufferPromises = this.file.buffers?.map((buffer, i) => {
            if (!buffer.uri) {
                this.invalid(`missing buffer uri for buffer ${i}`);
            }
            return this.loadBufferFromURI(buffer.uri);
        });
        return await Promise.all(bufferPromises ?? []);
    }

    private mapPrimitiveAttributes(
        attributes: {
            [k: string]: number;
        },
        accessors: Array<Accessor>,
    ): PrimitiveAttributes {
        return Object.fromEntries(
            Object.entries(attributes).map(([attribute, accessorIndex]) => [
                attribute,
                accessors[accessorIndex],
            ]),
        );
    }

    private async loadBufferFromURI(uri: string): Promise<ArrayBuffer> {
        const response = await fetch(uri);
        return await response.arrayBuffer();
    }

    private notSupported(message: string): never {
        throw new Error(message);
    }

    private invalid(message: string): never {
        throw new Error(`Invalid glTF file: ${message}`);
    }
}
