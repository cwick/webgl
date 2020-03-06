import { Mesh, MeshPrimitive } from '../Mesh';

export default class WebGLRenderer {
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }
    render(mesh: Mesh): void {
        mesh.primitives.forEach(p => this.renderPrimitive(p));
    }

    private builtPrimitives: Set<MeshPrimitive> = new Set();
    private glBuffers: Map<ArrayBuffer, WebGLBuffer> = new Map();
    private gl: WebGL2RenderingContext;

    private renderPrimitive(primitive: MeshPrimitive): void {
        if (!this.builtPrimitives.has(primitive)) {
            this.buildPrimitive(primitive);
        }
    }

    private buildPrimitive(primitive: MeshPrimitive): void {
        Object.entries(primitive.attributes).forEach(([attribute, accessor]) => {
            if (!this.glBuffers.has(accessor.bufferView.buffer)) {
                const glBuffer = this.gl.createBuffer();
                if (!glBuffer) {
                    throw new Error('Error creating GL buffer');
                }
                this.glBuffers.set(accessor.bufferView.buffer, glBuffer);
            }
        });
    }
}
