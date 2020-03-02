export class GLShaderError extends Error {}

export default class GLShader {
    private readonly type: GLenum;
    private _glShader: WebGLShader;
    private readonly gl: WebGLRenderingContextBase;

    constructor(gl: WebGLRenderingContextBase, type: GLenum) {
        this.type = type;
        this.gl = gl;
    }

    get glShader(): WebGLShader {
        return this._glShader;
    }

    create(): void {
        if (!this._glShader) {
            this._glShader = this.gl.createShader(this.type);
        }
    }

    compile(...sources: string[]): void {
        this.create();

        this.gl.shaderSource(this._glShader, sources.join('\n'));
        this.gl.compileShader(this._glShader);

        const success = this.gl.getShaderParameter(this._glShader, this.gl.COMPILE_STATUS);
        if (!success) {
            let message = this.gl.getShaderInfoLog(this._glShader);
            if (message.length === 0) {
                message = 'Unknown error while compiling shader';
            }
            this.delete();
            throw new GLShaderError(message);
        }
    }

    delete(): void {
        if (this._glShader) {
            this.gl.deleteShader(this._glShader);
            this._glShader = null;
        }
    }
}
