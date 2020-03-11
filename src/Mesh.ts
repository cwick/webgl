export interface Mesh {
    readonly primitives: Array<MeshPrimitive>;
    readonly name?: string;
}

export interface MeshPrimitive {
    readonly attributes: PrimitiveAttributes;
    readonly indices?: Accessor;
    readonly mode: PrimitiveMode;
}

export interface PrimitiveAttributes {
    [k: string]: Accessor;
}

export interface Accessor {
    readonly bufferView: BufferView;
    readonly byteOffset: number;
    readonly componentType: ComponentType;
    readonly count: number;
    readonly normalized: boolean;
    readonly type: AttributeType;
}

export interface BufferView {
    readonly buffer: ArrayBuffer;
    readonly byteLength: number;
    readonly byteOffset: number;
    readonly byteStride: number;
    readonly target: BufferTarget;
}

export enum ComponentType {
    BYTE = 5120,
    FLOAT = 5126,
    SHORT = 5122,
    UNSIGNED_BYTE = 5121,
    UNSIGNED_INT = 5125,
    UNSIGNED_SHORT = 5123,
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
