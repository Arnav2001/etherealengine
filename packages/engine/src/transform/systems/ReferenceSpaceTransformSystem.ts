import { MeshDepthMaterial, Scene, Skeleton, SkinnedMesh, WebGLRenderTarget } from 'three'

import { updateLocalAvatarPosition, updateLocalAvatarRotation } from '../../avatar/functions/moveAvatar'
import { Engine } from '../../ecs/classes/Engine'
import { getComponent, hasComponent } from '../../ecs/functions/ComponentFunctions'
import { defineSystem } from '../../ecs/functions/SystemFunctions'
import { EngineRenderer } from '../../renderer/WebGLRendererSystem'
import { GroupComponent } from '../../scene/components/GroupComponent'
import { VisibleComponent } from '../../scene/components/VisibleComponent'
import { updateXRCamera } from '../../xr/XRCameraSystem'
import { computeTransformMatrix } from './TransformSystem'

/**
 * This system is responsible for updating the local client avatar position and rotation, and updating the XR camera position.
 * @param world
 * @returns
 */
const skeletonForceUpdateScene = new Scene()
skeletonForceUpdateScene.overrideMaterial = new MeshDepthMaterial()
const dummyRenderTarget = new WebGLRenderTarget(1, 1)

const execute = () => {
  const { localClientEntity } = Engine.instance

  /**
   * 1 - Update local client movement
   */
  if (localClientEntity) {
    updateLocalAvatarPosition()
    updateLocalAvatarRotation()
    computeTransformMatrix(localClientEntity)

    // the following is a workaround for a bug in the multiview rendering implementation, described here:
    // https://github.com/mrdoob/three.js/pull/24048
    // essentially, we are forcing the skeleton of the local client to be uploaded to the GPU here
    if (
      hasComponent(localClientEntity, VisibleComponent) &&
      EngineRenderer.instance.xrManager?.isMultiview &&
      EngineRenderer.instance.xrManager?.isPresenting
    ) {
      const localClientGroup = getComponent(localClientEntity, GroupComponent)
      const renderer = EngineRenderer.instance.renderer
      skeletonForceUpdateScene.children = localClientGroup
      renderer.setRenderTarget(dummyRenderTarget)
      renderer.info.autoReset = false
      renderer.render(skeletonForceUpdateScene, Engine.instance.camera)
      renderer.info.autoReset = true
      renderer.setRenderTarget(null)
    }
  }

  /**
   * 2 - Update XR camera positions based on world origin and viewer pose
   */
  updateXRCamera()

  /**
   * For whatever reason, this must run at the start of the transform system, before the transform system.
   * @todo - disabled as this doesnt seem necessary anymore
   */
  // applyInputSourcePoseToIKTargets()
}

export const ReferenceSpaceTransformSystem = defineSystem({
  uuid: 'ee.engine.ReferenceSpaceTransformSystem',
  execute
})
