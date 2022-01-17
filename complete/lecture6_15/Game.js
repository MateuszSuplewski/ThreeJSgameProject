import * as THREE from "../../libs/three128/three.module.js";
import { GLTFLoader } from "../../libs/three128/GLTFLoader.js";
import { NPCHandler } from "./NPCHandler.js";
import { LoadingBar } from "../../libs/LoadingBar.js";
import { Pathfinding } from "../../libs/pathfinding/Pathfinding.js";
import { User } from "./User.js";
import { Controller } from "./Controller.js";
import { BulletHandler } from "./BulletHandler.js";
import { UI } from "./UI.js";
import { SFX } from "../../libs/SFX.js";

class Game {
  constructor() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    this.clock = new THREE.Clock();

    this.loadingBar = new LoadingBar();
    this.loadingBar.visible = false;

    this.assetsPath = "../../assets/";

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    this.camera.position.set(-10.6, 1.6, -1.46);
    this.camera.rotation.y = -Math.PI * 0.5;

    let col = 0x201510;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(col);
    this.scene.fog = new THREE.Fog(col, 100, 200);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.6);
    this.scene.add(ambient);

    const light = new THREE.DirectionalLight();
    light.position.set(0, 100, -180);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 300;
    const d = 160;
    light.shadow.camera.left = -d;
    light.shadow.camera.bottom = -d * 0.55;
    light.shadow.camera.right = light.shadow.camera.top = d;
    this.scene.add(light);
    this.light = light;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(this.renderer.domElement);
    this.load();
    this.raycaster = new THREE.Raycaster();
    this.tmpVec = new THREE.Vector3();
    this.active = false;

    window.addEventListener("resize", this.resize.bind(this));
  }

  startGame() {
    this.user.reset();
    this.npcHandler.reset();
    this.ui.ammo = 1;
    this.ui.health = 1;
    this.active = true;
    this.controller.cameraBase.getWorldPosition(this.camera.position);
    this.controller.cameraBase.getWorldQuaternion(this.camera.quaternion);
    this.sfx.play("atmos");
  }
  /*
  seeUser(pos, seethrough = false) {
    if (this.seethrough) {
      this.seethrough.forEach((child) => {
        child.material.transparent = false;
        child.material.opacity = 1;
        //child.visible = true;
      });
      delete this.seethrough;
    }

    this.tmpVec.copy(this.user.position).sub(pos).normalize();
    this.raycaster.set(pos, this.tmpVec);

    const intersects = this.raycaster.intersectObjects(
      this.factory.children,
      true
    );
    let userVisible = true;

    if (intersects.length > 0) {
      const dist = this.tmpVec.copy(this.user.position).distanceTo(pos);

      if (seethrough) {
        this.seethrough = [];
        intersects.some((intersect) => {
          if (intersect.distance < dist) {
            this.seethrough.push(intersect.object);
            //intersect.object.visible = false;
            intersect.object.material.transparent = true;
            intersect.object.material.opacity = 0.3;
          } else {
            return true;
          }
        });
      } else {
        userVisible = intersects[0].distance > dist;
      }
    }

    return userVisible;
  }
*/
  gameover() {
    this.active = false;
    this.ui.showGameover();
    this.sfx.stop("atmos");
  }

  initPathfinding(navmesh) {
    this.waypoints = [
      new THREE.Vector3(
        17.73372016326552,
        0.39953298254866443,
        -0.7466724607286782
      ),
      new THREE.Vector3(
        20.649478054772402,
        0.04232912113775987,
        -18.282935518174437
      ),
      new THREE.Vector3(
        11.7688416798274,
        0.11264635905666916,
        -23.23102176233945
      ),
      new THREE.Vector3(
        -3.111551689570482,
        0.18245423057147991,
        -22.687392486867505
      ),
      new THREE.Vector3(
        -13.772447796604245,
        0.1260277454451636,
        -23.12237117145656
      ),
      new THREE.Vector3(
        -20.53385139415452,
        0.0904175187063471,
        -12.467546107992108
      ),
      new THREE.Vector3(
        -18.195950790753532,
        0.17323640676321908,
        -0.9593366354062719
      ),
      new THREE.Vector3(
        -6.603208729295872,
        0.015786387893574227,
        -12.265553884212125
      ),
    ];
    this.pathfinder = new Pathfinding();
    this.pathfinder.setZoneData(
      "factory",
      Pathfinding.createZone(navmesh.geometry, 0.02)
    );
    if (this.npcHandler.gltf !== undefined) this.npcHandler.initNPCs();
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  load() {
    this.loadEnvironment();
    this.npcHandler = new NPCHandler(this);
    this.user = new User(this, new THREE.Vector3(-5.97, 0.121, -1.49), 1.57);
    this.ui = new UI(this);
  }

  loadEnvironment() {
    const loader = new GLTFLoader().setPath(`${this.assetsPath}factory/`);

    this.loadingBar.visible = true;

    // Load a glTF resource
    loader.load(
      // resource URL
      "MyMap4.glb",
      // called when the resource is loaded
      (gltf) => {
        this.scene.add(gltf.scene);
        this.factory = gltf.scene;
        this.stars = [];

        const mergeObjects = {
          Material02: [],
          Material03: [],
          Material05: [],
          Material07: [],
          Material09: [],
          Material11: [],
          Material13: [],
          Material14: [],
          Base: [],
        };

        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            if (child.name == "NavMesh") {
              this.navmesh = child;
              this.navmesh.geometry.rotateX(Math.PI / 2);
              this.navmesh.quaternion.identity();
              this.navmesh.position.set(0, 0, 0);
              child.material.transparent = true;
              child.material.opacity = 0.3;
            } else if (child.name.includes("star")) {
              this.stars.push(child);
            } else if (child.material.name.includes("Material02")) {
              mergeObjects.Material02.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Material03")) {
              mergeObjects.Material03.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Material05")) {
              mergeObjects.Material05.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Material07")) {
              mergeObjects.Material07.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Material09")) {
              mergeObjects.Material09.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Material11")) {
              mergeObjects.Material11.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Material13")) {
              mergeObjects.Material13.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Material14")) {
              mergeObjects.Material14.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
            } else if (child.material.name.includes("Base")) {
              child.receiveShadow = true;
            }
          }
        });
        console.log(mergeObjects);
        this.scene.add(this.navmesh);

        for (let prop in mergeObjects) {
          const array = mergeObjects[prop];
          let material;
          array.forEach((object) => {
            if (material == undefined) {
              material = object.material;
            } else {
              object.material = material;
            }
          });
        }

        this.controller = new Controller(this);

        this.renderer.setAnimationLoop(this.render.bind(this));

        this.initPathfinding(this.navmesh);

        this.loadingBar.visible = !this.loadingBar.loaded;
      },
      // called while loading is progressing
      (xhr) => {
        this.loadingBar.update("environment", xhr.loaded, xhr.total);
      },
      // called when loading has errors
      (err) => {
        console.error(err);
      }
    );
  }

  initSounds() {
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    this.sfx = new SFX(
      this.camera,
      `${this.assetsPath}factory/sfx/`,
      this.listener
    );
    this.sfx.load("atmos", true, 0.1);
    this.user.initSounds();
    this.npcHandler.npcs.forEach((npc) => npc.initSounds());
  }

  startRendering() {
    if (
      this.npcHandler.ready &&
      this.user.ready &&
      this.bulletHandler == undefined
    ) {
      this.controller = new Controller(this);
      this.bulletHandler = new BulletHandler(this);
      this.renderer.setAnimationLoop(this.render.bind(this));
      this.ui.visible = true;
      this.initSounds();
    }
  }

  render() {
    const dt = this.clock.getDelta();

    if (this.stars !== undefined) {
      this.stars.forEach((star) => {
        //star.rotateZ(dt);
        star.rotateX(dt);
      });
    }

    if (this.npcHandler !== undefined) this.npcHandler.update(dt);
    if (this.user !== undefined) this.user.update(dt);
    if (this.controller !== undefined) this.controller.update(dt);
    if (this.bulletHandler !== undefined) this.bulletHandler.update(dt);

    this.renderer.render(this.scene, this.camera);
  }
}

export { Game };
