import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import GUI from 'lil-gui'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
import capsuleVertexShader from './shaders/capsule/vertex.glsl'
import capsuleFragmentShader from './shaders/capsule/fragment.glsl'
import { element } from 'three/tsl'


const gui = new GUI({width: 340})

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const debugObject = {
    planeColor: '#85d534',
    capsuleColor: '#ffffff'
}

//Terrain geometry
const planeGeometry = new THREE.PlaneGeometry(8, 8, 500, 500)
planeGeometry.rotateX(-Math.PI / 2)
//Material

const uniforms = {
    uTime: new THREE.Uniform(0),
    uFrequency: new THREE.Uniform(0.3),
    uMoveOffsetX: new THREE.Uniform(0.0),
    uMoveOffsetZ: new THREE.Uniform(0.0),
}
const planeMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms,

    color: debugObject.planeColor,
    metalness: 0,
    roughness: 0.6
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

let moveAmountX = 0
let moveAmountZ = 0
const moveSpeed = 0.02

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

const clock = new THREE.Clock()

const tick = () => 
{
    const elapsedTime = clock.getElapsedTime()

    uniforms.uTime.value = elapsedTime

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)) 
    right.normalize()
   
    if (keysPressed.w) {
        moveAmountX += forward.x * moveSpeed
        moveAmountZ += forward.z * moveSpeed
    }
    if (keysPressed.s) {
        moveAmountX -= forward.x * moveSpeed
        moveAmountZ -= forward.z * moveSpeed
    }
    if (keysPressed.a) {
        moveAmountX -= right.x * moveSpeed
        moveAmountZ -= right.z * moveSpeed
    }
    if (keysPressed.d) {
        moveAmountX += right.x * moveSpeed
        moveAmountZ += right.z * moveSpeed
    }
    uniforms.uMoveOffsetX.value = moveAmountX
    uniforms.uMoveOffsetZ.value = moveAmountZ
    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)

}

tick()