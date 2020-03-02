import GLBuffer from './GLBuffer';

export default class GLVertexArrayObject {
    private readonly glVertexArray: WebGLVertexArrayObject;
    private readonly gl: WebGL2RenderingContext;
    private readonly buffer: GLBuffer;

    constructor(gl: WebGL2RenderingContext, buffer: GLBuffer) {
        this.gl = gl;
        this.glVertexArray = gl.createVertexArray();
        this.buffer = buffer;
        gl.bindVertexArray(this.glVertexArray);
        buffer.bind();
    }

    vertexAttribPointer(index: GLuint, size: GLint, stride: GLsizei, offset: GLintptr): void {
        const type = this.gl.FLOAT;
        const normalized = false;
        this.gl.enableVertexAttribArray(index);
        this.gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
    }

    delete(): void {
        this.gl.deleteVertexArray(this.glVertexArray);
        this.buffer.delete();
    }
}
