import example from 'assets/example.gltf';

export default class GLTFLoader {
    load(): void {
        const version = example.asset.version;
        if (!version.startsWith('2.')) {
            this.notSupported(`glTF version ${version} not supported.`);
        }

        if (!example.meshes?.[0].primitives.length) {
            return;
        }

        example.buffers?.forEach(async (buffer, i) => {
            if (!buffer.uri) {
                this.invalid(`missing buffer uri for buffer ${i}`);
            }
            console.log(await this.loadBufferFromURI(buffer.uri));
        });
    }

    private async loadBufferFromURI(uri: string): Promise<ArrayBuffer> {
        const response = await fetch(uri);
        return await response.arrayBuffer();
    }

    private notSupported(message: string): never {
        throw new Error(message);
    }

    private invalid(message: string): never {
        throw new Error(`Invalid glTF file: ${message}`);
    }
}
