/**
* @author Amber Roy / http://github.com/amberroy 
*/

VRPlanetChase =	function ( params ) {

	this.mouseDownIntervalID = -1;
	this.redPlanet;
	this.isRedPlanetFound = false;
	this.asteroidsArray;

	this.asteroidMaterial;
	this.redPlanetMaterial;
	this.redPlaentFoundMaterial;
	this.asteroidCollisionMaterial;

	this.clock = new THREE.Clock();
	this.autoMoveForward = true;

};

VRPlanetChase.prototype.init = function() { this._createGameObjects(); };
VRPlanetChase.prototype.update = function() {}; // no-op

//---------------------------------------------------------------------------
// Game Objects
//---------------------------------------------------------------------------

VRPlanetChase.prototype._createGameObjects = function() {
	// Create the game world objects and randomize their position.

	// Need light source with phong material, otherwise spheres look black.
	var pointerOne = new THREE.PointLight(0xffffff);
	pointerOne.position.set(-100,-90,130);
	GameManager.scene.add(pointerOne);

	// For random color: Math.floor(Math.random() * 0x1000000
	var COLOR_BLUE = 0x0000ff;
	var COLOR_RED = 0xff0000;
	var COLOR_GRAY = 0x808080;
	var COLOR_GOLD = 0xFFD700;
	var NUM_ASTEROIDS = 200;

	// Use sphere with shiny phong material, requries a light source.
	// SphereGeometry params: radius, widthSegments, heightSegments
	// Phong params: color, specular(color), shininess
	//var geometry = new THREE.SphereGeometry( 50, 16, 16);
	var geometry = new THREE.SphereGeometry( 50, 16, 50);

	this.asteroidMaterial = new THREE.MeshPhongMaterial({ color: COLOR_GRAY });
	this.redPlanetMaterial = new THREE.MeshPhongMaterial({ color: COLOR_RED });
	this.redPlaentFoundMaterial = new THREE.MeshPhongMaterial({ color: COLOR_BLUE });
	this.asteroidCollisionMaterial = new THREE.MeshPhongMaterial({ color: COLOR_GOLD });

	this.asteroidsArray = [];								// Used for collision detection.

	// Create the asteroids.
	for (var i = 0; i < NUM_ASTEROIDS; i ++) {

		var asteroid = new THREE.Mesh(geometry, this.asteroidMaterial);
		this._setRandomPosition(asteroid);

		this.asteroidsArray.push(asteroid);
	}

	// Create the planet.
	this.redPlanet = new THREE.Mesh(geometry, this.redPlanetMaterial);
	this._setRandomPosition(this.redPlanet);

	for (var i=0; i < this.asteroidsArray.length; i++) {
		GameManager.scene.add( this.asteroidsArray[i] );
	}
	GameManager.scene.add(this.redPlanet);

};

VRPlanetChase.prototype._setRandomPosition = function(mesh) {
		mesh.position.x = Math.random() * 2000 - 1000;
		mesh.position.y = Math.random() * 2000 - 1000;
		mesh.position.z = Math.random() * 2000 - 1000;
		mesh.rotation.x = Math.random() * 2 * Math.PI;
		mesh.rotation.y = Math.random() * 2 * Math.PI;
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();
};

VRPlanetChase.prototype._checkCollision = function(cameraPosition) {
	// Simple collision detection algorithm.

	var isCollision = false;

	// Check for collision between camera and each asteroid.	
	var asteroidBuffer = 0;
	for (var i = 0; i < this.asteroidsArray.length; i++) {
		var sphere = this.asteroidsArray[i];
		var distance = cameraPosition.distanceTo(sphere.position);
		if (distance < sphere.geometry.boundingSphere.radius + asteroidBuffer) {
			isCollision = true;
			console.log("Collision with sphere", i, "radius", sphere.geometry.radius);
			console.log("camera position", cameraPosition);
			console.log("sphere position", sphere.position);

			// Collision effect
			sphere.material = this.asteroidCollisionMaterial;
			setTimeout(function() {
				sphere.material = this.asteroidMaterial;
			}.bind( this ), 2000)
			break;
		}
	}

	// For red planet, detect collision when in the buffer zone, before camera
	// collides, so player can see the planet color change.
	var distance = cameraPosition.distanceTo(this.redPlanet.position);
	var redPlanetBuffer = this.redPlanet.geometry.boundingSphere.radius * 4;
	if (distance < this.redPlanet.geometry.boundingSphere.radius + redPlanetBuffer) {
		isCollision = true;
		if (!this.isRedPlanetFound) {

			// Found it!	Change color.
			this.isRedPlanetFound = true;
			var millis = 500;
			var blinks = 5;
			this.redPlanet.material = this.redPlaentFoundMaterial; 

			// Reset the game. Create new set of asteroids to navigate.
			setTimeout(function() {
				GameManager.scene.remove(this.asteroidsArray);
				GameManager.scene.remove(this.redPlanet);
				this.createGameObjects();
				this.isRedPlanetFound = false;
				// We could reset camera here: camera.lookAt(scene.position)
			}.bind( this ), 2000);	 // Wait a few seconds before restarting.
		}
	}

	if (isCollision) {
		console.log("Collision detected");
	}
	return isCollision;
};

