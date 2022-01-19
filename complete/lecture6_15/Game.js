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
import { Raycaster, Vector3 } from "../../libs/three128/three.module.js";

class Game {
  constructor() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    this.clock = new THREE.Clock();

    this.loadingBar = new LoadingBar();
    this.loadingBar.visible = false;

    this.assetsPath = "../../assets/"; //asset

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    this.camera.position.set(-10.6, 1.6, -1.46);
    this.camera.rotation.y = -Math.PI * 0.5;
    this.scene = new THREE.Scene();
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
    this.tmpVec = new THREE.Vector3();
    this.active = false;
    this.CollectedStar = 0;
    this.raycaster = new Raycaster();
    this.speed = 10;
    this.forward = new Vector3(0, 0, 1);
    this.down = new Vector3(0, -1, 0);
    this.elm = document.getElementById("score");
    this.elm.innerHTML = this.CollectedStar;
    window.addEventListener("resize", this.resize.bind(this));
  }

  startGame() {
    this.user.reset();
    this.npcHandler.reset();
    this.ui.health = 1;
    this.active = true;
    this.controller.cameraBase.getWorldPosition(this.camera.position);
    this.controller.cameraBase.getWorldQuaternion(this.camera.quaternion);
    this.elm.innerHTML = this.CollectedStar;
    this.sfx.play("background_music");
  }

  //Should be placed in User.js
  MyIntersectionWithStars() {
    const forward = this.forward
      .clone()
      .applyQuaternion(this.user.root.quaternion);

    const pos = this.user.root.position
      .clone()
      .add(forward.multiplyScalar(this.speed * 0.167));
    pos.y += 2;

    this.raycaster.set(pos, this.forward);
    const intersects3 = this.raycaster.intersectObjects(this.stars);

    this.stars.forEach((star) => {
      let zmienna = star.parent.position;
      if (
        intersects3.length > 0 &&
        Math.abs(pos.x - zmienna.x) < 1 &&
        Math.abs(pos.z - zmienna.z) < 1 &&
        (star.parent.visible = true)
      ) {
        star.parent.visible = false;
        this.CollectedStar++;
      }
    });

    this.elm.innerHTML = this.CollectedStar;
  }

  gameover() {
    this.active = false;
    this.ui.showGameover();
    this.sfx.stop("background_music");
  }

  initPathfinding(navmesh) {
    //dodac wiecej vectorow
    this.waypoints = [
      new THREE.Vector3(
        -88.39995012879542,
        0.060003940016031265,
        47.91087570508797
      ),
      new THREE.Vector3(
        -78.4923082960824,
        0.060003940016031265,
        -23.421633979696786
      ),
      new THREE.Vector3(
        -49.2386501515122,
        0.060003940016031265,
        -61.02422594586551
      ),
      new THREE.Vector3(
        -3.5152614471885553,
        0.060003940016031265,
        -81.69360168132694
      ),
      new THREE.Vector3(
        35.50723672098864,
        0.060003940016031265,
        -75.13682842882199
      ),
      new THREE.Vector3(
        26.08860186626816,
        0.060003940016031265,
        -55.103758868338204
      ),
      new THREE.Vector3(
        86.0872651176034,
        0.060003940016002844,
        -73.2799741960624
      ),
      new THREE.Vector3(
        27.845659836717527,
        0.060003940016031265,
        -30.968487457115998
      ),
      new THREE.Vector3(
        6.326819530558916,
        0.060003940016031265,
        -41.923316754164375
      ),
      new THREE.Vector3(
        5.781401019271186,
        0.060003940016031265,
        -8.860665819624327
      ),
      new THREE.Vector3(
        -23.72337607650453,
        0.1218971951363983,
        0.8565288468841068
      ),
      new THREE.Vector3(
        -43.39227903498295,
        0.06000394001605969,
        38.505916101859356
      ),
      new THREE.Vector3(
        -92.32557881018542,
        0.060003940016031265,
        32.408493517928534
      ),
      new THREE.Vector3(
        90.94193430004039,
        0.060003940016031265,
        46.35813161206724
      ),
      new THREE.Vector3(
        87.8435054023599,
        0.060003940016031265,
        6.109725616217677
      ),
      new THREE.Vector3(
        -12.287028405105879,
        0.06000394001605969,
        44.78899822384498
      ),
      new THREE.Vector3(
        -39.51984523277813,
        0.06000394001605969,
        -18.55243199522927
      ),
      new THREE.Vector3(
        1.3013208969416183,
        0.20942857551091265,
        -0.5635742535391692
      ),
      new THREE.Vector3(
        -57.71466420999785,
        0.060003940016031265,
        -17.10416307072299
      ),
    ];
    this.pathfinder = new Pathfinding();
    this.pathfinder.setZoneData(
      "adventure", // zmienic datazone
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

    let path = "textures/sb_frozen/frozen_";
    let format = ".jpg";
    let urls = [
      path + "ft" + format,
      path + "bk" + format,
      path + "up" + format,
      path + "dn" + format,
      path + "rt" + format,
      path + "lf" + format,
    ];
    let reflectionCube = new THREE.CubeTextureLoader().load(urls);
    reflectionCube.format = THREE.RGBFormat;
    this.scene.background = reflectionCube;
  }

  loadEnvironment() {
    const loader = new GLTFLoader().setPath(`${this.assetsPath}factory/`); //asset
    this.loadingBar.visible = true;
    loader.load(
      "MyMap4.glb",
      (gltf) => {
        this.scene.add(gltf.scene);
        this.factory = gltf.scene; // factory
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
              child.material.opacity = 0;
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
      (xhr) => {
        this.loadingBar.update("environment", xhr.loaded, xhr.total);
      },
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
      `${this.assetsPath}factory/sfx/`, //asset
      this.listener
    );
    this.sfx.load("background_music", true, 0.1);
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

    this.MyIntersectionWithStars();

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
