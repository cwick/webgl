import { Mesh, MeshPrimitive, PrimitiveAttributes, ComponentType } from '../Mesh';
import GLProgram from './GLProgram';
import GLShader from './GLShader';
import { mat4, glMatrix } from 'gl-matrix';

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;
const vertexShaderSource = `#version 300 es
 
in vec3 POSITION;
uniform mat4 u_transform;
uniform mat4 u_projection;

void main() {
  gl_Position = u_projection * u_transform * vec4(POSITION,1);
}
`;

const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;
 
out vec4 outColor;
 
void main() {
    outColor = vec4(gl_FragCoord.x / 800.0, gl_FragCoord.y / 600.0, 1, 1.0);
}
`;

export default class WebGLRenderer {
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.glProgram = new GLProgram(gl);

        const vertexShader = new GLShader(gl, gl.VERTEX_SHADER);
        const fragmentShader = new GLShader(gl, gl.FRAGMENT_SHADER);
        vertexShader.compile(vertexShaderSource);
        fragmentShader.compile(fragmentShaderSource);
        this.glProgram.link(vertexShader, fragmentShader);
        this.glTransformLocation = this.getUniformLocation('u_transform');
        this.glProjectionLocation = this.getUniformLocation('u_projection');
    }

    public wireframe = false;
    private builtPrimitives: Set<MeshPrimitive> = new Set();
    private glBuffers: Map<ArrayBuffer, WebGLBuffer> = new Map();
    private gl: WebGL2RenderingContext;
    private glProgram: GLProgram;
    private userTransform: mat4;
    private glTransformLocation: WebGLUniformLocation;
    private glProjectionLocation: WebGLUniformLocation;

    render(mesh: Mesh, transform: mat4): void {
        this.userTransform = transform;
        this.glProgram.use();
        this.setMatrices();
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        mesh.primitives.forEach(p => this.renderPrimitive(p));
    }

    private renderPrimitive(primitive: MeshPrimitive): void {
        if (!this.builtPrimitives.has(primitive)) {
            this.buildPrimitive(primitive);
        }

        if (primitive.indices) {
            if (this.wireframe) {
                this.drawElementsWireframe(primitive);
            } else {
                this.drawElements(primitive);
            }
        }
    }

    private buildPrimitive(primitive: MeshPrimitive): void {
        const vao = this.gl.createVertexArray();
        if (!vao) {
            throw new Error('Error creating GL Vertex Array Object');
        }
        this.gl.bindVertexArray(vao);

        this.buildAttributes(primitive.attributes);

        if (primitive.indices) {
            const glBuffer = this.gl.createBuffer();
            const bufferView = primitive.indices.bufferView;
            const indexBuffer = bufferView.buffer;
            const offset = bufferView.byteOffset;
            const length = bufferView.byteLength;

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, glBuffer);
            if (this.wireframe) {
                this.uploadWireframeIndices(primitive);
            } else {
                this.gl.bufferData(
                    this.gl.ELEMENT_ARRAY_BUFFER,
                    new Uint8Array(indexBuffer),
                    this.gl.STATIC_DRAW,
                    offset,
                    length,
                );
            }
        }

        this.builtPrimitives.add(primitive);
    }

    private uploadWireframeIndices(primitive: MeshPrimitive): void {
        if (!primitive.indices) {
            return;
        }

        const bufferView = primitive.indices.bufferView;
        const TypedArrayConstructor = this.typedArrayConstructor(primitive.indices.componentType);
        const sourceBuffer = new TypedArrayConstructor(
            bufferView.buffer,
            bufferView.byteOffset + primitive.indices.byteOffset,
            bufferView.byteLength / TypedArrayConstructor.BYTES_PER_ELEMENT,
        );
        const destBuffer = new TypedArrayConstructor(
            (bufferView.byteLength * 2) / TypedArrayConstructor.BYTES_PER_ELEMENT,
        );

        // Duplicate indices so it looks okay when drawn with GL_LINES
        for (let i = 0; i < sourceBuffer.length; i += 3) {
            destBuffer[i * 2] = sourceBuffer[i];
            destBuffer[i * 2 + 1] = sourceBuffer[i + 1];
            destBuffer[i * 2 + 2] = sourceBuffer[i + 1];
            destBuffer[i * 2 + 3] = sourceBuffer[i + 2];
            destBuffer[i * 2 + 4] = sourceBuffer[i + 2];
            destBuffer[i * 2 + 5] = sourceBuffer[i];
        }

        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint8Array(destBuffer.buffer),
            this.gl.STATIC_DRAW,
            0,
            destBuffer.byteLength,
        );
    }

    private typedArrayConstructor(
        componentType: ComponentType,
    ): {
        new (b: ArrayBuffer, offset?: number, length?: number): TypedArray;
        new (length: number): TypedArray;
        BYTES_PER_ELEMENT: number;
    } {
        return {
            [ComponentType.BYTE]: Int8Array,
            [ComponentType.UNSIGNED_BYTE]: Uint8Array,
            [ComponentType.SHORT]: Int16Array,
            [ComponentType.UNSIGNED_SHORT]: Uint16Array,
            [ComponentType.UNSIGNED_INT]: Uint32Array,
            [ComponentType.FLOAT]: Float32Array,
        }[componentType];
    }

    private buildAttributes(attributes: PrimitiveAttributes): void {
        Object.entries(attributes).forEach(([attribute, accessor]) => {
            if (attribute != 'POSITION') {
                return;
            }

            const buffer = accessor.bufferView.buffer;

            // Create and upload vertex data to GL buffer
            if (!this.glBuffers.has(buffer)) {
                const glBuffer = this.gl.createBuffer();
                if (!glBuffer) {
                    throw new Error('Error creating GL buffer');
                }
                this.glBuffers.set(buffer, glBuffer);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, glBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
            }

            const glAttributeLocation = this.glProgram.getAttribLocation(attribute);
            this.gl.enableVertexAttribArray(glAttributeLocation);

            this.gl.vertexAttribPointer(
                glAttributeLocation,
                accessor.type,
                accessor.componentType,
                accessor.normalized,
                accessor.bufferView.byteStride,
                accessor.bufferView.byteOffset + accessor.byteOffset,
            );
        });
    }

    private drawElements(primitive: MeshPrimitive): void {
        if (primitive.indices) {
            this.gl.drawElements(
                primitive.mode,
                primitive.indices.count,
                primitive.indices.componentType,
                primitive.indices.byteOffset,
            );
        }
    }

    private drawElementsWireframe(primitive: MeshPrimitive): void {
        if (primitive.indices) {
            this.gl.drawElements(
                this.gl.LINES,
                primitive.indices.count * 2,
                primitive.indices.componentType,
                0,
            );
        }
    }

    private setMatrices(): void {
        const gl = this.gl;
        const perspective = mat4.perspective(
            mat4.create(),
            glMatrix.toRadian(45 * (gl.canvas.height / gl.canvas.width)),
            gl.canvas.width / gl.canvas.height,
            0.1,
            100,
        );
        gl.uniformMatrix4fv(this.glProjectionLocation, false, perspective);

        const transform = mat4.fromTranslation(mat4.create(), [0, 0, -6]);
        mat4.multiply(transform, transform, this.userTransform);
        gl.uniformMatrix4fv(this.glTransformLocation, false, transform);
    }

    private getUniformLocation(uniform: string): WebGLUniformLocation {
        const location = this.glProgram.getUniformLocation(uniform);
        if (location == null) {
            throw new Error(`Error getting uniform location for '${uniform}'`);
        }
        return location;
    }
}
