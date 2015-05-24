/**
* @author Amber Roy / http://github.com/amberroy 
*/

GameManager = function( game, params ) {

	this.init = game && game.init.bind( game ) || this._defaultInit;
	this.update = game && game.update.bind( game ) || this._defaultUpdate;

	this.renderer = new THREE.WebGLRenderer({ antialias: true });
	this.renderer.setPixelRatio(window.devicePixelRatio );
	document.body.appendChild(this.renderer.domElement );

	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.3, 10000 );
	this.vrControls = new THREE.VRControls( this.camera );
	this.vrEffect = new THREE.VREffect( this.renderer );
	this.vrEffect.setSize( window.innerWidth, window.innerHeight );
	this.vrManager = new WebVRManager( this.renderer, this.vrEffect, {hideButton: false} );

	this._addEventListeners();

	// For vrControlsUpdateFix
	this._ZERO_VECTOR3 = Object.freeze(new THREE.Vector3(0,0,0));
	this._headPosition = this._ZERO_VECTOR3;
	this._headRotationX = 0;
	this._headRotationY = 0;
	this._headRotationZ = 0;
};

GameManager.prototype._defaultInit = function() {

	console.log("GameManager using default init()");

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
	var texture = THREE.ImageUtils.loadTexture(
		'./box.png'
	);
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

GameManager.prototype.vrControlsUpdateFix = function() {	

		var cameraPosition = this.camera.position.clone();
		var lastHeadPosition = this._headPosition;

		var rotationX = this.camera.rotation.x;
		var rotationY = this.camera.rotation.y;
		var rotationZ = this.camera.rotation.z;
		var lastRotationX = this._headRotationX;
		var lastRotationY = this._headRotationY;
		var lastRotationZ = this._headRotationZ;

		vrControls.update();	// Resets camera to absolute head position from HMD.

		this._headPosition = this.camera.position.clone();
		this._headRotationX = this.camera.rotation.x;
		this._headRotationY = this.camera.rotation.y;
		this._headRotationZ = this.camera.rotation.z;

		if (this._headPosition.equals(cameraPosition)) {
			// On Firefox, if no HMD position data, camera is not reset. Force to zero.
			this._headPosition = this._ZERO_VECTOR3;
		}
		// Add any head movement (via positional tracking) to the camera position.
		this.camera.position.set(
			cameraPosition.x + (this._headPosition.x - lastHeadPosition.x),
			cameraPosition.y + (this._headPosition.y - lastHeadPosition.y),
			cameraPosition.z + (this._headPosition.z - lastHeadPosition.z)
		);

		// Add any head turning (via orientation tracking) to the camera rotation.
		this.camera.rotation.set(
			rotationX + (this._headRotationX - lastRotationX), 
			rotationY + (this._headRotationY - lastRotationY), 
			rotationZ + (this._headRotationZ - lastRotationZ),
		"XYZ");

};



