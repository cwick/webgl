export class GLShaderError extends Error {}

export default class GLShader {
    private readonly type: GLenum;
    public readonly glShader: WebGLShader;
    private readonly gl: WebGLRenderingContextBase;

    constructor(gl: WebGLRenderingContextBase, type: GLenum) {
        this.type = type;
        this.gl = gl;
        this.glShader = this.gl.createShader(this.type) ?? 0;
    }

    compile(...sources: string[]): void {
        this.gl.shaderSource(this.glShader, sources.join('\n'));
        this.gl.compileShader(this.glShader);

        const success = this.gl.getShaderParameter(this.glShader, this.gl.COMPILE_STATUS);
        if (!success) {
            let message = this.gl.getShaderInfoLog(this.glShader) ?? '';
            if (message.length === 0) {
                message = 'Unknown error while compiling shader';
            }
            this.delete();
            throw new GLShaderError(message);
        }
    }

    delete(): void {
        if (this.glShader) {
            this.gl.deleteShader(this.glShader);
        }
    }
}
