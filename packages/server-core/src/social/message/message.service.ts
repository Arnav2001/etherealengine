import { Message as MessageInterface } from '@etherealengine/common/src/interfaces/Message'

import { Application } from '../../../declarations'
import { Message } from './message.class'
import messageDocs from './message.docs'
import hooks from './message.hooks'
import createModel from './message.model'

declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    message: Message
  }
}

export default (app: Application) => {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  }

  /**
   * Initialize our service with any options it requires and docs
   */
  const event = new Message(options, app)
  event.docs = messageDocs
  app.use('message', event)

  /**
   * Get our initialized service so that we can register hooks
   */
  const service = app.service('message')

  service.hooks(hooks)

  /**
   * A function which is used to create message
   *
   * @param data of new message
   * @returns {@Object} created message
   */
  service.publish('created', async (data: MessageInterface): Promise<any> => {
    data.sender = await app.service('user').get(data.senderId)
    const channel = await app.service('channel').get(data.channelId)
    let targetIds: any[] = []
    if (channel.channelType === 'party') {
      const partyUsers = await app
        .service('party-user')
        .Model.findAll({ where: { partyId: channel.partyId }, limit: 1000 })
      targetIds = partyUsers.map((partyUser) => partyUser.userId)
    } else if (channel.channelType === 'group') {
      const groupUsers = await app.service('group-user').find({
        query: {
          $limit: 1000,
          groupId: channel.groupId
        }
      })

      targetIds = (groupUsers as any).data.map((groupUser) => {
        return groupUser.userId
      })
    } else if (channel.channelType === 'instance') {
      const instanceUsers = await app.service('user').find({
        query: {
          $limit: 1000
        },
        sequelize: {
          include: [
            {
              model: app.service('instance-attendance').Model,
              as: 'instanceAttendance',
              where: {
                instanceId: channel.instanceId
              }
            }
          ]
        }
      })

      targetIds = (instanceUsers as any).data.map((instanceUser) => {
        return instanceUser.id
      })
    } else if (channel.channelType === 'user') {
      targetIds = [channel.userId1, channel.userId2]
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return Promise.all(
      targetIds.map((userId: string) => {
        return app.channel(`userIds/${userId}`).send(data)
      })
    )
  })

  /**
   * A function which used to remove single message
   *
   * @param data contains sender
   * @returns removed data
   */
  service.publish('removed', async (data: MessageInterface): Promise<any> => {
    data.sender = await app.service('user').get(data.senderId)
    const channel = await app.service('channel').get(data.channelId)
    let targetIds: any[] = []
    if (channel.channelType === 'party') {
      const partyUsers = await app
        .service('party-user')
        .Model.findAll({ where: { partyId: channel.partyId }, limit: 1000 })
      targetIds = partyUsers.map((partyUser) => partyUser.userId)
    } else if (channel.channelType === 'group') {
      const groupUsers = await app.service('group-user').find({
        query: {
          $limit: 1000,
          groupId: channel.groupId
        }
      })

      targetIds = (groupUsers as any).data.map((groupUser) => {
        return groupUser.userId
      })
    } else if (channel.channelType === 'instance') {
      const instanceUsers = await app.service('user').find({
        query: {
          $limit: 1000
        },
        sequelize: {
          include: [
            {
              model: app.service('instance-attendance').Model,
              as: 'instanceAttendance',
              where: {
                instanceId: channel.instanceId
              }
            }
          ]
        }
      })

      targetIds = (instanceUsers as any).data.map((instanceUser) => {
        return instanceUser.id
      })
    } else if (channel.channelType === 'user') {
      targetIds = [channel.userId1, channel.userId2]
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return Promise.all(
      targetIds.map((userId: string) => {
        return app.channel(`userIds/${userId}`).send(data)
      })
    )
  })

  /**
   * A function which is used to update mesasge
   *
   * @param data of updated message
   * @returns {@Object} updated message
   */
  service.publish('patched', async (data: MessageInterface): Promise<any> => {
    data.sender = await app.service('user').get(data.senderId)
    const channel = await app.service('channel').get(data.channelId)
    let targetIds: any[] = []
    if (channel.channelType === 'party') {
      const partyUsers = await app
        .service('party-user')
        .Model.findAll({ where: { partyId: channel.partyId }, limit: 1000 })
      targetIds = partyUsers.map((partyUser) => partyUser.userId)
    } else if (channel.channelType === 'group') {
      const groupUsers = await app.service('group-user').find({
        query: {
          $limit: 1000,
          groupId: channel.groupId
        }
      })

      targetIds = (groupUsers as any).data.map((groupUser) => {
        return groupUser.userId
      })
    } else if (channel.channelType === 'instance') {
      const instanceUsers = await app.service('user').find({
        query: {
          $limit: 1000
        },
        sequelize: {
          include: [
            {
              model: app.service('instance-attendance').Model,
              as: 'instanceAttendance',
              where: {
                instanceId: channel.instanceId
              }
            }
          ]
        }
      })

      targetIds = (instanceUsers as any).data.map((instanceUser) => {
        return instanceUser.id
      })
    } else if (channel.channelType === 'user') {
      targetIds = [channel.userId1, channel.userId2]
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return Promise.all(
      targetIds.map((userId: string) => {
        return app.channel(`userIds/${userId}`).send(data)
      })
    )
  })
}
