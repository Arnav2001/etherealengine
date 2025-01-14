import classNames from 'classnames'
import React from 'react'

import { MediaInstanceState } from '@etherealengine/client-core/src/common/services/MediaInstanceConnectionService'
import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { screenshareVideoDataChannelType } from '@etherealengine/engine/src/networking/NetworkState'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'

import { MediaStreamState } from '../../transports/MediaStreams'
import ConferenceModeParticipant from './ConferenceModeParticipant'
import styles from './index.module.scss'

const ConferenceMode = (): JSX.Element => {
  const authState = useHookstate(getMutableState(AuthState))
  const channelConnectionState = useHookstate(getMutableState(MediaInstanceState))
  const network = Engine.instance.mediaNetwork
  const currentChannelInstanceConnection = network && channelConnectionState.instances[network.hostId].ornull
  const displayedUsers =
    network?.hostId && currentChannelInstanceConnection
      ? Array.from(network.peers.values()).filter(
          (peer) => peer.peerID !== 'server' && peer.userId !== authState.user.id.value
        ) || []
      : []

  const consumers = network.consumers
  const screenShareConsumers =
    consumers?.filter((consumer) => consumer.appData.mediaTag === screenshareVideoDataChannelType) || []

  const mediaStreamState = useHookstate(getMutableState(MediaStreamState))
  const isScreenVideoEnabled =
    mediaStreamState.screenVideoProducer.value != null && !mediaStreamState.screenShareVideoPaused.value
  const isScreenAudioEnabled =
    mediaStreamState.screenShareAudioPaused.value != null && !mediaStreamState.screenShareAudioPaused.value

  let totalScreens = 1

  if (isScreenVideoEnabled || isScreenAudioEnabled) {
    totalScreens += 1
  }

  for (let user of displayedUsers) {
    totalScreens += 1
    const peerID = Array.from(network.peers.values()).find((peer) => peer.userId === user.userId)?.peerID
    if (screenShareConsumers.find((consumer) => consumer.appData.peerID === peerID)) {
      totalScreens += 1
    }
  }

  return (
    <div
      className={classNames({
        [styles['participants']]: true,
        [styles['single-grid']]: totalScreens === 1,
        [styles['double-grid']]: totalScreens === 2 || totalScreens === 4,
        [styles['multi-grid']]: totalScreens === 3 || totalScreens > 4
      })}
    >
      {(isScreenVideoEnabled || isScreenAudioEnabled) && (
        <ConferenceModeParticipant
          type={'screen'}
          peerID={Engine.instance.peerID}
          key={'screen_' + Engine.instance.peerID}
        />
      )}
      <ConferenceModeParticipant type={'cam'} peerID={Engine.instance.peerID} key={'cam_' + Engine.instance.peerID} />
      {consumers.map((consumer) => {
        const peerID = consumer.appData.peerID
        const type = consumer.appData.mediaTag === screenshareVideoDataChannelType ? 'screen' : 'cam'
        return <ConferenceModeParticipant type={type} peerID={peerID} key={type + '_' + peerID} />
      })}
    </div>
  )
}

export default ConferenceMode
