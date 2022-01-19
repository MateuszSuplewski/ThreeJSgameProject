import {
  Object3D,
  Vector3,
  Quaternion,
  Raycaster,
} from "../../libs/three128/three.module.js";

class Controller {
  constructor(game) {
    this.camera = game.camera;
    this.clock = game.clock;
    this.user = game.user;
    this.target = game.user.root;
    this.navmesh = game.navmesh;
    this.game = game;

    this.raycaster = new Raycaster();
    this.move = { up: 0, right: 0 };
    this.tmpVec3 = new Vector3();
    this.tmpQuat = new Quaternion();
    this.cameraBase = new Object3D();
    this.cameraBase.position.copy(this.camera.position);
    this.cameraBase.quaternion.copy(this.camera.quaternion);
    this.target.attach(this.cameraBase);
    this.yAxis = new Vector3(0, 1, 0);
    this.xAxis = new Vector3(1, 0, 0);
    this.forward = new Vector3(0, 0, 1);
    this.down = new Vector3(0, -1, 0);
    this.speed = 10;

    document.addEventListener("keydown", this.keyDown.bind(this));
    document.addEventListener("keyup", this.keyUp.bind(this));

    this.keys = {
      w: false,
      a: false,
      d: false,
      s: false,
    };
  }

  keyDown(e) {
    let repeat = false;
    if (e.repeat !== undefined) {
      repeat = e.repeat;
    }
    switch (e.keyCode) {
      case 87:
        this.keys.w = true;
        break;
      case 65:
        this.keys.a = true;
        break;
      case 83:
        this.keys.s = true;
        break;
      case 68:
        this.keys.d = true;
        break;
    }
  }

  keyUp(e) {
    switch (e.keyCode) {
      case 87:
        this.keys.w = false;
        if (!this.keys.s) this.move.up = 0;
        break;
      case 65:
        this.keys.a = false;
        if (!this.keys.d) this.move.right = 0;
        break;
      case 83:
        this.keys.s = false;
        if (!this.keys.w) this.move.up = 0;
        break;
      case 68:
        this.keys.d = false;
        if (!this.keys.a) this.move.right = 0;
        break;
    }
  }

  onMove(up, right) {
    this.move.up = up;
    this.move.right = -right;
  }

  keyHandler() {
    if (this.keys.w) this.move.up += 0.1;
    if (this.keys.s) this.move.up -= 0.1;
    if (this.keys.a) this.move.right += 0.1;
    if (this.keys.d) this.move.right -= 0.1;
    if (this.move.up > 1) this.move.up = 1;
    if (this.move.up < -1) this.move.up = -1;
    if (this.move.right > 1) this.move.right = 1;
    if (this.move.right < -1) this.move.right = -1;
  }

  // Might be able to optimize it
  update(dt = 0.0167) {
    let playerMoved = false;
    let speed;

    if (!this.game.active) {
      this.user.speed = 0;
    } else {
      if (this.keys) {
        this.keyHandler();
      }

      if (this.move.up != 0) {
        const forward = this.forward
          .clone()
          .applyQuaternion(this.target.quaternion);
        speed = this.move.up > 0 ? this.speed * dt : this.speed * dt * 0.3;
        speed *= this.move.up;
        const pos = this.target.position
          .clone()
          .add(forward.multiplyScalar(speed));
        pos.y += 2;
        this.raycaster.set(pos, this.down);
        const intersects = this.raycaster.intersectObject(this.navmesh);
        if (intersects.length > 0) {
          this.target.position.copy(intersects[0].point);
          playerMoved = true;
        }
      }
      if (Math.abs(this.move.right) > 0.1) {
        const theta = dt * (this.move.right - 0.1) * 1;
        this.target.rotateY(theta);
        playerMoved = true;
      }
      if (playerMoved) {
        this.cameraBase.getWorldPosition(this.tmpVec3);
        this.camera.position.lerp(this.tmpVec3, 1);
      }
      let lerpSpeed = 0.7;
      this.cameraBase.getWorldPosition(this.tmpVec3);
      this.cameraBase.getWorldQuaternion(this.tmpQuat);
      this.camera.position.lerp(this.tmpVec3, lerpSpeed);
      this.camera.quaternion.slerp(this.tmpQuat, lerpSpeed);
    }
  }
}

export { Controller };
