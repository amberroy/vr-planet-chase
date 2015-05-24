/**
* @author Amber Roy / http://github.com/amberroy 
*/


GameManager = function( game, params ) {

	this.init = game && game.init.bind( game ) || this._defaultInit;
	this.update = game && game.update.bind( game ) || this._defaultUpdate;

	this.renderer = new THREE.WebGLRenderer({ antialias: true });
	this.renderer.setPixelRatio( window.devicePixelRatio );
	document.body.appendChild( this.renderer.domElement );

	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.3, 10000 );
	this.vrControls = new THREE.VRControls( this.camera );
	this.vrEffect = new THREE.VREffect( this.renderer );
	this.vrEffect.setSize( window.innerWidth, window.innerHeight );
	this.vrManager = new WebVRManager( this.renderer, this.vrEffect, {hideButton: false} );

	// Don't move the camera, move the player instead.
	this.player = new THREE.Object3D();
	this.head = new THREE.Object3D();
	this.player.add( this.head );
	this.head.add( this.camera );
	this.player.add( this.camera );
	this.scene.add( this.player );

	this._addEventListeners();
};

GameManager.prototype.loadAudio = function(filenameBase) {

	// Reference:
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats
	// http://www.online-convert.com/

	// Load sound effect. Chromium doesn't support mp3 so include wav too.
	var ext = (new Audio()).canPlayType('audio/mpeg') ? ".mp3" : ".wav";
	var audio = new Audio(filenameBase + ext);	
	return audio;

};


GameManager.prototype._defaultInit = function() {

	console.log("GameManager using default init()");

	var gridTileImage = "./assets/images/grid-tile.png"

	// Create 3D objects.
	var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	var material = new THREE.MeshNormalMaterial();
	var cube = new THREE.Mesh(geometry, material);
	cube.name = "cube";
	cube.userData.isRotating = true;

	// Position cube mesh
	cube.position.z = -1;

	// Add cube mesh to your three.js scene
	this.scene.add(cube);

	// Also add a repeating grid as a skybox.
	var boxWidth = 10;
	var texture = THREE.ImageUtils.loadTexture(gridTileImage);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(boxWidth, boxWidth);

	var geometry = new THREE.BoxGeometry(boxWidth, boxWidth, boxWidth);
	var material = new THREE.MeshBasicMaterial({
		map: texture,
		color: 0x333333,
		side: THREE.BackSide
	});

	var skybox = new THREE.Mesh(geometry, material);
	skybox.name = "skybox";
	this.scene.add(skybox);
};


GameManager.prototype._defaultUpdate = function() {

	// Apply rotation objects 
	for (var i=0; i < this.scene.children.length; i++ ) {
		var object = this.scene.children[i];
		if ( object.userData.isRotating ) {
			object.rotation.y += 0.01;
		}
	}	

};

// Request animation frame loop function
GameManager.prototype.animate = function() {

	// Update VR headset position and apply to camera.
	this.vrControls.update();

	// Update game objects
	this.update();

	// Render the scene through the manager.
	this.vrManager.render(this.scene, this.camera);

	requestAnimationFrame( this.animate.bind( this ) );
}

GameManager.prototype._addEventListeners = function () {

	// Reset the position sensor when 'z' pressed.
	function onKey(event) {
		if (event.keyCode == 90) { // z
			this.vrControls.resetSensor();
		}
		if (event.keyCode == 13) { // Enter VR Mode
			this.vrManager.button.emit("click");
		}
	};
	window.addEventListener('keydown', onKey.bind( this ), true);

	// Handle window resizes
	function onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.vrEffect.setSize( window.innerWidth, window.innerHeight );
	}
	window.addEventListener('resize', onWindowResize.bind( this ), false);

};