//---------------------------------------------------------------------------
// Game Controls
//---------------------------------------------------------------------------

VRPlanetChase.prototype.onKeyPress = function(event) {
	var MOVE_ON_KEY = 25;
	console.log("keypress", event.which)

	switch (event.which) {

	case 'w'.charCodeAt(0):
		// Walk forward
		moveForward(MOVE_ON_KEY * -1);
		break;

	case 's'.charCodeAt(0):
		// Walk backwards
		moveForward(MOVE_ON_KEY);
		break;

	case 13:
		// "Enter" key was pressed
		launchVR();
		break;

	case 'f'.charCodeAt(0):
		launchVR();
		break;

	case 'z'.charCodeAt(0):
		vrControls.zeroSensor();
		break;
	}		

};

VRPlanetChase.prototype.onKeyDown = function(event) {
	// Keypress not called on arrow keys, handle them here.
	var ROTATE_ANGLE = 10 * (Math.PI / 180);

	switch (event.which) {

	case 37:	// LEFT arrow 
		console.log("keydown LEFT");
		GameManager.camera.rotateOnAxis( new THREE.Vector3(0,1,0), ROTATE_ANGLE);
		break;

	case 39:	// RIGHT arrow 
		console.log("keydown RIGHT");
		GameManager.camera.rotateOnAxis( new THREE.Vector3(0,1,0), ROTATE_ANGLE * -1);
		break;

	case 38:	// UP arrow 
		console.log("keydown UP");
		GameManager.camera.rotateOnAxis( new THREE.Vector3(1,0,0), ROTATE_ANGLE);
		break;

	case 40:	// DOWN arrow 
		console.log("keydown DOWN");
		GameManager.camera.rotateOnAxis( new THREE.Vector3(1,0,0), ROTATE_ANGLE * -1);
		break;

	}

};

VRPlanetChase.prototype.moveForward = function(moveDistance) {

	var movedCamera = GameManager.camera.clone();
	movedCamera.translateZ(moveDistance);

	// Don't let the camera get too far from center of scene.
	var sceneCenterPosition = GameManager.scene.position;
	var distance = movedCamera.position.distanceTo( GameManager.scene.position ); 
	if (distance >= 1500) {
		console.log("Movement stopped, too far from center of scene", distance);
		return;
	}

	if (!this._checkCollision(movedCamera.position)) {
		GameManager.camera.translateZ(moveDistance);
	}
};

VRPlanetChase.prototype.onMouseDown = function(event) {
	// Create timer to repeatedly call method while mouse is down.

	// Tapping screen toggles the auto-move in cardboard mode.
	if (renderMode === modes.cbVR) {
		this.autoMoveForward = !this.autoMoveForward;
	}

	if(this.mouseDownIntervalID == -1) {	// Only create if none exists.
		 // Pass event to the function so we know which button is clicked.
		 var func = function() { whileMouseDown(event); };
		 this.mouseDownIntervalID = setInterval(func, 100); // every 100ms
	 }
};

VRPlanetChase.prototype.onMouseUp = function(event) {
	// When mouse button released, clear the timer.
	 if(this.mouseDownIntervalID != -1) {	// Only clear if exists.
		 clearInterval(this.mouseDownIntervalID);
		 this.mouseDownIntervalID =- 1;
	 }
};

VRPlanetChase.prototype.whileMouseDown = function(event) {
	// While mouse is down, move the camera forward.
	console.log("mouse button", event.which);

	var MOVE_ON_CLICK = -25;
	switch (event.which) {
		case 1:
			// left click: move forwards
			moveForward(MOVE_ON_CLICK);
			break;
		case 2:
			// middle click
			// Back button on Microsoft mouse also sends this; ignore.
			break;
		case 3:
			// right click: move backwards
			moveForward(MOVE_ON_CLICK * -1);
			break;

		default:	
			// Unrecognized button
	}

};


