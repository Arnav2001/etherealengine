/** Functions to provide engine level functionalities. */
import { Object3D } from 'three'

import logger from '@etherealengine/common/src/logger'
import { dispatchAction, getMutableState, getState } from '@etherealengine/hyperflux'

import { nowMilliseconds } from '../../common/functions/nowMilliseconds'
import { IncomingActionSystem } from '../../networking/systems/IncomingActionSystem'
import { OutgoingActionSystem } from '../../networking/systems/OutgoingActionSystem'
import { SceneObjectComponent } from '../../scene/components/SceneObjectComponent'
import { TransformSystem } from '../../transform/systems/TransformSystem'
import { Engine } from '../classes/Engine'
import { EngineActions, EngineState } from '../classes/EngineState'
import { Entity } from '../classes/Entity'
import { SceneState } from '../classes/Scene'
import { removeEntityNodeRecursively } from '../functions/EntityTree'
import { defineQuery, EntityRemovedComponent } from './ComponentFunctions'
import { removeEntity } from './EntityFunctions'
import { executeFixedPipeline } from './FixedPipelineSystem'
import {
  defineSystem,
  disableAllSystems,
  enableSystems,
  executeSystem,
  SystemDefinitions,
  SystemUUID
} from './SystemFunctions'

const sceneQuery = defineQuery([SceneObjectComponent])

export const unloadScene = async () => {
  const entitiesToRemove = [] as Entity[]
  const sceneObjectsToRemove = [] as Object3D[]

  for (const entity of sceneQuery()) entitiesToRemove.push(entity)

  removeEntityNodeRecursively(getState(SceneState).sceneEntity)

  Engine.instance.scene.traverse((o: any) => {
    if (!o.entity) return
    if (!entitiesToRemove.includes(o.entity)) return

    if (o.geometry) {
      o.geometry.dispose()
    }

    if (o.material) {
      if (o.material.length) {
        for (let i = 0; i < o.material.length; ++i) {
          o.material[i].dispose()
        }
      } else {
        o.material.dispose()
      }
    }

    sceneObjectsToRemove.push(o)
  })

  for (const o of sceneObjectsToRemove) Engine.instance.scene.remove(o)
  for (const entity of entitiesToRemove) removeEntity(entity, true)

  await disableAllSystems()
  dispatchAction(EngineActions.sceneUnloaded({}))
}

export const InputSystemGroup = defineSystem({
  uuid: 'ee.engine.input-group'
})

/** Run inside of fixed pipeline */
export const SimulationSystemGroup = defineSystem({
  uuid: 'ee.engine.simulation-group',
  preSystems: [IncomingActionSystem],
  postSystems: [OutgoingActionSystem]
})

export const AnimationSystemGroup = defineSystem({
  uuid: 'ee.engine.animation-group'
})

export const PresentationSystemGroup = defineSystem({
  uuid: 'ee.engine.presentation-group'
})

/**
 * 1. input group
 * 2. fixed pipeline (simulation group)
 * 3. animation group
 * 4. transform system
 * 5. presentation group
 */
export const RootSystemGroup = defineSystem({
  uuid: 'ee.engine.root-group',
  preSystems: [InputSystemGroup],
  execute: executeFixedPipeline,
  subSystems: [AnimationSystemGroup, TransformSystem],
  postSystems: [PresentationSystemGroup]
})

export const startCoreSystems = () => {
  enableSystems([
    RootSystemGroup,
    IncomingActionSystem,
    OutgoingActionSystem,
    InputSystemGroup,
    SimulationSystemGroup,
    AnimationSystemGroup,
    TransformSystem,
    PresentationSystemGroup
  ])
}

export const getDAG = (systemUUID = RootSystemGroup, depth = 0) => {
  const system = SystemDefinitions.get(systemUUID)
  if (!system) return

  for (const preSystem of system.preSystems) {
    getDAG(preSystem, depth + 1)
  }

  if (systemUUID === RootSystemGroup) getDAG(SimulationSystemGroup, depth + 1)

  console.log('-'.repeat(depth), system.uuid.split('.').pop(), Engine.instance.activeSystems.has(system.uuid))

  for (const subSystem of system.subSystems) {
    getDAG(subSystem, depth + 1)
  }

  for (const postSystem of system.postSystems) {
    getDAG(postSystem, depth + 1)
  }
}

globalThis.getDAG = getDAG

const TimerConfig = {
  MAX_DELTA_SECONDS: 1 / 10
}

const entityRemovedQuery = defineQuery([EntityRemovedComponent])

/**
 * Execute systems on this world
 *
 * @param elapsedTime the current frame time in milliseconds (DOMHighResTimeStamp) relative to performance.timeOrigin
 */
export const executeSystems = (elapsedTime: number) => {
  const engineState = getMutableState(EngineState)
  engineState.frameTime.set(performance.timeOrigin + elapsedTime)

  const start = nowMilliseconds()
  const incomingActions = [...Engine.instance.store.actions.incoming]

  const elapsedSeconds = elapsedTime / 1000
  engineState.deltaSeconds.set(
    Math.max(0.001, Math.min(TimerConfig.MAX_DELTA_SECONDS, elapsedSeconds - engineState.elapsedSeconds.value))
  )
  engineState.elapsedSeconds.set(elapsedSeconds)

  executeSystem(RootSystemGroup)

  for (const entity of entityRemovedQuery()) removeEntity(entity as Entity, true)

  for (const { query, result } of Engine.instance.reactiveQueryStates) {
    const entitiesAdded = query.enter().length
    const entitiesRemoved = query.exit().length
    if (entitiesAdded || entitiesRemoved) {
      result.set(query())
    }
  }

  const end = nowMilliseconds()
  const duration = end - start
  if (duration > 150) {
    logger.warn(`Long frame execution detected. Duration: ${duration}. \n Incoming actions: %o`, incomingActions)
  }
}
