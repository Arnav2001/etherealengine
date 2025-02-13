import { Vector2 } from 'three'

import { ComponentUpdateFunction } from '../../common/constants/PrefabFunctionType'
import { Entity } from '../../ecs/classes/Entity'
import { defineComponent, getComponent } from '../../ecs/functions/ComponentFunctions'
import { Interior } from '../classes/Interior'
import { addError, removeError } from '../functions/ErrorFunctions'
import { addObjectToGroup } from './GroupComponent'

export type InteriorComponentType = {
  cubeMap: string
  tiling: number
  size: Vector2
  interior?: Interior
}

export const InteriorComponent = defineComponent({
  name: 'InteriorComponent',
  jsonID: 'interior',
  onInit: () => {
    return {
      cubeMap: '',
      tiling: 1,
      size: new Vector2(1, 1)
    } as InteriorComponentType
  },
  onSet: (entity, component, json) => {
    if (!json) return
    if (typeof json.cubeMap === 'string') component.cubeMap.set(json.cubeMap)
    if (typeof json.tiling === 'number') component.tiling.set(json.tiling)
    if (typeof json.size === 'object') component.size.set(new Vector2(json.size.x, json.size.y))
  },
  toJSON(entity, component) {
    return {
      cubeMap: component.cubeMap.value,
      tiling: component.tiling.value,
      size: component.size.value
    }
  },
  errors: ['LOADING_ERROR']
})

export const updateInterior: ComponentUpdateFunction = (entity: Entity) => {
  const component = getComponent(entity, InteriorComponent)

  if (!component.interior) {
    component.interior = new Interior(entity)
    addObjectToGroup(entity, component.interior)
  }

  const obj3d = component.interior
  if (obj3d.cubeMap !== component.cubeMap) {
    try {
      obj3d.cubeMap = component.cubeMap
      removeError(entity, InteriorComponent, 'LOADING_ERROR')
    } catch (error) {
      addError(entity, InteriorComponent, 'LOADING_ERROR', error.message)
    }
  }

  obj3d.tiling = component.tiling
  obj3d.size = component.size
}
