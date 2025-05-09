import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import GUI from 'lil-gui'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
import capsuleVertexShader from './shaders/capsule/vertex.glsl'
import capsuleFragmentShader from './shaders/capsule/fragment.glsl'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'
import grassVertexShader from './shaders/grass/vertex.glsl'
import grassFragmentShader from './shaders/grass/fragment.glsl'


const gui = new GUI({width: 340})

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const debugObject = {
    planeColor: '#619f23',   //619f23   85d534
    capsuleColor: '#ffffff'
}

let cameraFollowEnabled = true
const capsulePosition = new THREE.Vector3(0, 0, 0)
const moveDirection = new THREE.Vector3()
const movementSpeed = 1

const chunkCount = 7
const chunkSize = 8
const chunks = []

const uniforms = {
    uTime: new THREE.Uniform(0),
    uFrequency: new THREE.Uniform(0.15),
    uMoveOffsetX: new THREE.Uniform(0.0),
    uMoveOffsetZ: new THREE.Uniform(0.0),
    uZoom: new THREE.Uniform(0.7),
    uCameraPosition: new THREE.Uniform(new THREE.Vector3()),
    uBottomColor: new THREE.Uniform(new THREE.Color('#4d7326')),
    uTopColor: new THREE.Uniform(new THREE.Color('#a3d977')),
    uPlane: new THREE.Uniform(new THREE.Color(debugObject.planeColor)),
    uGrassRadius: new THREE.Uniform(6.0),
    uCapsulePosition: new THREE.Uniform(new THREE.Vector3())
}
const planeMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms,

    metalness: 0,
    roughness: 1
})

//GRASS

function createGrassPatchGeometry(bladesPerPatch = 25) {
    const baseBlade = new THREE.BufferGeometry()
    const vertices = new Float32Array([
        0, 0.5, 0,
        -0.05, 0, 0,
        0.05, 0, 0
    ])
    baseBlade.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    baseBlade.setIndex([0, 1, 2])

    const patchGeometry = new THREE.BufferGeometry()

    const positions = []
    const offsets = []

    for (let i = 0; i < bladesPerPatch; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.sqrt(Math.random()) * 0.3

        const offsetX = Math.cos(angle) * radius
        const offsetZ = Math.sin(angle) * radius

        for (let j = 0; j < 3; j++) {
            const index = j * 3
            positions.push(
                vertices[index + 0],
                vertices[index + 1],
                vertices[index + 2]
            )
            offsets.push(offsetX, 0, offsetZ)
        }
    }
    patchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    patchGeometry.setAttribute('aLocalOffset', new THREE.Float32BufferAttribute(offsets, 3))

    const indices = []
    for (let i = 0; i < bladesPerPatch; i++) {
        const start = i * 3
        indices.push(start, start + 1, start + 2)
    }
    patchGeometry.setIndex(indices)
    patchGeometry.computeVertexNormals()

    return patchGeometry
}


const grassGeometry = createGrassPatchGeometry(25)


const grassMaterial = new THREE.ShaderMaterial({
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    uniforms: uniforms,
    transparent: true
})

grassMaterial.transparent = true
grassMaterial.alphaTest = 0.05
grassMaterial.depthWrite = true

const grassPatchCount = 3000
let patchPool = []
const grassRadius = 6
const grassMesh = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassPatchCount)
grassMesh.frustumCulled = false
scene.add(grassMesh)

const scales = new Float32Array(grassPatchCount)

const offsets = new Float32Array(grassPatchCount * 3)

grassMesh.geometry.setAttribute(
    'aInstanceOffset',
    new THREE.InstancedBufferAttribute(offsets, 3)
)

grassMesh.geometry.setAttribute(
    'aScale',
    new THREE.InstancedBufferAttribute(scales, 1)
)


//LOD

function getLODLevel(distance) {
    if (distance < 8) return 128
    if (distance < 16) return 96
    if (distance < 24) return 64
    else return 32
}

//Mesh
//chunk system

const geometryCache = {}

function getGeometryForLOD(chunkSegment) {
    if(!geometryCache[chunkSegment]) {
        const geo = new THREE.PlaneGeometry(chunkSize, chunkSize, chunkSegment, chunkSegment)
        geo.rotateX(-Math.PI / 2)
        geometryCache[chunkSegment] = geo
    }
    return geometryCache[chunkSegment]
}

for (let i = -Math.floor(chunkCount / 2); i <= Math.floor(chunkCount/2); i++) {
    for(let j= -Math.floor(chunkCount / 2); j <= Math.floor(chunkCount / 2); j++) {
        const worldOffset = new THREE.Vector2(i * chunkSize, j * chunkSize)
        const dist = worldOffset.length()
        const chunkSegment = getLODLevel(dist)

        const geometry = getGeometryForLOD(chunkSegment)
        const material = planeMaterial.clone()
        material.uniforms.uChunkOffset = new THREE.Uniform(new THREE.Vector2(i * chunkSize, j * chunkSize))

        const mesh = new THREE.Mesh(geometry, material)

        mesh.userData.chunkOffset = new THREE.Vector2(i, j)
        scene.add(mesh)
        chunks.push(mesh)
    }
}

