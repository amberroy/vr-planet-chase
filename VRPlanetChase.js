// VRPlanetChase - WebVR Game
// For more info see website [http://vrplanetchase.com]
// Author: Amber Roy [http://github.com/amberroy]
// Credits:
// Sound Effects from FreeSound.org [http://www.freesound.org]
// * sci-fi-victory: [people/LittleRobotSoundFactory/sounds/270528]
// * sci-fi-warp [people/LittleRobotSoundFactory/sounds/270524]
// * sci-fi-crash: [people/korgchops/sounds/170635/]
//
// License: MIT License [http://opensource.org/licenses/MIT]
// Copyright (c) 2015 Amber Roy

VRPlanetChase =	function ( params ) {

	this.mouseDownIntervalID = -1;
	this.redPlanet;
	this.isRedPlanetFound = false;
	this.asteroidsArray;

	this.asteroidMaterial;
	this.redPlanetMaterial;
	this.redPlaentFoundMaterial;
	this.asteroidCollisionMaterial;

	this.cockpit;
	this.capsuleMesh;
	this.flyControls;

	this.soundVictory;
	this.soundWarp;

	// Constants

	this.colors = {
		BLUE: 0x0000ff,
		RED: 0xff0000,
		GRAY: 0x808080,
		GOLD: 0xFFD700,
	};

	this.capsuleMaterial = new THREE.MeshBasicMaterial(
		{ wireframe: true, side: THREE.DoubleSide }
	);
	this.capsuleMaterialCrash = new THREE.MeshBasicMaterial(
		{ wireframe: true, side: THREE.DoubleSide, color: this.colors.RED }
	);

};

VRPlanetChase.prototype.init = function() { 

	var audioDir = "./assets/sounds/";
	this.soundWarp = GameManager.loadAudio(audioDir + 'sci-fi-warp');
	this.soundVictory = GameManager.loadAudio(audioDir + 'sci-fi-victory');
	this.soundCrash = GameManager.loadAudio(audioDir + 'sci-fi-crash');

	this._createCockpit();
	this._createFlyControls();
	this._createGameObjects();
};

VRPlanetChase.prototype.update = function() {

	var delta = this.clock.getDelta();
	this.flyControls.update( delta );

} // no-op

VRPlanetChase.prototype._createCockpit = function() {

    this.cockpit = new THREE.Object3D(); // grouping object
    this.cockpit.name = "cockpit";

    var top = 2.0;
    var bottom = 2.5;
    var height = 5.0;
    var radiusSeg = 12;
    var heightSeg = 50;
    var isOpenEnded = true;

    this.capsuleMesh = new THREE.Mesh(
    	new THREE.CylinderGeometry( top, bottom, height, radiusSeg, heightSeg, isOpenEnded ),
		new THREE.MeshBasicMaterial( { wireframe: true, side: THREE.DoubleSide } )
	);
    this.capsuleMesh.rotation.x =  -1 * Math.PI / 2;
	this.cockpit.add( this.capsuleMesh );

	var backWallMesh = new THREE.Mesh(
    	new THREE.CircleGeometry( bottom, heightSeg ),
		new THREE.MeshBasicMaterial( { color: "#222222", side: THREE.DoubleSide } )
	);
	backWallMesh.position.z = height / 2;
	this.cockpit.add( backWallMesh );

	GameManager.scene.add( this.cockpit );

};

VRPlanetChase.prototype._createFlyControls = function() {

	var params = {
		checkCollision: this.checkCollision.bind( this ),
		collisionCallback: this.collisionCallback.bind( this ),
	};

	// Fly controls: [WASD] move, [R|F] up | down,
	// [Q|E] roll, [up|down] pitch, [left|right] yaw
	this.flyControls = new THREE.FlyControls( this.cockpit, document.body, params );
	this.flyControls.movementSpeed = 100;
	this.flyControls.rollSpeed = Math.PI / 24;
	this.flyControls.autoForward = false;
	this.flyControls.dragToLook = true;

	this.cockpit.add( GameManager.player );

	// Clock used to get delta when updating flycontrols.
	this.clock = new THREE.Clock();

};


