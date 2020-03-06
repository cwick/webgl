export interface Mesh {
    readonly primitives: Array<MeshPrimitive>;
}

export interface MeshPrimitive {
    readonly indices: Accessor | null;
    readonly attributes: PrimitiveAttributes;
}

export interface PrimitiveAttributes {
    [k: string]: Accessor;
}

export interface Accessor {
    readonly bufferView: BufferView;
    readonly componentType: ComponentType;
}

export interface BufferView {
    readonly buffer: ArrayBuffer;
    readonly target: BufferTarget;
}

export enum ComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_INT = 5125,
    FLOAT = 5126,
}

export enum BufferTarget {
    ARRAY_BUFFER = 34962,
    ELEMENT_ARRAY_BUFFER = 34963,
}
