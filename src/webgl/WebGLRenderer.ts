import { Mesh, MeshPrimitive, PrimitiveAttributes } from '../Mesh';
import GLProgram from './GLProgram';
import GLShader from './GLShader';
import { mat4, glMatrix } from 'gl-matrix';

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

        this.setMatrices();
    }

    render(mesh: Mesh): void {
        this.glProgram.use();
        mesh.primitives.forEach(p => this.renderPrimitive(p));
    }

    private builtPrimitives: Set<MeshPrimitive> = new Set();
    private glBuffers: Map<ArrayBuffer, WebGLBuffer> = new Map();
    private gl: WebGL2RenderingContext;
    private glProgram: GLProgram;

    private renderPrimitive(primitive: MeshPrimitive): void {
        if (!this.builtPrimitives.has(primitive)) {
            this.buildPrimitive(primitive);
        }

        if (primitive.indices) {
            this.gl.drawElements(
                primitive.mode,
                primitive.indices.count,
                primitive.indices.componentType,
                primitive.indices.byteOffset + primitive.indices.bufferView.byteOffset,
            );
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
            this.gl.bufferData(
                this.gl.ELEMENT_ARRAY_BUFFER,
                new Uint8Array(indexBuffer),
                this.gl.STATIC_DRAW,
                offset,
                length,
            );
        }
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

    private setMatrices(): void {
        const gl = this.gl;
        this.glProgram.use();
        const perspective = mat4.perspective(
            mat4.create(),
            glMatrix.toRadian(45 * (gl.canvas.height / gl.canvas.width)),
            gl.canvas.width / gl.canvas.height,
            0.1,
            100,
        );
        gl.uniformMatrix4fv(this.glProgram.getUniformLocation('u_projection'), false, perspective);

        const transform = mat4.fromTranslation(mat4.create(), [0, 0, -6]);
        gl.uniformMatrix4fv(this.glProgram.getUniformLocation('u_transform'), false, transform);
    }
}
