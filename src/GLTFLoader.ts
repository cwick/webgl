import example, { GlTfId } from 'assets/example.gltf';
import {
    Mesh,
    BufferView,
    BufferTarget,
    Accessor,
    PrimitiveAttributes,
    AttributeType,
    PrimitiveMode,
} from './Mesh';

export default class GLTFLoader {
    async load(): Promise<Mesh> {
        const version = example.asset.version;
        if (!version.startsWith('2.')) {
            this.notSupported(`glTF version ${version} not supported.`);
        }
        const bufferPromises = example.buffers?.map((buffer, i) => {
            if (!buffer.uri) {
                this.invalid(`missing buffer uri for buffer ${i}`);
            }
            return this.loadBufferFromURI(buffer.uri);
        });
        const buffers = await Promise.all(bufferPromises ?? []);
        const bufferViews: Array<BufferView> =
            example.bufferViews?.map(view =>
                Object.assign(view, {
                    buffer: buffers[view.buffer],
                    target: view.target ?? BufferTarget.ARRAY_BUFFER,
                    byteStride: view.byteStride ?? 0,
                    byteOffset: view.byteOffset ?? 0,
                }),
            ) ?? [];
        const accessors: Array<Accessor> =
            example.accessors?.map(accessor =>
                Object.assign(accessor, {
                    bufferView: bufferViews[accessor.bufferView ?? 0],
                    type: AttributeType[accessor.type as keyof typeof AttributeType],
                    normalized: accessor.normalized ?? false,
                    byteOffset: accessor.byteOffset ?? 0,
                }),
            ) ?? [];
        const meshes: Array<Mesh> =
            example.meshes?.map(mesh => ({
                primitives: mesh.primitives.map(primitive => ({
                    indices: primitive.indices != null ? accessors[primitive.indices] : undefined,
                    attributes: this.mapPrimitiveAttributes(primitive.attributes, accessors),
                    mode: primitive.mode ?? PrimitiveMode.TRIANGLES,
                })),
            })) ?? [];
        return meshes[0];
    }

    private mapPrimitiveAttributes(
        attributes: {
            [k: string]: GlTfId;
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
