import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { SendInvite } from '@etherealengine/common/src/interfaces/Invite'
import { UserId } from '@etherealengine/common/src/interfaces/UserId'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { removeComponent, setComponent } from '@etherealengine/engine/src/ecs/functions/ComponentFunctions'
import { WorldState } from '@etherealengine/engine/src/networking/interfaces/WorldState'
import { VisibleComponent } from '@etherealengine/engine/src/scene/components/VisibleComponent'
import { XRUIInteractableComponent } from '@etherealengine/engine/src/xrui/components/XRUIComponent'
import { createXRUI, XRUI } from '@etherealengine/engine/src/xrui/functions/createXRUI'
import { useXRUIState } from '@etherealengine/engine/src/xrui/functions/useXRUIState'
import { defineState, dispatchAction, getMutableState, useHookstate } from '@etherealengine/hyperflux'

import { FriendService, FriendState } from '../../../social/services/FriendService'
import { InviteService } from '../../../social/services/InviteService'
import { PartyState } from '../../../social/services/PartyService'
import { PopupMenuActions } from '../../../user/components/UserMenu/PopupMenuService'
import { getAvatarURLForUser } from '../../../user/components/UserMenu/util'
import { AuthState } from '../../../user/services/AuthService'
import { AvatarMenus } from '../../AvatarUISystem'
import XRTextButton from '../../components/XRTextButton'
import styleString from './index.scss?inline'

export const AvatarUIContextMenuState = defineState({
  name: 'AvatarUISystem',
  initial: () => {
    const ui = createXRUI(AvatarContextMenu) as XRUI<null>
    removeComponent(ui.entity, VisibleComponent)
    setComponent(ui.entity, XRUIInteractableComponent)
    return {
      ui,
      id: null! as string | UserId
    }
  }
})

export const AvatarUIContextMenuService = {
  setId: (id: UserId) => {
    const avatarUIContextMenuState = getMutableState(AvatarUIContextMenuState)
    avatarUIContextMenuState.id.set(id)
  }
}

const AvatarContextMenu = () => {
  const detailState = useHookstate(getMutableState(AvatarUIContextMenuState))
  const partyState = useHookstate(getMutableState(PartyState))
  const friendState = useHookstate(getMutableState(FriendState))
  const authState = useHookstate(getMutableState(AuthState))
  const selfId = authState.user.id?.value ?? ''

  const peers = (Engine.instance.worldNetworkState.peers?.get({ noproxy: true }) || []).values()
  const user = peers ? Array.from(peers).find((peer) => peer.userId === detailState.id.value) || undefined : undefined
  const { t } = useTranslation()

  const userAvatarDetails = useHookstate(getMutableState(WorldState).userAvatarDetails)
  const partyOwner = partyState.party?.partyUsers?.value
    ? partyState.party.partyUsers.value.find((partyUser) => partyUser.isOwner)
    : null
  const userInParty =
    partyState.party?.partyUsers?.get({ noproxy: true })?.find((partyUser) => partyUser.userId === user?.userId) ||
    false

  const isFriend = friendState.relationships.friend.value.find((item) => item.id === user?.userId)
  const isRequested = friendState.relationships.requested.value.find((item) => item.id === user?.userId)
  const isPending = friendState.relationships.pending.value.find((item) => item.id === user?.userId)
  const isBlocked = friendState.relationships.blocked.value.find((item) => item.id === user?.userId)
  const isBlocking = friendState.relationships.blocking.value.find((item) => item.id === user?.userId)

  const inviteToParty = () => {
    if (authState.user?.partyId?.value && user?.userId) {
      const partyId = authState.user?.partyId?.value ?? ''
      const userId = user.userId
      const sendData = {
        inviteType: 'party',
        inviteeId: userId,
        targetObjectId: partyId,
        token: null
      } as SendInvite
      InviteService.sendInvite(sendData)
    }
  }

  const handleMute = () => {
    console.log('Mute pressed')
  }

  useEffect(() => {
    if (detailState.id.value !== '') {
      const tappedUser = Array.from(
        (Engine.instance.worldNetworkState.peers?.get({ noproxy: true }) || []).values()
      ).find((peer) => peer.userId === detailState.id.value)
      dispatchAction(PopupMenuActions.showPopupMenu({ id: AvatarMenus.AvatarContext, params: { user: tappedUser } }))
    }
  }, [detailState.id])

  return (
    <>
      <style>{styleString}</style>
      {user?.userId && (
        <div className="rootContainer">
          <img
            className="ownerImage"
            src={getAvatarURLForUser(userAvatarDetails, user?.userId)}
            alt=""
            crossOrigin="anonymous"
          />
          <div className="buttonContainer">
            <section className="buttonSection">
              {partyState?.party?.id?.value != null &&
                partyOwner?.userId != null &&
                partyOwner.userId === authState.user?.id?.value &&
                !userInParty && (
                  <XRTextButton onClick={inviteToParty}>{t('user:personMenu.inviteToParty')}</XRTextButton>
                )}

              {!isFriend && !isRequested && !isPending && !isBlocked && !isBlocking && (
                <XRTextButton onClick={() => FriendService.requestFriend(selfId, user?.userId)}>
                  {t('user:personMenu.addAsFriend')}
                </XRTextButton>
              )}

              {isFriend && !isRequested && !isPending && !isBlocked && !isBlocking && (
                <XRTextButton onClick={() => FriendService.unfriend(selfId, user?.userId)}>
                  {t('user:personMenu.unFriend')}
                </XRTextButton>
              )}

              {isPending && (
                <>
                  <XRTextButton onClick={() => FriendService.acceptFriend(selfId, user?.userId)}>
                    {t('user:personMenu.acceptRequest')}
                  </XRTextButton>

                  <XRTextButton onClick={() => FriendService.declineFriend(selfId, user?.userId)}>
                    {t('user:personMenu.declineRequest')}
                  </XRTextButton>
                </>
              )}

              {isRequested && (
                <XRTextButton onClick={() => FriendService.unfriend(selfId, user?.userId)}>
                  {t('user:personMenu.cancelRequest')}
                </XRTextButton>
              )}

              <XRTextButton onClick={handleMute}>{t('user:personMenu.mute')}</XRTextButton>

              {isFriend && !isBlocked && !isBlocking && (
                <XRTextButton onClick={() => FriendService.blockUser(selfId, user?.userId)}>
                  {t('user:personMenu.block')}
                </XRTextButton>
              )}

              {isBlocking && (
                <XRTextButton onClick={() => FriendService.unblockUser(selfId, user?.userId)}>
                  {t('user:personMenu.unblock')}
                </XRTextButton>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  )
}
