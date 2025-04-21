import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import GUI from 'lil-gui'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
import capsuleVertexShader from './shaders/capsule/vertex.glsl'
import capsuleFragmentShader from './shaders/capsule/fragment.glsl'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'


const gui = new GUI({width: 340})

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const debugObject = {
    planeColor: '#85d534',
    capsuleColor: '#ffffff'
}

const capsulePosition = new THREE.Vector3(0, 0, 0)
const moveDirection = new THREE.Vector3()
const movementSpeed = 1

//Terrain geometry
const planeGeometry = new THREE.PlaneGeometry(8, 8, 128, 128)
planeGeometry.rotateX(-Math.PI / 2)
//Material

const uniforms = {
    uTime: new THREE.Uniform(0),
    uFrequency: new THREE.Uniform(0.3),
    uMoveOffsetX: new THREE.Uniform(0.0),
    uMoveOffsetZ: new THREE.Uniform(0.0),
    uZoom: new THREE.Uniform(0.7)
}
const planeMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms,

    color: debugObject.planeColor,
    metalness: 0,
    roughness: 1
})


//Mesh
const mesh = new THREE.Mesh(planeGeometry, planeMaterial)

scene.add(mesh)

gui.addColor(debugObject, 'planeColor').name('Terrain Color').onChange(() =>
{
    planeMaterial.color.set(debugObject.planeColor)
})
gui.add(uniforms.uFrequency, 'value').min(0).max(1).step(0.001).name('uFrequency')

//Capsule mesh

const capsuleGeometry = new THREE.CapsuleGeometry( 0.1, 0.1, 16, 16 )

const capsuleMaterial = new THREE.ShaderMaterial( {
    vertexShader: capsuleVertexShader,
    fragmentShader: capsuleFragmentShader,
    uniforms,
    color: debugObject.capsuleColor


} ) 
const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial )
scene.add(capsule)


//Lights
const directionalLight = new THREE.DirectionalLight('#ffffff', 2)
directionalLight.position.set(2, 11, 4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 30
directionalLight.shadow.camera.top = 8
directionalLight.shadow.camera.right = 8
directionalLight.shadow.camera.bottom = -8
directionalLight.shadow.camera.left = -8
scene.add(directionalLight)

//sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const keysPressed = {
    w: false, 
    a: false,
    s: false,
    d: false
}

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase()
    if(keysPressed[key] !== undefined) keysPressed[key] = true
})

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase()
    if(keysPressed[key] !== undefined) keysPressed[key] = false
})


window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight
    
        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()
    
        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })
    

//Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-1, 1, 0)
camera.lookAt(0, 0, 0)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enablePan = false
controls.enableZoom = true
controls.enableRotate = true
const axes = new THREE.AxesHelper(5)
scene.add(axes)
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const simplex = new SimplexNoise()

function getElevationAt(x, z) {
    const zoom = uniforms.uZoom.value
    const frequency = uniforms.uFrequency.value
    const px = (x + uniforms.uMoveOffsetX.value + 1.0) * zoom
    const pz = (z + uniforms.uMoveOffsetZ.value + 0.0) * zoom

    let elevation = 0
    elevation += simplex.noise(px * frequency, pz * frequency) / 2
    elevation += simplex.noise(px * frequency * 2, pz * frequency * 2) / 4
    elevation += simplex.noise(px * frequency * 4, pz * frequency * 4) / 8

    return elevation
}

const clock = new THREE.Clock()

const tick = () => 
{
    const deltaTime = clock.getDelta()

    uniforms.uTime.value = clock.getElapsedTime

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)) 
    right.normalize()

    moveDirection.set(0, 0, 0)
    if (keysPressed.w) moveDirection.add(forward)
    if (keysPressed.s) moveDirection.sub(forward)
    if (keysPressed.d) moveDirection.add(right)
    if (keysPressed.a) moveDirection.sub(right)

    if (moveDirection.length() > 0) {
        moveDirection.normalize()
        moveDirection.multiplyScalar(movementSpeed * deltaTime)
        capsulePosition.add(moveDirection)
    }

    const elevation = getElevationAt(capsulePosition.x, capsulePosition.z)
    capsule.position.set(capsulePosition.x, elevation, capsulePosition.z)

    const behind = new THREE.Vector3()
    camera.getWorldDirection(behind)
    behind.y = 0
    behind.normalize()

    // Offset the camera behind the capsule
    const offsetPosition = new THREE.Vector3()
    offsetPosition.copy(capsule.position)
    offsetPosition.addScaledVector(behind, -1.5) // 1.5 units behind
    offsetPosition.y += 1                // 1 units above

    camera.position.lerp(offsetPosition, 0.5) 

    // Always look at capsule
    controls.target.copy(capsule.position)

    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()