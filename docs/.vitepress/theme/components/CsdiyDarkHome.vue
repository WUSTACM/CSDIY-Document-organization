<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { InteractionManager } from 'three/addons/interaction/InteractionManager.js'
import {
  installHtmlTextureCompatibility,
  type HtmlCanvas
} from '../html-texture-compatibility'

type FeatureKey = '路线' | '资源' | '共建'

type LightRig = {
  spot: THREE.SpotLight
  bulbLight: THREE.PointLight
  bulbMaterial: THREE.MeshStandardMaterial
  glowMaterial: THREE.SpriteMaterial
  undersideMaterial: THREE.MeshStandardMaterial
  actionLight: THREE.PointLight
  actionGlowMaterial: THREE.SpriteMaterial
}

const FEATURES: Record<FeatureKey, string> = {
  路线: '从编程基础、系统课程到真实项目，为 WUST 同学整理一条可以持续推进的 CS 自学路线。',
  资源: '把课程、书籍、实验、项目与工具集中成一张可直接使用、持续更新的学习地图。',
  共建: '记录真实的学习过程、踩坑与修正，让后来者站在更清晰的起点继续前进。'
}

const COLOR_PRESETS = ['#ffb36b', '#ffd59a', '#82d7ff', '#b49cff', '#ff6f8f']
const INITIAL_LIGHT = {
  enabled: true,
  angle: 50,
  brightness: 1450,
  color: '#ffb36b'
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const pageSourceRef = ref<HTMLDivElement | null>(null)
const primaryActionRef = ref<HTMLAnchorElement | null>(null)
const ready = ref(false)
const error = ref('')
const activeFeature = ref<FeatureKey>('路线')
const actionHighlighted = ref(false)
const lighting = reactive({ ...INITIAL_LIGHT })

const surfaceStyle = computed(() => ({ '--lamp-color': lighting.color }))
const activeDescription = computed(() => FEATURES[activeFeature.value])

let disposeScene: (() => void) | undefined
let repaintScene: (() => void) | undefined
let resetSceneMotion: (() => void) | undefined
let updateSceneLight: (() => void) | undefined

function setFeature(feature: FeatureKey) {
  activeFeature.value = feature
}

function resetLight() {
  Object.assign(lighting, INITIAL_LIGHT)
  resetSceneMotion?.()
}

watch(
  [
    activeFeature,
    actionHighlighted,
    () => lighting.enabled,
    () => lighting.angle,
    () => lighting.brightness,
    () => lighting.color
  ],
  async () => {
    await nextTick()
    updateSceneLight?.()
    repaintScene?.()
  }
)

onMounted(async () => {
  await nextTick()
  const canvas = canvasRef.value as HtmlCanvas | null
  const pageSource = pageSourceRef.value
  const primaryAction = primaryActionRef.value
  if (!canvas || !pageSource || !primaryAction) return

  document.documentElement.classList.add('csdiy-dark-home-ready')
  canvas.setAttribute('layoutsubtree', '')

  try {
    const { installHtmlInCanvasPolyfill } = await import('three-html-render/polyfill')
    installHtmlInCanvasPolyfill()
    installHtmlTextureCompatibility()
    disposeScene = setupScene(canvas, pageSource, primaryAction)
  } catch (sceneError) {
    console.error('CSDIY HTMLTexture experience failed to start.', sceneError)
    error.value = '当前浏览器无法启动 HTMLTexture，已保留普通入口。'
  }
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('csdiy-dark-home-ready')
  disposeScene?.()
  disposeScene = undefined
  repaintScene = undefined
  resetSceneMotion = undefined
  updateSceneLight = undefined
})

function setupScene(
  canvas: HtmlCanvas,
  pageSource: HTMLDivElement,
  primaryAction: HTMLAnchorElement
) {
  let disposed = false
  let animationFrame = 0
  let resizeFrame = 0
  let lastTime = performance.now()
  let accumulator = 0
  let stableFrames = 0
  let pulling = false
  let pullPointerId = -1
  let lastPointerTime = 0
  let pullStrength = 0
  let beamPointerId = -1
  let beamStartX = 0
  let beamStartAngle = lighting.angle
  let beamDragged = false

  const fixedStep = 1 / 120
  const ropeLength = 1.22
  const pageTopToAnchor = 1.13
  const desktopAnchorX = -1.3
  const mobileAnchorX = -0.425
  const down = new THREE.Vector3(0, -1, 0)
  const up = new THREE.Vector3(0, 1, 0)
  const gravity = new THREE.Vector3(0, -9.81, 0)
  const anchor = new THREE.Vector3(desktopAnchorX, 4.7, 1.16)
  const position = new THREE.Vector3(anchor.x, anchor.y - ropeLength, anchor.z + 0.06)
  const previous = position.clone()
  const aimTarget = new THREE.Vector3(0, 0.2, 0.08)
  const pointerVelocity = new THREE.Vector3()
  const lastPointerTarget = aimTarget.clone()
  const currentLightDirection = down.clone()
  const temp = new THREE.Vector3()
  const tempB = new THREE.Vector3()
  const tempC = new THREE.Vector3()
  const velocity = new THREE.Vector3()
  const ropeDirection = new THREE.Vector3()
  const lightDirection = new THREE.Vector3()
  const midpoint = new THREE.Vector3()
  const swingQuaternion = new THREE.Quaternion()
  const lampQuaternion = new THREE.Quaternion()
  const cableQuaternion = new THREE.Quaternion()
  const pointer = new THREE.Vector2()
  const lampNdc = new THREE.Vector3()
  const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.08)
  const raycaster = new THREE.Raycaster()

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
  } catch (rendererError) {
    throw new Error('WebGL renderer creation failed', { cause: rendererError })
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.setClearColor(0x010204, 1)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x010204)
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80)
  camera.position.set(0, 0.2, 13.6)

  const pageGroup = new THREE.Group()
  pageGroup.position.set(0, -0.38, 0)
  scene.add(pageGroup)

  const pageTexture = new THREE.HTMLTexture(pageSource)
  pageTexture.colorSpace = THREE.SRGBColorSpace
  pageTexture.minFilter = THREE.LinearFilter
  pageTexture.magFilter = THREE.LinearFilter
  pageTexture.generateMipmaps = false

  const pageMaterial = new THREE.MeshStandardMaterial({
    map: pageTexture,
    color: 0xc7ccd6,
    roughness: 0.96,
    metalness: 0,
    transparent: true,
    alphaTest: 0.005,
    side: THREE.FrontSide
  })
  const pageMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pageMaterial)
  pageGroup.add(pageMesh)

  const backingMaterial = new THREE.MeshStandardMaterial({
    color: 0x07090e,
    roughness: 0.92,
    metalness: 0.03
  })
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(1.018, 1.028), backingMaterial)
  backing.position.z = -0.035
  pageGroup.add(backing)

  scene.add(new THREE.HemisphereLight(0x71809b, 0x151118, 0.58))
  const fillLight = new THREE.DirectionalLight(0x91a6c8, 0.22)
  fillLight.position.set(-4.8, 5.6, 7.4)
  scene.add(fillLight)

  const lampRoot = new THREE.Group()
  scene.add(lampRoot)

  const ceilingCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.3, 0.11, 24),
    new THREE.MeshStandardMaterial({ color: 0x101218, roughness: 0.64, metalness: 0.7 })
  )
  scene.add(ceilingCap)

  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 1, 10),
    new THREE.MeshStandardMaterial({ color: 0x121318, roughness: 0.5, metalness: 0.55 })
  )
  scene.add(cable)

  const shadeGroup = new THREE.Group()
  lampRoot.add(shadeGroup)
  const shadeProfile = [
    new THREE.Vector2(0.08, 0.08),
    new THREE.Vector2(0.18, 0.02),
    new THREE.Vector2(0.43, -0.1),
    new THREE.Vector2(0.82, -0.25),
    new THREE.Vector2(1.08, -0.36),
    new THREE.Vector2(1.1, -0.41)
  ]
  const shade = new THREE.Mesh(
    new THREE.LatheGeometry(shadeProfile, 48),
    new THREE.MeshStandardMaterial({
      color: 0x101116,
      roughness: 0.36,
      metalness: 0.74,
      side: THREE.DoubleSide
    })
  )
  shadeGroup.add(shade)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.095, 0.027, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0x17191f, roughness: 0.28, metalness: 0.82 })
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = -0.397
  shadeGroup.add(rim)

  const undersideMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(lighting.color).multiplyScalar(0.18),
    emissive: lighting.color,
    emissiveIntensity: 0.42,
    roughness: 0.92,
    side: THREE.DoubleSide
  })
  const underside = new THREE.Mesh(new THREE.CircleGeometry(1.055, 48), undersideMaterial)
  underside.rotation.x = Math.PI / 2
  underside.position.y = -0.385
  shadeGroup.add(underside)

  const connector = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.12, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x9c6744, roughness: 0.44, metalness: 0.66 })
  )
  connector.position.y = 0.08
  shadeGroup.add(connector)

  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd7ad,
    emissive: lighting.color,
    emissiveIntensity: 3.2,
    roughness: 0.2
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12), bulbMaterial)
  bulb.scale.y = 1.2
  bulb.position.y = -0.33
  shadeGroup.add(bulb)

  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = 64
  glowCanvas.height = 64
  const glowContext = glowCanvas.getContext('2d')
  if (glowContext) {
    const gradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.16, 'rgba(255,222,172,.8)')
    gradient.addColorStop(0.46, 'rgba(255,170,94,.22)')
    gradient.addColorStop(1, 'rgba(255,140,70,0)')
    glowContext.fillStyle = gradient
    glowContext.fillRect(0, 0, 64, 64)
  }
  const glowTexture = new THREE.CanvasTexture(glowCanvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: lighting.color,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
  const glow = new THREE.Sprite(glowMaterial)
  glow.position.y = -0.36
  glow.scale.set(0.96, 0.96, 0.96)
  shadeGroup.add(glow)

  const spot = new THREE.SpotLight(
    lighting.color,
    1,
    18,
    THREE.MathUtils.degToRad(lighting.angle),
    0.88,
    2
  )
  spot.power = lighting.brightness
  spot.position.set(0, -0.35, 0)
  spot.target.position.set(0, -7, 0)
  shadeGroup.add(spot, spot.target)

  const bulbLight = new THREE.PointLight(lighting.color, 1, 3.2, 2)
  bulbLight.power = 36
  bulbLight.position.set(0, -0.35, 0)
  shadeGroup.add(bulbLight)

  const actionLight = new THREE.PointLight(lighting.color, 1, 3.2, 2)
  actionLight.power = actionHighlighted.value ? 24 : 12
  pageGroup.add(actionLight)

  const actionGlowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: lighting.color,
    transparent: true,
    opacity: actionHighlighted.value ? 0.2 : 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
  const actionGlow = new THREE.Sprite(actionGlowMaterial)
  actionGlow.scale.set(2.15, 0.92, 1)
  pageGroup.add(actionGlow)

  let actionTransitionActive = false
  let actionTransitionStartedAt = 0
  let actionTransitionStartPower = actionLight.power
  let actionTransitionStartOpacity = actionGlowMaterial.opacity
  let actionTransitionTargetPower = actionLight.power
  let actionTransitionTargetOpacity = actionGlowMaterial.opacity

  const lightRig: LightRig = {
    spot,
    bulbLight,
    bulbMaterial,
    glowMaterial,
    undersideMaterial,
    actionLight,
    actionGlowMaterial
  }

  const interactions = new InteractionManager()
  interactions.connect(renderer, camera)
  interactions.add(pageMesh)

  function wake() {
    stableFrames = 0
    if (!animationFrame && !disposed) {
      lastTime = performance.now()
      animationFrame = requestAnimationFrame(animate)
    }
  }

  function resize() {
    const width = Math.max(1, canvas.clientWidth)
    const height = Math.max(1, canvas.clientHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.2 : 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    const sourceWidth = pageSource.offsetWidth || 1440
    const sourceHeight = pageSource.offsetHeight || 810
    const portrait = height > width * 1.16
    const pageWidth = portrait ? 7.15 : 12.8
    const pageHeight = pageWidth * (sourceHeight / sourceWidth)
    pageMesh.scale.set(pageWidth, pageHeight, 1)
    backing.scale.set(pageWidth, pageHeight, 1)

    const sourceRect = pageSource.getBoundingClientRect()
    const actionRect = primaryAction.getBoundingClientRect()
    const actionU = (actionRect.left - sourceRect.left + actionRect.width / 2) / sourceWidth
    const actionV = (actionRect.top - sourceRect.top + actionRect.height / 2) / sourceHeight
    const actionX = (actionU - 0.5) * pageWidth
    const actionY = (0.5 - actionV) * pageHeight
    actionGlow.position.set(actionX, actionY, 0.09)
    actionLight.position.set(actionX, actionY, 0.72)

    pageGroup.position.y = portrait ? -0.62 : -0.38
    anchor.set(
      portrait ? mobileAnchorX : desktopAnchorX,
      pageGroup.position.y + pageHeight / 2 + pageTopToAnchor,
      portrait ? 1.08 : 1.16
    )
    ceilingCap.position.copy(anchor)
    ceilingCap.position.y += 0.08

    if (!pulling) {
      temp.copy(position).sub(anchor)
      if (temp.lengthSq() < 0.001) temp.copy(down)
      temp.normalize().multiplyScalar(ropeLength)
      position.copy(anchor).add(temp)
      previous.copy(position)
    }

    const fitHeight = pageHeight + 3.05
    const fitWidth = pageWidth + 1.2
    const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const distanceForHeight = fitHeight / (2 * Math.tan(halfFov))
    const distanceForWidth = fitWidth / (2 * Math.tan(halfFov) * camera.aspect)
    const cameraDistance = Math.max(distanceForHeight, distanceForWidth)
    camera.position.set(0, pageGroup.position.y - (portrait ? 0.78 : 0.62), cameraDistance)
    camera.lookAt(0, pageGroup.position.y + (portrait ? -0.04 : 0.06), 0)
    camera.updateMatrixWorld()
    interactions.update()
    canvas.requestPaint?.()
    wake()
  }

  function updateRig() {
    ropeDirection.copy(position).sub(anchor).normalize()
    midpoint.copy(anchor).add(position).multiplyScalar(0.5)
    cable.position.copy(midpoint)
    cable.scale.set(1, ropeLength, 1)
    cableQuaternion.setFromUnitVectors(up, ropeDirection)
    cable.quaternion.copy(cableQuaternion)

    if (pulling) {
      lightDirection.copy(aimTarget).sub(position).normalize()
      currentLightDirection.lerp(lightDirection, 0.32).normalize()
    } else {
      swingQuaternion.setFromUnitVectors(down, ropeDirection)
      lightDirection.copy(down).applyQuaternion(swingQuaternion).normalize()
      currentLightDirection.lerp(lightDirection, 0.14).normalize()
    }
    lampQuaternion.setFromUnitVectors(down, currentLightDirection)
    lampRoot.position.copy(position)
    lampRoot.quaternion.copy(lampQuaternion)
  }

  function stepPhysics() {
    velocity.copy(position).sub(previous).multiplyScalar(pulling ? 0.985 : 0.9948)
    previous.copy(position)
    position.add(velocity).addScaledVector(gravity, fixedStep * fixedStep)

    if (pulling) {
      tempB.copy(aimTarget).sub(anchor).normalize()
      tempB.lerp(down, 1 - pullStrength * 0.82).normalize()
      tempC.copy(tempB).multiplyScalar(ropeLength).add(anchor).sub(position)
      temp.copy(position).sub(anchor).normalize()
      tempC.addScaledVector(temp, -tempC.dot(temp))
      position.addScaledVector(tempC, 52 * fixedStep * fixedStep)
    }

    temp.copy(position).sub(anchor)
    if (temp.lengthSq() < 1e-8) temp.copy(down)
    temp.normalize().multiplyScalar(ropeLength)
    position.copy(anchor).add(temp)

    velocity.copy(position).sub(previous)
    if (pulling) stableFrames = 0
    else if (velocity.lengthSq() < 0.000000014) stableFrames += 1
    else stableFrames = 0
  }

  function animate(time: number) {
    animationFrame = 0
    if (disposed) return
    const delta = Math.min((time - lastTime) / 1000, 0.05)
    lastTime = time
    accumulator = Math.min(accumulator + delta, fixedStep * 5)
    while (accumulator >= fixedStep) {
      stepPhysics()
      accumulator -= fixedStep
    }

    if (actionTransitionActive) {
      const progress = THREE.MathUtils.clamp((time - actionTransitionStartedAt) / 200, 0, 1)
      const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1)
      lightRig.actionLight.power = THREE.MathUtils.lerp(
        actionTransitionStartPower,
        actionTransitionTargetPower,
        easedProgress
      )
      lightRig.actionGlowMaterial.opacity = THREE.MathUtils.lerp(
        actionTransitionStartOpacity,
        actionTransitionTargetOpacity,
        easedProgress
      )
      if (progress >= 1) actionTransitionActive = false
    }

    updateRig()
    interactions.update()
    renderer.render(scene, camera)
    if (pulling || actionTransitionActive || stableFrames < 80) {
      animationFrame = requestAnimationFrame(animate)
    }
  }

  function pointerNdc(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
  }

  function updatePointerTarget(event: PointerEvent) {
    pointerNdc(event)
    if (!raycaster.ray.intersectPlane(interactionPlane, aimTarget)) return false
    lampNdc.copy(position).project(camera)
    const distanceX = (pointer.x - lampNdc.x) * camera.aspect
    const distanceY = pointer.y - lampNdc.y
    pullStrength = THREE.MathUtils.smoothstep(
      Math.sqrt(distanceX * distanceX + distanceY * distanceY),
      0.04,
      0.9
    )
    return true
  }

  function pointerHitsInteractiveControl(event: PointerEvent) {
    pointerNdc(event)
    const intersection = raycaster.intersectObject(pageMesh, false)[0]
    if (!intersection?.uv) return false

    const sourceRect = pageSource.getBoundingClientRect()
    const sourceWidth = pageSource.offsetWidth || sourceRect.width
    const sourceHeight = pageSource.offsetHeight || sourceRect.height
    const sourceX = intersection.uv.x * sourceWidth
    const sourceY = (1 - intersection.uv.y) * sourceHeight

    return Array.from(pageSource.querySelectorAll<HTMLElement>('[data-no-drag]')).some((element) => {
      const rect = element.getBoundingClientRect()
      const left = rect.left - sourceRect.left
      const top = rect.top - sourceRect.top
      return sourceX >= left && sourceX <= left + rect.width && sourceY >= top && sourceY <= top + rect.height
    })
  }

  function onPointerDown(event: PointerEvent) {
    const eventTarget = event.target
    if (eventTarget instanceof Element && eventTarget.closest('[data-no-drag]')) return
    if (pointerHitsInteractiveControl(event)) return

    if (event.button === 2) {
      beamPointerId = event.pointerId
      beamStartX = event.clientX
      beamStartAngle = lighting.angle
      beamDragged = false
      pageSource.classList.add('is-adjusting-beam')
      return
    }
    if (event.button !== 0 || beamPointerId !== -1) return
    if (!updatePointerTarget(event)) return
    pulling = true
    pullPointerId = event.pointerId
    lastPointerTime = performance.now()
    lastPointerTarget.copy(aimTarget)
    pointerVelocity.set(0, 0, 0)
    canvas.classList.add('is-pulling-light')
    wake()
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerId === beamPointerId) {
      const movementX = event.clientX - beamStartX
      if (!beamDragged && Math.abs(movementX) >= 4) beamDragged = true
      if (beamDragged) {
        lighting.angle = THREE.MathUtils.clamp(Math.round(beamStartAngle + movementX * 0.14), 16, 58)
      }
      return
    }
    if (!pulling || event.pointerId !== pullPointerId || !updatePointerTarget(event)) return
    const now = performance.now()
    const elapsed = Math.max(0.008, Math.min(0.05, (now - lastPointerTime) / 1000))
    temp.copy(aimTarget).sub(lastPointerTarget).multiplyScalar(1 / elapsed)
    pointerVelocity.lerp(temp, 0.34)
    lastPointerTarget.copy(aimTarget)
    lastPointerTime = now
    wake()
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId === beamPointerId) {
      const cycleColor = !beamDragged && event.type !== 'pointercancel'
      beamPointerId = -1
      beamDragged = false
      pageSource.classList.remove('is-adjusting-beam')
      if (cycleColor) {
        const currentIndex = COLOR_PRESETS.indexOf(lighting.color.toLowerCase())
        lighting.color = COLOR_PRESETS[(currentIndex + 1) % COLOR_PRESETS.length]
      }
      wake()
      return
    }
    if (!pulling || event.pointerId !== pullPointerId) return
    velocity.copy(position).sub(previous).multiplyScalar(1 / fixedStep)
    temp.copy(position).sub(anchor).normalize()
    pointerVelocity.addScaledVector(temp, -pointerVelocity.dot(temp)).clampLength(0, 6)
    velocity.addScaledVector(pointerVelocity, THREE.MathUtils.lerp(0.055, 0.12, pullStrength))
    tempB.copy(anchor).addScaledVector(down, ropeLength).sub(position)
    tempB.addScaledVector(temp, -tempB.dot(temp))
    if (tempB.lengthSq() > 0.0001) {
      tempB.normalize()
      velocity.addScaledVector(tempB, THREE.MathUtils.lerp(0.32, 1.6, pullStrength))
    }
    velocity.clampLength(0, 4.25)
    previous.copy(position).addScaledVector(velocity, -fixedStep)
    pulling = false
    pullPointerId = -1
    pullStrength = 0
    canvas.classList.remove('is-pulling-light')
    wake()
  }

  function resetMotion() {
    pulling = false
    pullPointerId = -1
    pullStrength = 0
    position.copy(anchor).addScaledVector(down, ropeLength)
    previous.copy(position)
    pointerVelocity.set(0, 0, 0)
    currentLightDirection.copy(down)
    canvas.classList.remove('is-pulling-light')
    beamPointerId = -1
    beamDragged = false
    pageSource.classList.remove('is-adjusting-beam')
    wake()
  }

  function updateLightRig() {
    const color = new THREE.Color(lighting.color)
    lightRig.spot.color.copy(color)
    lightRig.spot.power = lighting.enabled ? lighting.brightness : 0
    lightRig.spot.angle = THREE.MathUtils.degToRad(lighting.angle)
    lightRig.bulbLight.color.copy(color)
    lightRig.bulbLight.power = lighting.enabled ? Math.max(18, lighting.brightness * 0.026) : 0
    lightRig.bulbMaterial.emissive.copy(color)
    lightRig.bulbMaterial.emissiveIntensity = lighting.enabled ? 2.4 + lighting.brightness / 850 : 0.04
    lightRig.glowMaterial.color.copy(color)
    lightRig.glowMaterial.opacity = lighting.enabled ? 0.52 + lighting.brightness / 4200 : 0
    lightRig.undersideMaterial.color.copy(color).multiplyScalar(0.18)
    lightRig.undersideMaterial.emissive.copy(color)
    lightRig.undersideMaterial.emissiveIntensity = lighting.enabled ? 0.22 + lighting.brightness / 7250 : 0.03
    lightRig.actionLight.color.copy(color)
    lightRig.actionGlowMaterial.color.copy(color)
    actionTransitionStartPower = lightRig.actionLight.power
    actionTransitionStartOpacity = lightRig.actionGlowMaterial.opacity
    actionTransitionTargetPower = actionHighlighted.value ? 24 : 12
    actionTransitionTargetOpacity = actionHighlighted.value ? 0.2 : 0.09
    actionTransitionStartedAt = performance.now()
    actionTransitionActive = true
    canvas.requestPaint?.()
    wake()
  }

  function onResize() {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(resize)
  }

  function onContextMenu(event: MouseEvent) {
    event.preventDefault()
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('dblclick', resetMotion)
  canvas.addEventListener('contextmenu', onContextMenu)
  canvas.addEventListener('paint', wake)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('resize', onResize, { passive: true })

  repaintScene = () => {
    canvas.requestPaint?.()
    wake()
  }
  resetSceneMotion = resetMotion
  updateSceneLight = updateLightRig

  void document.fonts.ready.then(() => {
    if (disposed) return
    canvas.requestPaint?.()
    resize()
    updateRig()
    ready.value = true
    wake()
  })

  return () => {
    disposed = true
    cancelAnimationFrame(animationFrame)
    cancelAnimationFrame(resizeFrame)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('dblclick', resetMotion)
    canvas.removeEventListener('contextmenu', onContextMenu)
    canvas.removeEventListener('paint', wake)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    window.removeEventListener('resize', onResize)
    interactions.disconnect()
    pageTexture.dispose()
    glowTexture.dispose()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    })
    glowMaterial.dispose()
    actionGlowMaterial.dispose()
    renderer.dispose()
  }
}
</script>

