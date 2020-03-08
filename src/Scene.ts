import { Mesh } from './Mesh';
import { mat4 } from 'gl-matrix';

export interface Scene {
    nodes: Array<SceneNode>;
}

export interface SceneNode {
    mesh?: Mesh;
    children: Array<SceneNode>;
    name?: string;
    matrix?: mat4;
}
