import { NPC } from "./NPC.js";
import { GLTFLoader } from "../../libs/three128/GLTFLoader.js";
import { DRACOLoader } from "../../libs/three128/DRACOLoader.js";
import {
  Skeleton,
  BufferGeometry,
  Line,
  Vector3,
} from "../../libs/three128/three.module.js";

class NPCHandler {
  constructor(game) {
    this.game = game;
    this.loadingBar = this.game.loadingBar;
    this.ready = false;
    this.load();
  }

  reset() {
    this.npcs.forEach((npc) => {
      npc.reset();
    });
  }

  load() {
    const loader = new GLTFLoader().setPath(`${this.game.assetsPath}factory/`); //asset
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("../../libs/three128/draco/");
    loader.setDRACOLoader(dracoLoader);
    this.loadingBar.visible = true;

    loader.load(
      `swat-guy2.glb`,
      (gltf) => {
        if (this.game.pathfinder) {
          this.initNPCs(gltf);
        } else {
          this.gltf = gltf;
        }
      },
      (xhr) => {
        this.loadingBar.update("swat-guy", xhr.loaded, xhr.total);
      },
      (err) => {
        console.error(err);
      }
    );
  }

  initNPCs(gltf = this.gltf) {
    this.waypoints = this.game.waypoints;
    const gltfs = [gltf];

    for (let i = 0; i < 7; i++) gltfs.push(this.cloneGLTF(gltf));

    this.npcs = [];
    gltfs.forEach((gltf) => {
      const object = gltf.scene;
      let rifle, aim;

      object.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.frustumCulled = false;
          if (child.name.includes("Rifle")) rifle = child;
        }
      });

      if (rifle) {
        const geometry = new BufferGeometry().setFromPoints([
          new Vector3(0, 0, 0),
          new Vector3(1, 0, 0),
        ]);

        const line = new Line(geometry);
        line.name = "aim";
        line.scale.x = 50;

        rifle.add(line);
        line.position.set(0, 0, 0.5);
        aim = line;
        line.visible = true;
      }

      const options = {
        object,
        speed: 1.4,
        animations: gltf.animations,
        waypoints: this.waypoints,
        app: this.game,
        showPath: false,
        zone: "adventure", //zmienic zone
        name: "swat-guy",
        rifle,
        aim,
      };

      const npc = new NPC(options);
      npc.object.position.copy(this.randomWaypoint);
      npc.newPath(this.randomWaypoint);
      this.npcs.push(npc);
    });

    this.loadingBar.visible = !this.loadingBar.loaded;
    this.ready = true;
    this.game.startRendering();
  }

  cloneGLTF(gltf) {
    //Method just copied from someone's GitHub to clone models using Three-JS

    const clone = {
      animations: gltf.animations,
      scene: gltf.scene.clone(true),
    };

    const skinnedMeshes = {};

    gltf.scene.traverse((node) => {
      if (node.isSkinnedMesh) {
        skinnedMeshes[node.name] = node;
      }
    });

    const cloneBones = {};
    const cloneSkinnedMeshes = {};

    clone.scene.traverse((node) => {
      if (node.isBone) {
        cloneBones[node.name] = node;
      }
      if (node.isSkinnedMesh) {
        cloneSkinnedMeshes[node.name] = node;
      }
    });

    for (let name in skinnedMeshes) {
      const skinnedMesh = skinnedMeshes[name];
      const skeleton = skinnedMesh.skeleton;
      const cloneSkinnedMesh = cloneSkinnedMeshes[name];
      const orderedCloneBones = [];
      for (let i = 0; i < skeleton.bones.length; ++i) {
        const cloneBone = cloneBones[skeleton.bones[i].name];
        orderedCloneBones.push(cloneBone);
      }
      cloneSkinnedMesh.bind(
        new Skeleton(orderedCloneBones, skeleton.boneInverses),
        cloneSkinnedMesh.matrixWorld
      );
    }

    return clone;
  }

  get randomWaypoint() {
    const index = Math.floor(Math.random() * this.waypoints.length);
    return this.waypoints[index];
  }

  update(dt) {
    if (this.npcs) this.npcs.forEach((npc) => npc.update(dt));
  }
}

export { NPCHandler };
