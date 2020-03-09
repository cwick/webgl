import { Mesh } from './Mesh';
import { mat4 } from 'gl-matrix';

export interface Scene {
    readonly nodes: Array<SceneNode>;
}

export interface SceneNode {
    readonly mesh?: Mesh;
    readonly children: Array<SceneNode>;
    readonly name?: string;
    readonly localMatrix?: mat4;
}
