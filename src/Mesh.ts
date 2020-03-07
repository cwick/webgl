export interface Mesh {
    readonly primitives: Array<MeshPrimitive>;
}

export interface MeshPrimitive {
    readonly indices?: Accessor;
    readonly attributes: PrimitiveAttributes;
    readonly mode: PrimitiveMode;
}

export interface PrimitiveAttributes {
    [k: string]: Accessor;
}

export interface Accessor {
    readonly bufferView: BufferView;
    readonly componentType: ComponentType;
    readonly type: AttributeType;
    readonly normalized: boolean;
    readonly count: number;
    readonly byteOffset: number;
}

export interface BufferView {
    readonly buffer: ArrayBuffer;
    readonly target: BufferTarget;
    readonly byteOffset: number;
    readonly byteLength: number;
    readonly byteStride: number;
}

export enum ComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_INT = 5125,
    FLOAT = 5126,
}

export enum AttributeType {
    SCALAR = 1,
    VEC2 = 2,
    VEC3 = 3,
    VEC4 = 4,
}

export enum BufferTarget {
    ARRAY_BUFFER = 34962,
    ELEMENT_ARRAY_BUFFER = 34963,
}

export enum PrimitiveMode {
    POINTS = 0,
    LINES = 1,
    LINE_LOOP = 2,
    LINE_STRIP = 3,
    TRIANGLES = 4,
    TRIANGLE_STRIP = 5,
    TRIANGLE_FAN = 6,
}
