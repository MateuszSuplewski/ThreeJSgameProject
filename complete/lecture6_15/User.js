import {
  Group,
  Vector3,
  Quaternion,
  AnimationMixer,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
} from "../../libs/three128/three.module.js";
import { GLTFLoader } from "../../libs/three128/GLTFLoader.js";
import { DRACOLoader } from "../../libs/three128/DRACOLoader.js"; //zmienic assety(sciezki do pliku)
import { SFX } from "../../libs/SFX.js";

class User {
  constructor(game, pos, heading) {
    this.root = new Group();
    this.root.position.copy(pos);
    this.root.rotation.set(0, heading, 0, "XYZ");
    this.startInfo = { pos: pos.clone(), heading };
    this.game = game;
    this.camera = game.camera;
    game.scene.add(this.root);
    this.loadingBar = game.loadingBar;
    this.load();
    this.tmpVec = new Vector3();
    this.tmpQuat = new Quaternion();
    this.speed = 0;
    this.ready = false;
  }

  reset() {
    this.position = this.startInfo.pos;
    this.root.rotation.set(0, this.startInfo.heading, 0, "XYZ");
    this.root.userData.dead = false;
    this.health = 100;
    this.dead = false;
    this.speed = 0;
  }

  set position(pos) {
    this.root.position.copy(pos);
  }

  get position() {
    return this.root.position;
  }

  addSphere() {
    const geometry = new SphereGeometry(0.1, 8, 8);
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new Mesh(geometry, material);
    this.game.scene.add(mesh);
    this.hitPoint = mesh;
    this.hitPoint.visible = false;
  }

  load() {
    const loader = new GLTFLoader().setPath(`${this.game.assetsPath}factory/`); //asset
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("../../libs/three128/draco/");
    loader.setDRACOLoader(dracoLoader);

    // Load a glTF resource
    loader.load(
      // resource URL
      "swinka2.glb",
      // called when the resource is loaded
      (gltf) => {
        this.root.add(gltf.scene);
        this.object = gltf.scene;
        this.object.frustumCulled = false;

        const scale = 1.2;
        this.object.scale.set(scale, scale, scale);

        this.object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.frustumCulled = false;
          }
        });

        this.animations = {};
        gltf.animations.forEach((animation) => {
          this.animations[animation.name.toLowerCase()] = animation;
        });
        this.mixer = new AnimationMixer(gltf.scene);
        this.ready = true;
        this.game.startRendering();
      },
      // called while loading is progressing
      (xhr) => {
        this.loadingBar.update("user", xhr.loaded, xhr.total);
      },
      // called when loading has errors
      (err) => {
        console.error(err);
      }
    );
  }

  initSounds() {
    const assetsPath = `${this.game.assetsPath}factory/sfx/`; //asset
    this.sfx = new SFX(this.game.camera, assetsPath, this.game.listener); //asset
    this.sfx.load("pig_groan", false, 0.8, this.object);
  }

  set action(name) {
    name = name.toLowerCase();
    if (this.actionName == name) return;
    if (name == "shot") {
      this.health -= 25;
      if (this.health > 0) {
        name = "hit";
        this.game.active = false;
        setTimeout(() => (this.game.active = true), 2000);
      } else {
        this.dead = true;
        this.root.userData.dead = true;
        this.game.gameover();
      }

      this.game.ui.health = Math.max(0, Math.min(this.health / 100, 1));
      if (this.sfx) this.sfx.play("pig_groan");
    }
  }

  update(dt) {
    if (this.mixer) this.mixer.update(dt);
  }
}

export { User };