gui.addColor(debugObject, 'planeColor').name('Terrain Color').onChange(() =>
{
    uniforms.uPlane.value.set(debugObject.planeColor)
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
    
window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase()

    if (keysPressed[key] !== undefined) {
        keysPressed[key] = true
    }

    if (key === 'b') {
        cameraFollowEnabled = !cameraFollowEnabled
        console.log('Camera follow:', cameraFollowEnabled)
    }
})
//Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-1, 1, 0)
camera.lookAt(0, 1, 0)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enablePan = false
controls.enableZoom = true
controls.enableRotate = true
const axes = new THREE.AxesHelper(4)
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
    const moveOffsetX = uniforms.uMoveOffsetX.value
    const moveOffsetZ = uniforms.uMoveOffsetZ.value

    let px = (x + moveOffsetX + 2.0) * zoom
    let pz = (z + moveOffsetZ + 0.0) * zoom

    let elevation = 0
    elevation += simplex.noise(px * frequency, pz * frequency) / 2.0
    elevation += simplex.noise(px * frequency * 2.0, pz * frequency * 2.0) / 4.0
    elevation += simplex.noise(px * frequency * 4.0, pz * frequency * 4.0) / 8.0

    elevation *= 2.0
    const elevationSign = Math.sign(elevation)
    elevation = elevationSign * Math.pow(Math.abs(elevation), 2.0)
    return elevation
}

for (let i = 0; i < grassPatchCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random()) * grassRadius
    const offsetX = Math.cos(angle) * radius
    const offsetZ = Math.sin(angle) * radius

    const x = capsulePosition.x + offsetX
    const z = capsulePosition.z + offsetZ
    const y = getElevationAt(x, z)

    patchPool[i] = {
        position: new THREE.Vector3(x, y, z),
        scale: 0.4 + Math.random() * 0.2
    }
}

const clock = new THREE.Clock()

const tick = () => 
{
    const deltaTime = clock.getDelta()

    uniforms.uTime.value = clock.getElapsedTime()

    uniforms.uCameraPosition.value.copy(camera.position)
    uniforms.uCapsulePosition.value.copy(capsulePosition)

    //chunk system
    const currentChunkX = Math.floor((capsulePosition.x + chunkSize / 2) / chunkSize)
    const currentChunkZ = Math.floor((capsulePosition.z + chunkSize / 2) / chunkSize)

    chunks.forEach(chunk => {
        const offset = chunk.userData.chunkOffset
        const newX = (currentChunkX + offset.x) * chunkSize
        const newZ = (currentChunkZ + offset.y) * chunkSize

        chunk.position.set(newX, 0, newZ)

        if (chunk.material.uniforms.uChunkOffset) {
            chunk.material.uniforms.uChunkOffset.value.set(newX, newZ)
        }
    })

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
    uniforms.uMoveOffsetX.value = -capsulePosition.x
    uniforms.uMoveOffsetZ.value = -capsulePosition.z

    const elevation = getElevationAt(capsulePosition.x, capsulePosition.z)
    capsule.position.set(capsulePosition.x, elevation, capsulePosition.z)

    if(cameraFollowEnabled) {
        const behind = new THREE.Vector3()
        camera.getWorldDirection(behind)
        behind.y = 0
        behind.normalize()

        // Offset the camera behind the capsule
        const offsetPosition = new THREE.Vector3()
        offsetPosition.copy(capsule.position)
        offsetPosition.addScaledVector(behind, -1.5) // 1.5 units behind
        offsetPosition.y = capsule.position.y + 1 // 1 units above

        camera.position.lerp(offsetPosition, 0.9) 
        const lookAtPosition = new THREE.Vector3().copy(capsule.position)
        lookAtPosition.y += 0.5 // Look 0.5 unit above the capsule

        // // Always look at capsule
        controls.target.copy(lookAtPosition)
    }
    
    controls.update()
   
    let visibleCount = 0

    for (let i = 0; i < grassPatchCount; i++) {
    const patch = patchPool[i]
    const dx = patch.position.x - capsulePosition.x
    const dz = patch.position.z - capsulePosition.z
    const distSq = dx * dx + dz * dz

    if (distSq > grassRadius * grassRadius) {
        const angle = Math.atan2(dz, dx) + Math.PI
        const newX = capsulePosition.x + Math.cos(angle) * grassRadius
        const newZ = capsulePosition.z + Math.sin(angle) * grassRadius
        const newY = getElevationAt(newX, newZ)

        patch.position.set(newX, newY, newZ)
        patch.scale = 0.4 + Math.random() * 0.2
    }

    offsets[i * 3 + 0] = patch.position.x
    offsets[i * 3 + 1] = patch.position.y
    offsets[i * 3 + 2] = patch.position.z
    scales[i] = patch.scale
    visibleCount++
}
    
    grassMesh.count = visibleCount
    grassMesh.geometry.attributes.aInstanceOffset.needsUpdate = true
    grassMesh.geometry.attributes.aScale.needsUpdate = true

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()