<template>
  <main class="csdiy-light-experience" aria-label="CSDIY 深色灯光主页" :aria-busy="!ready && !error">
    <canvas ref="canvasRef" class="csdiy-webgl-canvas" aria-label="可拖动吊灯照亮的 CSDIY 首页">
      <div ref="pageSourceRef" class="csdiy-page-source" :style="surfaceStyle">
        <header class="csdiy-page-header">
          <div class="csdiy-page-brand">
            <span class="csdiy-logo-mark">W</span>
            <span>WUST ACM</span>
            <span class="csdiy-brand-suffix">CSDIY KNOWLEDGE BASE</span>
          </div>
          <div class="csdiy-page-status"><span /> DARK STUDY MODE</div>
        </header>

        <div class="csdiy-page-main">
          <section class="csdiy-page-copy" aria-labelledby="csdiy-dark-title">
            <p class="csdiy-page-kicker">OPEN SOURCE · SELF-DIRECTED LEARNING</p>
            <h1 id="csdiy-dark-title">在一束光里，<br><span>找到你的 CS 路线。</span></h1>
            <p class="csdiy-page-subtitle">学习，生活，诗与远方。</p>

            <div class="csdiy-concepts" data-interactive>
              <div class="csdiy-concept-list" role="list" aria-label="CSDIY 核心内容">
                <button
                  v-for="(description, feature, index) in FEATURES"
                  :key="feature"
                  type="button"
                  data-no-drag
                  :class="{ 'is-active': activeFeature === feature }"
                  :aria-pressed="activeFeature === feature"
                  @pointerdown.stop
                  @click="setFeature(feature)"
                >
                  <span>0{{ index + 1 }}</span>{{ feature }}
                </button>
              </div>
              <p class="csdiy-concept-description"><span>{{ activeFeature }}</span>{{ activeDescription }}</p>
            </div>

            <div class="csdiy-actions" data-interactive>
              <a
                ref="primaryActionRef"
                class="primary"
                href="/xuyan"
                data-no-drag
                @pointerdown.stop
                @mouseenter="actionHighlighted = true"
                @mouseleave="actionHighlighted = false"
                @focus="actionHighlighted = true"
                @blur="actionHighlighted = false"
              >进入文档【序言】</a>
              <a href="https://csdiy.wiki/" target="_blank" rel="noreferrer" data-no-drag @pointerdown.stop>GO TO CSDIY ↗</a>
            </div>
          </section>

          <aside class="csdiy-light-controls" data-interactive aria-label="聚光灯控制">
            <div class="csdiy-control-heading">
              <div><p>LIGHT CONTROL</p><span>PHYSICAL SPOT / 01</span></div>
              <button
                type="button"
                data-no-drag
                class="csdiy-power-toggle"
                :class="{ 'is-on': lighting.enabled }"
                :aria-pressed="lighting.enabled"
                @pointerdown.stop
                @click="lighting.enabled = !lighting.enabled"
              ><span />{{ lighting.enabled ? 'ON' : 'OFF' }}</button>
            </div>

            <label class="csdiy-control-row" data-no-drag @pointerdown.stop>
              <span class="csdiy-control-label"><b>BEAM</b><output>{{ lighting.angle }}°</output></span>
              <input v-model.number="lighting.angle" type="range" min="16" max="58" step="1" aria-label="聚光灯角度">
            </label>
            <label class="csdiy-control-row" data-no-drag @pointerdown.stop>
              <span class="csdiy-control-label"><b>BRIGHTNESS</b><output>{{ lighting.brightness }} lm</output></span>
              <input v-model.number="lighting.brightness" type="range" min="300" max="2600" step="50" aria-label="聚光灯亮度">
            </label>
            <div class="csdiy-control-row csdiy-color-control">
              <span class="csdiy-control-label"><b>COLOR</b><output>{{ lighting.color.toUpperCase() }}</output></span>
              <div class="csdiy-color-options">
                <button
                  v-for="color in COLOR_PRESETS"
                  :key="color"
                  type="button"
                  data-no-drag
                  :class="{ 'is-active': lighting.color === color }"
                  :style="{ '--swatch': color }"
                  :aria-label="`设置灯光颜色为 ${color}`"
                  :aria-pressed="lighting.color === color"
                  @pointerdown.stop
                  @click="lighting.color = color"
                />
                <label class="csdiy-custom-color" data-no-drag aria-label="自定义灯光颜色" @pointerdown.stop>
                  <input v-model="lighting.color" type="color">
                  <span>+</span>
                </label>
              </div>
            </div>
            <button type="button" class="csdiy-reset-light" data-no-drag @pointerdown.stop @click="resetLight">RESET LIGHT <span>↗</span></button>
          </aside>
        </div>

        <footer class="csdiy-page-footer">
          <p>LEARN / BUILD / SHARE / REPEAT</p>
          <div class="csdiy-drag-instruction">
            <span class="csdiy-drag-orbit" aria-hidden="true"><i /></span>
            <div><b>拖动灯具 · 右键调光</b><span>右键拖动光束 · 双击复位</span></div>
          </div>
          <p>WUST ACM · OPEN KNOWLEDGE</p>
        </footer>
      </div>
    </canvas>

    <p v-if="ready" class="csdiy-scroll-hint" aria-hidden="true">向下滚动 · 回到默认首页 ↓</p>
    <div v-if="!ready && !error" class="csdiy-scene-status" aria-live="polite"><span />正在准备 HTMLTexture</div>
    <div v-if="error" class="csdiy-scene-error" role="status">
      <p>{{ error }}</p>
      <div><a href="/xuyan">进入文档【序言】</a><a href="https://csdiy.wiki/">GO TO CSDIY</a></div>
    </div>
  </main>
</template>
