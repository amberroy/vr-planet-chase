// VRPlanetChase - WebVR Game
// For more info see website [http://vrplanetchase.com]
// Author: Amber Roy [http://github.com/amberroy]
//
// Credits:
//
// Theme music:
// Interstellar by Lloyd Boland
// (used with permission of composer)
// * Interstellar [https://soundcloud.com/lloydboland/interstellar-unfinished]
//
// Sound Effects from FreeSound.org [http://www.freesound.org]
// * sci-fi-victory [people/LittleRobotSoundFactory/sounds/270528]
// * sci-fi-crash [people/korgchops/sounds/170635/]
// * sci-fi-warp [people/LittleRobotSoundFactory/sounds/270524]
//
// Textures:
// * RockPerforated [http://www.cgtextures.com/texview.php?id=38675&PHPSESSID=oldd4h4s24tovt8avisojo2vq5]
// * RedRock [http://fc09.deviantart.net/fs45/i/2009/111/6/6/Red_Rock_Texture_by_Dachande99.jpg]
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
	this.soundCrash;
	this.musicTheme;

	// Constants

	this.asteroidRadius = 50;

	this.colors = {
		BLUE: 0x0000ff,
		RED: 0xff0000,
		GRAY: 0x808080,
		GOLD: 0xFFD700,
	};

	this.capsuleMaterial = new THREE.MeshBasicMaterial(
		//{ wireframe: true, side: THREE.DoubleSide }
		{ side: THREE.DoubleSide,
		  map: THREE.ImageUtils.loadTexture( "./assets/images/spaceship-texture.png" ),
		  transparent: true,
		  opacity: 0.5,
		}
	);
	this.capsuleMaterialCrash = new THREE.MeshBasicMaterial(
		{ side: THREE.DoubleSide,
		  map: THREE.ImageUtils.loadTexture( "./assets/images/spaceship-texture.png" ),
		  transparent: true,
		  color: this.colors.RED,
		  opacity: 0.8,
		}
	);
	this.capsuleMaterialVictory = new THREE.MeshBasicMaterial(
		{ side: THREE.DoubleSide,
		  map: THREE.ImageUtils.loadTexture( "./assets/images/spaceship-texture.png" ),
		  transparent: true,
		  color: this.colors.GOLD,
		  opacity: 0.8,
		}
	);

};

VRPlanetChase.prototype.init = function() { 

	var audioDir = "./assets/sounds/";
	this.soundWarp = GameManager.loadAudio(audioDir + 'sci-fi-warp');
	this.soundVictory = GameManager.loadAudio(audioDir + 'sci-fi-victory');
	this.soundCrash = GameManager.loadAudio(audioDir + 'sci-fi-crash');
	this.musicTheme = GameManager.loadAudio(audioDir + 'Interstellar');

	this._createCockpit();
	this._createFlyControls();

	// Need light source with phong material, otherwise spheres look black.
	var pointerOne = new THREE.PointLight(0xffffff);
	pointerOne.position.set(-100,-90,130);
	GameManager.scene.add(pointerOne);

	this._createStars();
	this._createGameObjects();

	this.musicTheme.autoplay = true;
	this.musicTheme.loop = true;
};

VRPlanetChase.prototype.update = function() {

	var delta = this.clock.getDelta();
	this.flyControls.update( delta );

	this.redPlanet.rotation.y += 0.001;

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
		//new THREE.MeshBasicMaterial( { wireframe: true, side: THREE.DoubleSide } )
		this.capsuleMaterial
	);
    this.capsuleMesh.rotation.x =  -1 * Math.PI / 2;
	this.cockpit.add( this.capsuleMesh );

	var backWallMesh = new THREE.Mesh(
    	new THREE.CircleGeometry( bottom, heightSeg ),
		this.capsuleMaterial
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

	this.isRedPlanetFound = false;

	console.log("Creating new asteroid field");

	// Create the game world objects and randomize their position.

	var NUM_ASTEROIDS = 100;

	// Use sphere with shiny phong material, requries a light source.
	// SphereGeometry params: radius, widthSegments, heightSegments
	// Phong params: color, specular(color), shininess
	//var geometry = new THREE.SphereGeometry( 50, 16, 16);
	var asteroidGeo = new THREE.SphereGeometry( this.asteroidRadius, 16, 50);

	this.asteroidMaterial = new THREE.MeshPhongMaterial(
		{ map: THREE.ImageUtils.loadTexture( "./assets/images/RockPerforated.jpg" ) }
	);
	this.redPlanetMaterial = new THREE.MeshPhongMaterial(
		{ map: THREE.ImageUtils.loadTexture( "./assets/images/RedRock.jpg" ) }
	);
	this.redPlaentFoundMaterial = new THREE.MeshPhongMaterial({ color: this.colors.BLUE });
	this.asteroidCollisionMaterial = new THREE.MeshPhongMaterial({ color: this.colors.GOLD });

	this.asteroidsArray = [];								// Used for collision detection.

	// Create the asteroids.
	for (var i = 0; i < NUM_ASTEROIDS; i ++) {

		var asteroid = new THREE.Mesh( asteroidGeo, this.asteroidMaterial );
		this._setRandomPosition(asteroid);
		asteroid.matrixAutoUpdate = false; // Remove this if asteroids rotate.

		this.asteroidsArray.push(asteroid);
	}

	// Create the planet.
	var planetGeo = new THREE.SphereGeometry( this.asteroidRadius * 2, 16, 50 );
	this.redPlanet = new THREE.Mesh( planetGeo, this.redPlanetMaterial );
	this._setRandomPosition( this.redPlanet );

	for (var i=0; i < this.asteroidsArray.length; i++) {
		GameManager.scene.add( this.asteroidsArray[i] );
	}
	GameManager.scene.add(this.redPlanet);

};


