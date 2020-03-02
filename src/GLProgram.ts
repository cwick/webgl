import GLShader from './GLShader';

export class GLProgramError extends Error {}

export class Program {
    private program: WebGLProgram;
    private readonly gl: WebGLRenderingContextBase;

    constructor(gl: WebGLRenderingContextBase) {
        this.gl = gl;
    }

    create(): void {
        if (!this.program) {
            this.program = this.gl.createProgram();
        }
    }

    link(...shaders: GLShader[]): void {
        this.create();

        shaders.forEach(s => {
            if (s.glShader) {
                this.gl.attachShader(this.program, s.glShader);
            }
        });

        this.gl.linkProgram(this.program);
        this.gl.validateProgram(this.program);

        const success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
        if (!success) {
            let message = this.gl.getProgramInfoLog(this.program);
            if (message.length === 0) {
                message = 'Unknown error while linking program';
            }
            this.delete();
            throw new GLProgramError(message);
        }
    }

    use(): void {
        if (this.program) {
            this.gl.useProgram(this.program);
        }
    }

    getAttribLocation(name: string): number {
        return this.gl.getAttribLocation(this.program, name);
    }

    getUniformLocation(name: string): WebGLUniformLocation {
        return this.gl.getUniformLocation(this.program, name);
    }

    delete(): void {
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
    }
}
