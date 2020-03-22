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
import { SceneNode, Scene, Camera } from './Scene';
import { mat4, quat, vec3 } from 'gl-matrix';

const IDENTITY_MATRIX = mat4.identity(mat4.create());

export default class GLTFLoader {
    private file: GlTf;

    constructor(gltfFile: GlTf) {
        this.file = gltfFile;
    }

    async load(): Promise<Scene> {
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

        const cameras = this.loadCameras();
        const scenes = this.loadScenes(this.loadNodes(meshes, cameras));
        const scene = this.file.scene == null ? new Scene([]) : scenes[this.file.scene];
        const defaultCamera = this.findFirstCamera(scene.rootNode);
        if (defaultCamera) {
            scene.camera = defaultCamera;
        }
        return scene;
    }

    private loadScenes(nodes: Array<SceneNode>): Array<Scene> {
        return (
            this.file.scenes?.map(scene => new Scene(scene.nodes?.map(n => nodes[n]) ?? [])) ?? []
        );
    }

    private loadNodes(meshes: Array<Mesh>, cameras: Array<Camera>): Array<SceneNode> {
        const nodeList: Array<SceneNode> = new Array<SceneNode>(this.file.nodes?.length ?? 0);

        return (
            this.file.nodes?.map((node, n) =>
                this.createNode(node, n, nodeList, meshes, cameras),
            ) ?? []
        );
    }

    private createNode(
        gltfNode: GlTfNode,
        gltfNodeIndex: number,
        nodeList: Array<SceneNode>,
        meshList: Array<Mesh>,
        cameraList: Array<Camera>,
    ): SceneNode {
        if (nodeList[gltfNodeIndex]) {
            return nodeList[gltfNodeIndex];
        }

        let node: SceneNode;
        const nodeProps = {
            mesh: gltfNode.mesh != null ? meshList[gltfNode.mesh] : undefined,
            name: gltfNode.name ?? `node${gltfNodeIndex}`,
            children:
                gltfNode.children?.map(
                    n =>
                        nodeList[n] ??
                        this.createNode(
                            (this.file.nodes as Array<GlTfNode>)[n],
                            n,
                            nodeList,
                            meshList,
                            cameraList,
                        ),
                ) ?? [],
            localMatrix: this.loadTranslationRotationScale(gltfNode),
        };

        if (gltfNode.camera != null) {
            node = cameraList[gltfNode.camera];
        } else {
            node = new SceneNode();
        }

        Object.assign(node, nodeProps);
        nodeList[gltfNodeIndex] = node;

        return node;
    }

    private loadTranslationRotationScale(node: GlTfNode): mat4 {
        if (node.matrix) {
            return node.matrix as mat4;
        }

        if (!node.translation && !node.rotation && !node.scale) {
            return IDENTITY_MATRIX;
        }

        const translation = mat4.fromTranslation(
            mat4.create(),
            (node.translation ?? [0, 0, 0]) as vec3,
        );
        const rotation = mat4.fromQuat(mat4.create(), (node.rotation ?? [0, 0, 0, 1]) as quat);
        const scale = mat4.fromScaling(mat4.create(), (node.scale ?? [1, 1, 1]) as vec3);

        const matrix = mat4.create();
        mat4.multiply(matrix, translation, rotation);
        mat4.multiply(matrix, matrix, scale);

        return matrix;
    }

    private loadMeshes(accessors: Array<Accessor>): Array<Mesh> {
        return (
            this.file.meshes?.map(mesh => ({
                primitives: mesh.primitives.map(primitive => ({
                    indices: primitive.indices != null ? accessors[primitive.indices] : undefined,
                    attributes: this.mapPrimitiveAttributes(primitive.attributes, accessors),
                    mode: primitive.mode ?? PrimitiveMode.TRIANGLES,
                })),
                name: mesh.name,
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

    private loadCameras(): Array<Camera> {
        return (
            this.file.cameras?.map(c => {
                if (c.type === 'orthographic' || !c.perspective) {
                    return new Camera();
                }
                return new Camera(
                    c.perspective.yfov * (180 / Math.PI),
                    c.perspective.znear,
                    c.perspective.zfar,
                );
            }) ?? []
        );
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

    private findFirstCamera(node: SceneNode): Camera | null {
        if (node instanceof Camera) {
            return node;
        }

        for (let i = 0; i < node.children.length; i++) {
            const camera = this.findFirstCamera(node.children[i]);
            if (camera) {
                return camera;
            }
        }

        return null;
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
