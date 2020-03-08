import { Mesh } from './Mesh';

export interface Scene {
    nodes: Array<SceneNode>;
}

export interface SceneNode {
    mesh?: Mesh;
    children: Array<SceneNode>;
    name?: string;
}
