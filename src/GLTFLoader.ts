import {
    Mesh,
    BufferView,
    BufferTarget,
    Accessor,
    PrimitiveAttributes,
    AttributeType,
    PrimitiveMode,
} from './Mesh';
import { GlTf } from '*.gltf';

export default class GLTFLoader {
    private file: GlTf;

    async load(gltfFile: GlTf): Promise<Mesh> {
        this.file = gltfFile;

        const version = this.file.asset.version;
        if (!version.startsWith('2.')) {
            this.notSupported(`glTF version ${version} not supported.`);
        }

        // prettier-ignore
        return this.loadMeshes(
            this.loadAccessors(
                this.loadBufferViews(
                    await this.loadBuffers())),
        )[0];
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
