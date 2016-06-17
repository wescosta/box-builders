import * as THREE from 'three.js'
import * as Detector from './lib/Detector'
import {noop} from './utils'

class Ambient {
  constructor(){
    this.container = document.createElement('div')
    document.body.appendChild(this.container)

    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    this.camera.position.set( 500, 800, 1300 );
    this.camera.lookAt( new THREE.Vector3() );

    this.objects = [];
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.plane = null

    // roll-over helpers
    this.rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
    this.rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
    this.rollOverMesh = new THREE.Mesh( this.rollOverGeo, this.rollOverMaterial );
    this.scene.add( this.rollOverMesh );

    // cubes
    this.cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
    this.cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c, map: new THREE.TextureLoader().load( "textures/square-outline-textured.png" ) } );

    this.isShiftDown = false
    this.callbacks = {}
  }

  init() {
    if ( ! Detector.webgl )
      return Detector.addGetWebGLMessage()

    var info = document.createElement( 'div' )
    info.style.position = 'absolute'
    info.style.top = '10px'
    info.style.width = '100%'
    info.style.textAlign = 'center'
    info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js</a> - voxel painter<br><strong>click</strong>: add voxel, <strong>shift + click</strong>: remove voxel, <a href="javascript:save()">save .png</a>'

    this.container.appendChild( info )

    // grid

    var size = 500, step = 50;

    var geometry = new THREE.Geometry();

    for ( var i = - size; i <= size; i += step ) {

      geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
      geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

      geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
      geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );

    }

    var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2, transparent: true } );

    var line = new THREE.LineSegments( geometry, material );
    this.scene.add( line );

    //
    var geometry = new THREE.PlaneBufferGeometry( 1000, 1000 );
    geometry.rotateX( - Math.PI / 2 );

    this.plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
    this.scene.add( this.plane );
    this.objects.push( this.plane );

    // Lights
    var ambientLight = new THREE.AmbientLight( 0x606060 );
    this.scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
    this.scene.add( directionalLight );

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setClearColor( 0xf0f0f0 );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.container.appendChild( this.renderer.domElement );

    document.addEventListener( 'mousemove', this.onDocumentMouseMove.bind(this), false );
    document.addEventListener( 'mousedown', this.onDocumentMouseDown.bind(this), false );
    document.addEventListener( 'keydown', this.onDocumentKeyDown.bind(this), false );
    document.addEventListener( 'keyup', this.onDocumentKeyUp.bind(this), false );

    window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

    this.render()

    return this
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  onDocumentMouseDown( event ) {
    event.preventDefault();

    this.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    this.raycaster.setFromCamera( this.mouse, this.camera );

    var intersects = this.raycaster.intersectObjects( this.objects );

    if ( intersects.length > 0 ) {

      var intersect = intersects[ 0 ];

      // delete cube

      if ( this.isShiftDown ) {

        if ( intersect.object != this.plane ) {
          this.scene.remove( intersect.object );
          this.objects.splice( this.objects.indexOf( intersect.object ), 1 );
        }

      // create cube

      } else {

        this.add(intersect)

      }

      this.render();

    }
  }

  onDocumentMouseMove( event ) {
    event.preventDefault();

    this.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    this.raycaster.setFromCamera( this.mouse, this.camera );

    var intersects = this.raycaster.intersectObjects( this.objects );

    if ( intersects.length > 0 ) {

      var intersect = intersects[ 0 ];

      this.rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
      this.rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

    }

    this.render();

  }

  onDocumentKeyDown( event ) {
    switch( event.keyCode ) {
      case 16: this.isShiftDown = true; break;
    }
  }

  onDocumentKeyUp( event ) {
    switch( event.keyCode ) {
      case 16: this.isShiftDown = false; break;
    }
  }

  save(){
    window.open( this.renderer.domElement.toDataURL('image/png'), 'mywindow' )
    return false
  }

  render() {
    this.renderer.render( this.scene, this.camera )
  }

  add(box){
    let {point, face} = box

    var voxel = new THREE.Mesh( this.cubeGeo, this.cubeMaterial );
    voxel.position.copy( point ).add( face.normal );
    voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

    this.scene.add( voxel );
    this.objects.push( voxel );

    (this.callbacks.add || noop)({
      point,
      face
    })

    this.render()
  }

  on(event, callback){
    this.callbacks[event] = callback || noop
    return this
  }
}

export default new Ambient()