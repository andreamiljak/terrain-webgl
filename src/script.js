import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import GUI from 'lil-gui'


const gui = new GUI({width: 340})

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const debugObject = {
    planeColor: '#57B257'
}
//Geometry
const planeGeometry = new THREE.PlaneGeometry(32, 32, 128, 128)

//Material
const planeMaterial = new THREE.MeshBasicMaterial({
    color: debugObject.planeColor
})

//Mesh
const mesh = new THREE.Mesh(planeGeometry, planeMaterial)
mesh.rotation.x -= Math.PI / 2
scene.add(mesh)

gui.addColor(debugObject, 'planeColor').name('Terrain Color').onChange(() =>
{
    planeMaterial.color.set(debugObject.planeColor)
})

//sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

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
camera.position.set(0, 3, 5)
camera.lookAt(0, 0, 0)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)

//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.setSize(sizes.width, sizes.height)

renderer.render(scene, camera)

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//Animate

const clock = new THREE.Clock()

const tick = () => 
{
    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)

}

tick()