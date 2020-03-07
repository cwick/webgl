import GLBuffer from './GLBuffer';

// TODO: delete class?
export default class GLVertexArrayObject {
    private readonly glVertexArray: WebGLVertexArrayObject;
    private readonly gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        const vertexArray = gl.createVertexArray();
        if (!vertexArray) {
            throw new Error('Error creating GL Vertex Array Object');
        }
        this.glVertexArray = vertexArray;
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
