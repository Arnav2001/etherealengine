import { DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, Material, Matrix4, Mesh, Object3D } from 'three'

import { OpaqueType } from '@etherealengine/common/src/interfaces/OpaqueType'
import { NO_PROXY } from '@etherealengine/hyperflux'

import { addOBCPlugin } from '../../../common/functions/OnBeforeCompilePlugin'
import { Entity } from '../../../ecs/classes/Entity'
import { ComponentType, getComponent, getMutableComponent } from '../../../ecs/functions/ComponentFunctions'
import { Object3DWithEntity } from '../../components/GroupComponent'
import { LODComponent } from '../../components/LODComponent'
import { ModelComponent } from '../../components/ModelComponent'

/**
 * Processes a loaded LOD level, adding it to the entity's group and adding instanced attributes if necessary
 * @param entity : entity to add the level to
 * @param index : index of the level in the LODComponent.levels array
 * @param mesh : mesh to add to the entity
 * @returns
 */
export function processLoadedLODLevel(entity: Entity, index: number, mesh: Mesh) {
  if (mesh === null) {
    console.warn('trying to process an empty model file')
    return
  }
  const lodComponentState = getMutableComponent(entity, LODComponent)
  const lodComponent = getComponent(entity, LODComponent)
  const targetModel = getMutableComponent(lodComponent.target, ModelComponent)
  const level = lodComponentState.levels[index]

  let loadedModel: Object3D | null = lodComponent.levels.find((level) => level.loaded)?.model ?? null

  function addPlugin(mesh: Mesh) {
    delete mesh.geometry.attributes['lodIndex']
    delete mesh.geometry.attributes['_lodIndex']
    mesh.geometry.setAttribute('lodIndex', lodComponentState.instanceLevels.get(NO_PROXY))
    const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      addOBCPlugin(material, {
        id: 'lod-culling',
        priority: 1,
        compile: (shader, renderer) => {
          shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            `
  attribute float lodIndex;
  varying float vDoClip;
  void main() {
    vDoClip = float(lodIndex != ${index}.0);
    if (vDoClip == 0.0) {
`
          )
          shader.vertexShader = shader.vertexShader.replace(/\}[^}]*$/, `}}`)
          shader.fragmentShader = shader.fragmentShader.replace(
            'void main() {\n',
            'varying float vDoClip;\nvoid main() {\nif (vDoClip > 0.0) discard;\n'
          )
        }
      })
    })
  }

  let loadedMesh: Mesh | InstancedMesh = mesh

  if (mesh instanceof InstancedMesh) {
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
    if (lodComponent.instanced) {
      if (lodComponent.instanceMatrix.array.length === 0) {
        const transforms = new Float32Array(mesh.count * 16)
        const matrix = new Matrix4()
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, matrix)
          for (let j = 0; j < 16; j++) {
            transforms[i * 16 + j] = matrix.elements[j]
          }
        }
        lodComponentState.instanceMatrix.set(new InstancedBufferAttribute(transforms, 16))
        lodComponentState.instanceLevels.set(new InstancedBufferAttribute(new Uint8Array(mesh.count), 1))
      } else {
        mesh.instanceMatrix = lodComponent.instanceMatrix
      }
    }
  } else if (lodComponent.instanced) {
    const instancedModel = new InstancedMesh(mesh.geometry, mesh.material, lodComponent.instanceMatrix.count)
    instancedModel.instanceMatrix = lodComponent.instanceMatrix
    loadedMesh = instancedModel
  }

  let removeLoaded = () => {}
  if (!loadedModel) {
    loadedModel = objectFromLodPath(targetModel.value, lodComponent.lodPath)
    removeLoaded = () => {
      loadedModel?.removeFromParent()
    }
  }

  loadedMesh instanceof InstancedMesh && addPlugin(loadedMesh)
  level.model.set(loadedMesh)

  if (lodComponent.instanceMatrix.array.length === 0) {
    lodComponentState.instanceMatrix.set(
      new InstancedBufferAttribute(new Float32Array([...loadedMesh.matrix.elements]), 16)
    )
    lodComponentState.instanceLevels.set(new InstancedBufferAttribute(new Uint8Array([index]), 1))
  }
  if (loadedMesh !== loadedModel) {
    loadedModel.parent?.add(loadedMesh)
    loadedMesh.name = loadedModel.name
    loadedMesh.position.copy(loadedModel.position)
    loadedMesh.quaternion.copy(loadedModel.quaternion)
    loadedMesh.scale.copy(loadedModel.scale)
    loadedMesh.updateMatrixWorld(true)

    removeLoaded()
  }
}

export type LODPath = OpaqueType<'LODPath'> & string

export function getLodPath(object: Object3D): LODPath {
  let walker: Object3D | null = object
  let path = ''
  while (walker !== null && !(walker as Object3DWithEntity).entity) {
    if (walker.userData['lodPath']) {
      path = `${walker.userData['lodPath']}${path ? `/${path}` : ''}`
      break
    }
    path = `${walker.name}/${path}`
    walker = walker.parent
  }
  object.userData['lodPath'] = path
  return path as LODPath
}

export function objectFromLodPath(model: ComponentType<typeof ModelComponent>, path: LODPath): Object3D {
  let walker: Object3D | null = model.scene
  let prev: typeof walker = null
  const pathParts = path.split('/')
  while (pathParts.length > 0) {
    const part = pathParts.shift()
    if (!part) break
    prev = walker
    walker = walker?.children.find((child) => child.name === part) ?? null
  }
  if (!walker) {
    console.error('walker', walker, 'prev', prev)
    throw new Error(`Could not find object from path ${path} in model ${model.scene}`)
  }
  return walker
}
