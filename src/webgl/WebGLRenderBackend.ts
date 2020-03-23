import { Mesh, MeshPrimitive, PrimitiveAttributes, ComponentType } from '../Mesh';
import { RenderBackend } from '../Scene';
import GLProgram from './GLProgram';
import GLShader from './GLShader';
import { mat4 } from 'gl-matrix';

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;
const vertexShaderSource = `#version 300 es
 
in vec3 POSITION;
out vec4 viewPosition;
uniform mat4 u_transform;
uniform mat4 u_projection;
uniform mat4 u_view;

void main() {
  viewPosition = u_view * u_transform * vec4(POSITION,1);
  gl_Position = u_projection * viewPosition;
}
`;

const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;
 
out vec4 outColor;
in vec4 viewPosition;
 
void main() {
    vec3 xTangent = dFdx( vec3(viewPosition) );
    vec3 yTangent = dFdy( vec3(viewPosition) );
    vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
    // outColor = vec4(gl_FragCoord.x / 800.0, gl_FragCoord.y / 600.0, 1, 1.0);
    float lightValue = (faceNormal.y + 1.0) / 2.0;
    outColor = vec4(vec2(lightValue), 1, 1);
}
`;

export default class WebGLRenderBackend implements RenderBackend {
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
        this.glViewLocation = this.getUniformLocation('u_view');

        this.gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);

        this.gl.enable(gl.CULL_FACE);
        this.gl.enable(gl.DEPTH_TEST);
        this.glProgram.use();
    }

    public viewMatrix = mat4.identity(mat4.create());
    public projectionMatrix = mat4.identity(mat4.create());
    public stats = {
        drawCalls: 0,
        primitives: 0,
        vertexBuffers: 0,
        elementBuffers: 0,
    };

    private createdPrimitives: Set<MeshPrimitive> = new Set();
    private glVertexBuffers: Map<ArrayBuffer, WebGLBuffer> = new Map();
    private glVertexArrayObjects: Map<MeshPrimitive, WebGLVertexArrayObject> = new Map();
    // TODO: track buffers used for vertex indices
    // private glElementBuffers: Map<MeshPrimitive, WebGLBuffer> = new Map();
    private gl: WebGL2RenderingContext;
    private glProgram: GLProgram;
    private glTransformLocation: WebGLUniformLocation;
    private glProjectionLocation: WebGLUniformLocation;
    private glViewLocation: WebGLUniformLocation;

    render(mesh: Mesh, worldMatrix: mat4): void {
        this.glProgram.use();
        this.gl.uniformMatrix4fv(this.glTransformLocation, false, worldMatrix);
        this.gl.uniformMatrix4fv(this.glViewLocation, false, this.viewMatrix);
        this.gl.uniformMatrix4fv(this.glProjectionLocation, false, this.projectionMatrix);
        mesh.primitives.forEach(p => this.renderPrimitive(p));
    }

    destroyMesh(mesh: Mesh): void {
        mesh.primitives.forEach(primitive => {
            Object.values(primitive.attributes).forEach(accessor => {
                const buffer = accessor.bufferView.buffer;
                const glBuffer = this.glVertexBuffers.get(buffer);
                if (glBuffer) {
                    this.gl.deleteBuffer(glBuffer);
                    this.glVertexBuffers.delete(buffer);
                }
            });

            const vao = this.glVertexArrayObjects.get(primitive);
            if (vao) {
                this.gl.deleteVertexArray(vao);
                this.glVertexArrayObjects.delete(primitive);
            }
        });
    }

    clear(): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.resetRenderStats();
    }

    private renderPrimitive(primitive: MeshPrimitive): void {
        if (!this.createdPrimitives.has(primitive)) {
            this.buildPrimitive(primitive);
        }

        this.gl.bindVertexArray(this.glVertexArrayObjects.get(primitive) ?? null);
        if (primitive.indices) {
            this.drawElements(primitive);
        } else {
            this.drawArrays(primitive);
        }
    }

    private buildPrimitive(primitive: MeshPrimitive): void {
        const vao = this.getOrCreateGLVertexArrayObject(primitive);
        this.gl.bindVertexArray(vao);

        this.buildAttributes(primitive.attributes);

        if (primitive.indices) {
            const glBuffer = this.gl.createBuffer();
            const bufferView = primitive.indices.bufferView;
            const indexBuffer = bufferView.buffer;

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, glBuffer);
            this.stats.elementBuffers++;

            this.gl.bufferData(
                this.gl.ELEMENT_ARRAY_BUFFER,
                new Uint8Array(indexBuffer),
                this.gl.STATIC_DRAW,
                bufferView.byteOffset,
                bufferView.byteLength,
            );
        }

        this.stats.primitives++;
        this.createdPrimitives.add(primitive);
    }

    private buildAttributes(attributes: PrimitiveAttributes): void {
        Object.entries(attributes).forEach(([attribute, accessor]) => {
            // TODO: Support more attributes
            if (attribute != 'POSITION') {
                return;
            }

            this.uploadVertexData(accessor.bufferView.buffer);

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

    private uploadVertexData(buffer: ArrayBuffer): void {
        let glBuffer = this.glVertexBuffers.get(buffer) ?? null;
        if (!glBuffer) {
            glBuffer = this.gl.createBuffer();
            if (!glBuffer) {
                throw new Error('Error creating GL vertex buffer');
            }
            this.stats.vertexBuffers++;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, glBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
            this.glVertexBuffers.set(buffer, glBuffer);
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, glBuffer);
    }

    private getOrCreateGLVertexArrayObject(primitive: MeshPrimitive): WebGLVertexArrayObject {
        let vao = this.glVertexArrayObjects.get(primitive) ?? null;
        if (!vao) {
            vao = this.gl.createVertexArray();
            if (!vao) {
                throw new Error('Error creating GL Vertex Array Object');
            }
            this.glVertexArrayObjects.set(primitive, vao);
        }
        return vao;
    }

    private drawElements(primitive: MeshPrimitive): void {
        if (primitive.indices) {
            this.stats.drawCalls++;
            this.gl.drawElements(
                primitive.mode,
                primitive.indices.count,
                primitive.indices.componentType,
                primitive.indices.byteOffset,
            );
        }
    }

    private drawArrays(primitive: MeshPrimitive): void {
        const accessor = primitive.attributes.POSITION;

        this.stats.drawCalls++;
        this.gl.drawArrays(
            primitive.mode,
            accessor.byteOffset / this.componentSize(accessor.componentType),
            accessor.count,
        );
    }

    private getUniformLocation(uniform: string): WebGLUniformLocation {
        const location = this.glProgram.getUniformLocation(uniform);
        if (location == null) {
            throw new Error(`Error getting uniform location for '${uniform}'`);
        }
        return location;
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

    private componentSize(componentType: ComponentType): number {
        return {
            [ComponentType.BYTE]: 1,
            [ComponentType.FLOAT]: 4,
            [ComponentType.SHORT]: 2,
            [ComponentType.UNSIGNED_BYTE]: 1,
            [ComponentType.UNSIGNED_INT]: 4,
            [ComponentType.UNSIGNED_SHORT]: 2,
        }[componentType];
    }

    private resetRenderStats(): void {
        const stats = this.stats;
        (Object.keys(this.stats) as Array<keyof typeof stats>).forEach(
            key => (this.stats[key] = 0),
        );
    }
}
