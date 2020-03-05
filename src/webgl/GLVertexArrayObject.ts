import GLBuffer from './GLBuffer';

export default class GLVertexArrayObject {
    private readonly glVertexArray: WebGLVertexArrayObject;
    private readonly gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.glVertexArray = gl.createVertexArray();
    }

    bind(): void {
        this.gl.bindVertexArray(this.glVertexArray);
    }

    vertexAttribPointer(
        buffer: GLBuffer,
        index: GLuint,
        size: GLint,
        type: number,
        normalized: boolean,
        stride: GLsizei,
        offset: GLintptr,
    ): void {
        this.bind();
        buffer.bind();
        this.gl.enableVertexAttribArray(index);
        this.gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
    }

    delete(): void {
        this.gl.deleteVertexArray(this.glVertexArray);
    }
}
