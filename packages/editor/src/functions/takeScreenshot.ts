import {
  _SRGBFormat,
  Camera,
  ClampToEdgeWrapping,
  LinearFilter,
  PerspectiveCamera,
  RGBAFormat,
  sRGBEncoding,
  UnsignedByteType,
  WebGLRenderTarget
} from 'three'

import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { SceneState } from '@etherealengine/engine/src/ecs/classes/Scene'
import { addComponent, defineQuery, getComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { createEntity } from '@etherealengine/engine/src/ecs/functions/EntityFunctions'
import { addEntityNodeChild } from '@etherealengine/engine/src/ecs/functions/EntityTree'
import { EngineRenderer } from '@etherealengine/engine/src/renderer/WebGLRendererSystem'
import { addObjectToGroup } from '@etherealengine/engine/src/scene/components/GroupComponent'
import { ScenePreviewCameraComponent } from '@etherealengine/engine/src/scene/components/ScenePreviewCamera'
import { ObjectLayers } from '@etherealengine/engine/src/scene/constants/ObjectLayers'
import {
  setTransformComponent,
  TransformComponent
} from '@etherealengine/engine/src/transform/components/TransformComponent'
import { getState } from '@etherealengine/hyperflux'
import { KTX2Encoder } from '@etherealengine/xrui/core/textures/KTX2Encoder'

import { EditorState } from '../services/EditorServices'
import { getCanvasBlob } from './thumbnails'

function getResizedCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = width
  tmpCanvas.height = height
  const ctx = tmpCanvas.getContext('2d')
  if (ctx) ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height)
  return tmpCanvas
}

const query = defineQuery([ScenePreviewCameraComponent])

const ktx2Encoder = new KTX2Encoder()

/**
 * Function takeScreenshot used for taking screenshots.
 *
 * @param  {any}  width
 * @param  {any}  height
 * @return {Promise}        [generated screenshot according to height and width]
 */
export async function takeScreenshot(
  width: number,
  height: number,
  format = 'ktx2' as 'png' | 'ktx2' | 'jpeg',
  scenePreviewCamera?: PerspectiveCamera
): Promise<Blob | null> {
  // Getting Scene preview camera or creating one if not exists
  if (!scenePreviewCamera) {
    for (const entity of query()) {
      scenePreviewCamera = getComponent(entity, ScenePreviewCameraComponent).camera
    }

    if (!scenePreviewCamera) {
      const entity = createEntity()
      addComponent(entity, ScenePreviewCameraComponent)
      scenePreviewCamera = getComponent(entity, ScenePreviewCameraComponent).camera
      const { position, rotation } = getComponent(Engine.instance.cameraEntity, TransformComponent)
      setTransformComponent(entity, position, rotation)
      addObjectToGroup(entity, scenePreviewCamera)
      addEntityNodeChild(entity, getState(SceneState).sceneEntity)
      scenePreviewCamera.updateMatrixWorld(true)
    }
  }

  const prevAspect = scenePreviewCamera.aspect

  // Setting up scene preview camera
  scenePreviewCamera.aspect = width / height
  scenePreviewCamera.updateProjectionMatrix()
  scenePreviewCamera.layers.disableAll()
  scenePreviewCamera.layers.set(ObjectLayers.Scene)

  const originalWidth = EngineRenderer.instance.renderer.domElement.width
  const originalHeight = EngineRenderer.instance.renderer.domElement.height

  // Rendering the scene to the new canvas with given size
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      const viewport = EngineRenderer.instance.renderContext.getParameter(
        EngineRenderer.instance.renderContext.VIEWPORT
      )
      const pixelRatio = EngineRenderer.instance.renderer.getPixelRatio()
      if (viewport[2] === width * pixelRatio && viewport[3] === height * pixelRatio) {
        console.log('Resized viewport')
        clearTimeout(timeout)
        clearInterval(interval)
        resolve()
      }
    }, 10)
    const timeout = setTimeout(() => {
      console.warn('Could not resize viewport in time')
      clearTimeout(timeout)
      clearInterval(interval)
      reject()
    }, 10000)

    // set up effect composer
    EngineRenderer.instance.effectComposer.setMainCamera(scenePreviewCamera as Camera)
    EngineRenderer.instance.effectComposer.setSize(width, height, true)
  })

  let blob: Blob | null = null

  if (format === 'ktx2') {
    const renderer = EngineRenderer.instance.renderer
    // todo - support post processing
    // EngineRenderer.instance.effectComposer.setMainCamera(scenePreviewCamera as Camera)
    // const renderer = EngineRenderer.instance.effectComposer.getRenderer()
    renderer.outputEncoding = sRGBEncoding
    const renderTarget = new WebGLRenderTarget(width, height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      encoding: sRGBEncoding,
      format: RGBAFormat,
      type: UnsignedByteType
    })

    renderer.setRenderTarget(renderTarget)

    // EngineRenderer.instance.effectComposer.render()
    renderer.render(Engine.instance.scene, scenePreviewCamera)

    const pixels = new Uint8Array(4 * width * height)
    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels)
    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height)
    renderer.setRenderTarget(null) // pass `null` to set canvas as render target

    const ktx2texture = (await ktx2Encoder.encode(imageData, {
      srgb: true,
      uastc: true,
      uastcZstandard: true,
      qualityLevel: 256,
      compressionLevel: 5
    })) as ArrayBuffer

    blob = new Blob([ktx2texture])
  } else {
    EngineRenderer.instance.effectComposer.render()

    blob = await getCanvasBlob(
      getResizedCanvas(EngineRenderer.instance.renderer.domElement, width, height),
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      format === 'jpeg' ? 0.9 : 1
    )
  }

  EngineRenderer.instance.effectComposer.setMainCamera(Engine.instance.camera)
  EngineRenderer.instance.effectComposer.setSize(originalWidth, originalHeight, true)

  // Restoring previous state
  scenePreviewCamera.aspect = prevAspect
  scenePreviewCamera.updateProjectionMatrix()

  return blob
}

/** @todo make size, compression & format configurable */
export const downloadScreenshot = () => {
  takeScreenshot(1920 * 4, 1080 * 4, 'png', Engine.instance.camera).then((blob) => {
    if (!blob) return

    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')

    const editorState = getState(EditorState)

    link.href = blobUrl
    link.download = editorState.projectName + '_' + editorState.sceneName + '_thumbnail.png'

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
  })
}
