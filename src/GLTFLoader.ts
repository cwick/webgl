import Scene from './Scene';
// import hello from 'json-loader!assets/test.json';
import foo from 'assets/example.gltf';

export default class GLTFLoader {
    load(): void {
        console.log(foo);
    }
}
