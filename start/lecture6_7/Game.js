import * as THREE from '../../libs/three128/three.module.js';
import { GLTFLoader } from '../../libs/three128/GLTFLoader.js';
import { RGBELoader } from '../../libs/three128/RGBELoader.js';
import { NPCHandler } from './NPCHandler.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Pathfinding } from '../../libs/pathfinding/Pathfinding.js';

class Game{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
		this.clock = new THREE.Clock();

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 500 );

		this.camera.position.set( 0, 10, 20 );
        this.camera.lookAt(0, 0, -10);
		
		let col = 0x201510;
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( col );
		this.scene.fog = new THREE.Fog( col, 100, 200 );

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
		this.scene.add(ambient);

        const light = new THREE.DirectionalLight();
        light.position.set( 4, 20, 20 );
		light.target.position.set(-2, 0, 0);
		light.castShadow = true;
		//Set up shadow properties for the light
		light.shadow.mapSize.width = 1024; 
		light.shadow.mapSize.height = 512; 
		light.shadow.camera.near = 0.5; 
		light.shadow.camera.far = 50;
		const d = 30; 
		light.shadow.camera.left = -d;
		light.shadow.camera.bottom = -d*0.25;
		light.shadow.camera.right = light.shadow.camera.top = d;
		this.scene.add(light);
		this.light = light;
	
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.shadowMap.enabled = true;
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();
		
		this.load();
		
		window.addEventListener( 'resize', this.resize.bind(this) );
	}

	initPathfinding(navmesh){
		this.waypoints = [
			new THREE.Vector3(16.836317332513616,0.060003940016031265,-29.390526509545175),
			new THREE.Vector3(-14.130741726917709,0.060003940016031265,-46.631700762265126),
			new THREE.Vector3(-15.198706317565964,0.12882450927131117,-2.6986012862788122),
			new THREE.Vector3(26.331321030266828,0.060003940016031265,-77.85337396698161),   
			new THREE.Vector3(4.085515857586627,0.060003940016031265,8.1028098140725), 
			new THREE.Vector3(90.28622391486289,0.060003940016031265,-2.7605851670515733), 
			new THREE.Vector3(52.06990424375727,0.060003940016031265,7.6876088883489775),
			new THREE.Vector3(80.98735333964716,0.060003940016031265,-71.82889209282159),
			new THREE.Vector3(4.431296590931052,0.06000394001605969,-43.76197843146742),
			new THREE.Vector3( -22.98505034689377,0.060003940016031265,29.68010609990918)
		];
		this.pathfinder = new Pathfinding();
        this.pathfinder.setZoneData('factory', Pathfinding.createZone(navmesh.geometry, 0.02));
		if (this.npcHandler.gltf !== undefined) this.npcHandler.initNPCs();
	}
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight ); 
    }
    
    setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType ).setPath(this.assetsPath);
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        loader.load( 'hdr/factory.hdr', 
		texture => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          this.scene.environment = envMap;

		  this.loadingBar.visible = !this.loadingBar.loaded;
        }, 
		xhr => {
			this.loadingBar.update( 'envmap', xhr.loaded, xhr.total );
		},
		err => {
            console.error( err.message );
        } );
    }
    
	load(){
        this.loadEnvironment();
		this.npcHandler = new NPCHandler(this);
    }

	loadEnvironment(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}factory/`);
        
        this.loadingBar.visible = true;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'MyMap.glb',
			// called when the resource is loaded
			gltf => {

				this.scene.add( gltf.scene );
                this.factory = gltf.scene;
				this.fans = [];

				const mergeObjects = {elements2:[], elements5:[], terrain:[]};

				gltf.scene.traverse( child => {
					if (child.isMesh){
						if (child.name == 'NavMesh'){
							this.navmesh = child;
							this.navmesh.geometry.rotateX(Math.PI/2);
							this.navmesh.quaternion.identity();
							this.navmesh.position.set(0,0,0);
							child.material.transparent = true;
							child.material.opacity = 0.5;
						}
						if (child.name.includes('fan')){
							this.fans.push( child );
						}else if (child.material.name.includes('elements2')){
							mergeObjects.elements2.push(child);
							child.castShadow = true;
						}else if (child.material.name.includes('elements5')){
							mergeObjects.elements5.push(child);
							child.castShadow = true;
						}else if (child.material.name.includes('terrain')){
							mergeObjects.terrain.push(child);
							child.castShadow = true;
						}else if (child.material.name.includes('sand')){
							child.receiveShadow = true;
						}else if ( child.material.name.includes('elements1')){
							child.castShadow = true;
							child.receiveShadow = true;
						}else if (child.parent.name.includes('main')){
							child.castShadow = true;
						}
					}
				});

				this.scene.add(this.navmesh);
				this.initPathfinding(this.navmesh);

				for(let prop in mergeObjects){
					const array = mergeObjects[prop];
					let material;
					array.forEach( object => {
						if (material == undefined){
							material = object.material;
						}else{
							object.material = material;
						}
					});
				}

                this.renderer.setAnimationLoop( this.render.bind(this) );

				this.loadingBar.visible = !this.loadingBar.loaded;
			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.update('environment', xhr.loaded, xhr.total);
				
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}					
    
	startRendering(){
		this.renderer.setAnimationLoop( this.render.bind(this) );
	}

	render() {
		const dt = this.clock.getDelta();

		if (this.fans !== undefined){
            this.fans.forEach(fan => {
                fan.rotateY(dt); 
            });
        }

		if (this.npcHandler !== undefined ) this.npcHandler.update(dt);

        this.renderer.render( this.scene, this.camera );

    }
}

export { Game };