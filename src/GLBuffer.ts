export default class GLBuffer {
    private readonly glBuffer: WebGLBuffer;
    private readonly gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext) {
        this.glBuffer = gl.createBuffer();
        this.gl = gl;
    }

    bind(): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
    }

    bufferData(data: Array<number>): void {
        this.bind();
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
    }

    delete(): void {
        this.gl.deleteBuffer(this.glBuffer);
    }
}
