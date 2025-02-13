import { hookstate, none } from '@etherealengine/hyperflux'

import { Entity } from '../../ecs/classes/Entity'
import { defineComponent } from '../../ecs/functions/ComponentFunctions'

const entitiesByName = {} as Record<string, Entity[]>

export const NameComponent = defineComponent({
  name: 'NameComponent',

  onInit: () => undefined as any as string,

  onSet: (entity, component, name?: string) => {
    if (typeof name !== 'string') throw new Error('NameComponent expects a non-empty string')
    component.set(name)
    NameComponent.valueMap[entity] = name
    const namedEntities = NameComponent.entitiesByNameState[name]
    const exists = !!namedEntities.value
    exists && namedEntities.set([...namedEntities.value!, entity])
    !exists && namedEntities.set([entity])
  },

  onRemove: (entity, component) => {
    const name = component.value
    const namedEntities = NameComponent.entitiesByNameState[name]
    const isSingleton = namedEntities.length === 1
    isSingleton && namedEntities.set(none)
    !isSingleton && namedEntities.set(namedEntities.value.filter((namedEntity) => namedEntity !== entity))
  },

  entitiesByNameState: hookstate(entitiesByName),
  entitiesByName: entitiesByName as Readonly<typeof entitiesByName>
})