VRPlanetChase.prototype._createGameObjects = function() {
	// Create the game world objects and randomize their position.

	// Need light source with phong material, otherwise spheres look black.
	var pointerOne = new THREE.PointLight(0xffffff);
	pointerOne.position.set(-100,-90,130);
	GameManager.scene.add(pointerOne);

	// For random color: Math.floor(Math.random() * 0x1000000
	/*
	var COLOR_BLUE = 0x0000ff;
	var COLOR_RED = 0xff0000;
	var COLOR_GRAY = 0x808080;
	var COLOR_GOLD = 0xFFD700;
	*/
	var NUM_ASTEROIDS = 200;

	// Use sphere with shiny phong material, requries a light source.
	// SphereGeometry params: radius, widthSegments, heightSegments
	// Phong params: color, specular(color), shininess
	//var geometry = new THREE.SphereGeometry( 50, 16, 16);
	var geometry = new THREE.SphereGeometry( 50, 16, 50);

	this.asteroidMaterial = new THREE.MeshPhongMaterial({ color: this.colors.GRAY });
	this.redPlanetMaterial = new THREE.MeshPhongMaterial({ color: this.colors.RED });
	this.redPlaentFoundMaterial = new THREE.MeshPhongMaterial({ color: this.colors.BLUE });
	this.asteroidCollisionMaterial = new THREE.MeshPhongMaterial({ color: this.colors.GOLD });

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

VRPlanetChase.prototype.checkCollision = function(cameraPosition) {
	// Simple collision detection algorithm.

	// var isCollision = false; // XXX

	var collisionInfo = {
		collisionObject: null,
		isRedPlanet: false
	};

	// Check for collision between camera and each asteroid.	
	var asteroidBuffer = 5;
	for (var i = 0; i < this.asteroidsArray.length; i++) {
		var sphere = this.asteroidsArray[i];
		var distance = cameraPosition.distanceTo(sphere.position);
		if (distance < sphere.geometry.boundingSphere.radius + asteroidBuffer) {
			// isCollision = true; // XXX
			collisionInfo.collisionObject = sphere;
			console.log("Collision with sphere", i, "radius", sphere.geometry.radius);
			console.log("camera position", cameraPosition);
			console.log("sphere position", sphere.position);

			// Collision effect
			/*
			sphere.material = this.asteroidCollisionMaterial;
			setTimeout(function() {
				sphere.material = this.asteroidMaterial;
			}.bind( this ), 2000)
			*/
			break;
		}
	}

	// For red planet, detect collision when in the buffer zone, before camera
	// collides, so player can see the planet color change.
	var distance = cameraPosition.distanceTo(this.redPlanet.position);
	var redPlanetBuffer = this.redPlanet.geometry.boundingSphere.radius * 4;
	if (distance < this.redPlanet.geometry.boundingSphere.radius + redPlanetBuffer) {
		//isCollision = true; // XXX
		collisionInfo.collisionObject = this.redPlanet;
		collisionInfo.isRedPlanet = true;
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

	// if (isCollision) { //
	if ( collisionInfo.collisionObject ) { //
		console.log("Collision detected", collisionInfo.collisionObject);
	}

	//return isCollision; //XXX

	// If collision, return collisionInfo object, else return null.
	return collisionInfo.collisionObject ? collisionInfo : null;
};

VRPlanetChase.prototype.collisionCallback = function( collisionInfo ) {

	// Collision Effect

	if ( collisionInfo.isRedPlanet ) {
		// TODO
	} else {

		this.capsuleMesh.material = this.capsuleMaterialCrash;
		setTimeout(function() {
			this.capsuleMesh.material = this.capsuleMaterial;
		}.bind( this ), 400)

		this.soundCrash.play();

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

	if (!this.checkCollision(movedCamera.position)) {
		GameManager.camera.translateZ(moveDistance);
	}
};