VRPlanetChase.prototype._createStars = function() {
	// based on http://threejs.org/examples/misc_controls_fly.html

	var r = this.asteroidRadius; 	// for scaling star to match scene

	var i, starsGeometry = [ new THREE.Geometry(), new THREE.Geometry() ];

	for ( i = 0; i < 250; i ++ ) {

		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * 2 - 1;
		vertex.y = Math.random() * 2 - 1;
		vertex.z = Math.random() * 2 - 1;
		vertex.multiplyScalar( r );

		starsGeometry[ 0 ].vertices.push( vertex );

	}

	for ( i = 0; i < 1500; i ++ ) {

		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * 2 - 1;
		vertex.y = Math.random() * 2 - 1;
		vertex.z = Math.random() * 2 - 1;
		vertex.multiplyScalar( r );

		starsGeometry[ 1 ].vertices.push( vertex );

	}

	var stars;
	var starsMaterials = [
		new THREE.PointCloudMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
		new THREE.PointCloudMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
		new THREE.PointCloudMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
		new THREE.PointCloudMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
		new THREE.PointCloudMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
		new THREE.PointCloudMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
	];

	for ( i = 10; i < 30; i ++ ) {

		stars = new THREE.PointCloud( starsGeometry[ i % 2 ], starsMaterials[ i % 6 ] );

		stars.rotation.x = Math.random() * 6;
		stars.rotation.y = Math.random() * 6;
		stars.rotation.z = Math.random() * 6;

		s = i * 10;
		stars.scale.set( s, s, s );

		stars.matrixAutoUpdate = false;
		stars.updateMatrix();

		GameManager.scene.add( stars );

	}
};

VRPlanetChase.prototype._setRandomPosition = function(mesh) {
		mesh.position.x = Math.random() * 2000 - 1000;
		mesh.position.y = Math.random() * 2000 - 1000;
		mesh.position.z = Math.random() * 2000 - 1000;
		mesh.rotation.x = Math.random() * 2 * Math.PI;
		mesh.rotation.y = Math.random() * 2 * Math.PI;
		mesh.rotation.z = Math.random() * 2 * Math.PI;
		mesh.updateMatrix();
};

VRPlanetChase.prototype.checkCollision = function(cameraPosition) {
	// Simple collision detection algorithm.

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
			collisionInfo.collisionObject = sphere;
			console.log("Collision with sphere", i, "radius", sphere.geometry.radius);
			console.log("camera position", cameraPosition);
			console.log("sphere position", sphere.position);

			break;
		}
	}

	// For red planet, detect collision when in the buffer zone, before camera
	// collides, so player can see the planet color change.
	var distance = cameraPosition.distanceTo(this.redPlanet.position);
	var redPlanetBuffer = this.redPlanet.geometry.boundingSphere.radius * 1;
	if (distance < this.redPlanet.geometry.boundingSphere.radius + redPlanetBuffer) {
		collisionInfo.collisionObject = this.redPlanet;
		collisionInfo.isRedPlanet = true;
	}

	// if (isCollision) { //
	if ( collisionInfo.collisionObject ) { //
		console.log("Collision detected", collisionInfo.collisionObject);
	}

	// If collision, return collisionInfo object, else return null.
	return collisionInfo.collisionObject ? collisionInfo : null;
};

VRPlanetChase.prototype.collisionCallback = function( collisionInfo ) {

	// Collision Effect

	if ( collisionInfo.isRedPlanet ) {

		if ( this.isRedPlanetFound ) {
			// We are in the process of resetting the game.
			return ;
		}

		this.isRedPlanetFound = true;

		this.capsuleMesh.material = this.capsuleMaterialVictory;
		setTimeout(function() {
			this.capsuleMesh.material = this.capsuleMaterial;
		}.bind( this ), 3000)

		this.soundVictory.play();

		// Reset the game. Create new set of asteroids to navigate.
		setTimeout(function() {

			this.soundWarp.play();
			GameManager.scene.remove(this.asteroidsArray);
			GameManager.scene.remove(this.redPlanet);

			// Start player back at center
			this.player.position.copy( GameManager.scene.position );

			this._createGameObjects();
			this.isRedPlanetFound = false;

		}.bind( this ), 3000);	 // Wait a few seconds before restarting.

	} else {

		this.capsuleMesh.material = this.capsuleMaterialCrash;
		setTimeout(function() {
			this.capsuleMesh.material = this.capsuleMaterial;
			GameManager.scene.remove( capsuleMeshClone );
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

