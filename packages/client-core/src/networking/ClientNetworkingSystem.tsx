import { t } from 'i18next'
import React, { useEffect } from 'react'

import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { addActionReceptor, defineActionQueue, getState, removeActionReceptor } from '@etherealengine/hyperflux'

import {
  LocationInstanceConnectionService,
  LocationInstanceConnectionServiceReceptor
} from '../common/services/LocationInstanceConnectionService'
import {
  MediaInstanceConnectionService,
  MediaInstanceConnectionServiceReceptor
} from '../common/services/MediaInstanceConnectionService'
import { MediaInstanceState } from '../common/services/MediaInstanceConnectionService'
import { NetworkConnectionService } from '../common/services/NetworkConnectionService'
import { DataChannels } from '../components/World/ProducersAndConsumers'
import { PeerConsumers } from '../media/PeerMedia'
import { ChatServiceReceptor, ChatState } from '../social/services/ChatService'
import { FriendServiceReceptor } from '../social/services/FriendService'
import { LocationState } from '../social/services/LocationService'
import { WarningUIService } from '../systems/WarningUISystem'
import { SocketWebRTCClientNetwork } from '../transports/SocketWebRTCClientFunctions'
import { AuthState } from '../user/services/AuthService'
import { InstanceProvisioning } from './NetworkInstanceProvisioning'

const noWorldServersAvailableQueue = defineActionQueue(NetworkConnectionService.actions.noWorldServersAvailable.matches)
const noMediaServersAvailableQueue = defineActionQueue(NetworkConnectionService.actions.noMediaServersAvailable.matches)
const worldInstanceDisconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.worldInstanceDisconnected.matches
)
const worldInstanceKickedQueue = defineActionQueue(NetworkConnectionService.actions.worldInstanceKicked.matches)
const mediaInstanceDisconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.mediaInstanceDisconnected.matches
)
const worldInstanceReconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.worldInstanceReconnected.matches
)
const mediaInstanceReconnectedQueue = defineActionQueue(
  NetworkConnectionService.actions.mediaInstanceReconnected.matches
)

const execute = () => {
  const locationState = getState(LocationState)
  const chatState = getState(ChatState)
  const authState = getState(AuthState)
  const engineState = getState(EngineState)

  for (const action of noWorldServersAvailableQueue()) {
    const currentLocationID = locationState.currentLocation.location.id
    WarningUIService.openWarning({
      title: t('common:instanceServer.noAvailableServers'),
      body: t('common:instanceServer.noAvailableServersMessage'),
      action: () => LocationInstanceConnectionService.provisionServer(currentLocationID)
    })
  }

  for (const action of noMediaServersAvailableQueue()) {
    const channels = chatState.channels.channels
    const partyChannel = Object.values(channels).find(
      (channel) => channel.channelType === 'party' && channel.partyId === authState.user.partyId
    )
    const instanceChannel = Object.values(channels).find((channel) => channel.channelType === 'instance')

    if (!partyChannel && !instanceChannel) {
      // setTimeout(() => {
      //   ChatService.getInstanceChannel()
      //   updateWarningModal(WarningModalTypes.NO_MEDIA_SERVER_PROVISIONED)
      // }, 2000)
    } else {
      const channelId = partyChannel ? partyChannel.id : instanceChannel!.id
      WarningUIService.openWarning({
        title: t('common:instanceServer.noAvailableServers'),
        body: t('common:instanceServer.noAvailableServersMessage'),
        timeout: 15,
        action: () => MediaInstanceConnectionService.provisionServer(channelId, false)
      })
    }
  }

  for (const action of worldInstanceDisconnectedQueue()) {
    const transport = Engine.instance.worldNetwork as SocketWebRTCClientNetwork
    if (engineState.isTeleporting || transport.reconnecting) continue

    WarningUIService.openWarning({
      title: t('common:instanceServer.worldDisconnected'),
      body: t('common:instanceServer.worldDisconnectedMessage'),
      // action: () => window.location.reload(),
      timeout: 30
    })
  }

  for (const action of worldInstanceKickedQueue()) {
    WarningUIService.openWarning({
      title: t('common:instanceServer.youKickedFromWorld'),
      body: `${t('common:instanceServer.youKickedFromWorldMessage')}: ${action.message}`
    })
  }

  for (const action of mediaInstanceDisconnectedQueue()) {
    const transport = Engine.instance.mediaNetwork as SocketWebRTCClientNetwork
    const mediaInstanceState = getState(MediaInstanceState)
    if (transport?.reconnecting) continue

    const channels = chatState.channels.channels
    const instanceChannel = Object.values(channels).find((channel) => channel.channelType === 'instance')
    const partyChannel = Object.values(channels).find(
      (channel) => channel.channelType === 'party' && channel.partyId === authState.user.partyId
    )
    const channelId = partyChannel ? partyChannel.id : instanceChannel ? instanceChannel.id : null
    if (channelId && !mediaInstanceState.joiningNewMediaChannel)
      WarningUIService.openWarning({
        title: 'Media disconnected',
        body: "You've lost your connection with the media server. We'll try to reconnect when the following time runs out.",
        action: () => MediaInstanceConnectionService.provisionServer(channelId, false),
        timeout: 15
      })
  }

  for (const action of worldInstanceReconnectedQueue()) {
    WarningUIService.closeWarning()
  }

  for (const action of mediaInstanceReconnectedQueue()) {
    WarningUIService.closeWarning()
  }
}

const reactor = () => {
  useEffect(() => {
    addActionReceptor(LocationInstanceConnectionServiceReceptor)
    addActionReceptor(MediaInstanceConnectionServiceReceptor)
    addActionReceptor(FriendServiceReceptor)
    addActionReceptor(ChatServiceReceptor)

    return () => {
      // todo replace with subsystems
      removeActionReceptor(LocationInstanceConnectionServiceReceptor)
      removeActionReceptor(MediaInstanceConnectionServiceReceptor)
      removeActionReceptor(FriendServiceReceptor)
      removeActionReceptor(ChatServiceReceptor)
    }
  }, [])

  return (
    <>
      <DataChannels />
      <PeerConsumers />
      <InstanceProvisioning />
    </>
  )
}

export const ClientNetworkingSystem = defineSystem({
  uuid: 'ee.client.ClientNetworkingSystem',
  execute,
  reactor
})
