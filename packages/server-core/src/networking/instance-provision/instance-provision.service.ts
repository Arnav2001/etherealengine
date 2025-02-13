// Initializes the `instance-provision` service on path `/instance-provision`
import { Application } from '../../../declarations'
import logger from '../../ServerLogger'
import { InstanceProvision } from './instance-provision.class'
import instanceProvisionDocs from './instance-provision.docs'
import hooks from './instance-provision.hooks'

// Add this service to the service type index
declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    'instance-provision': InstanceProvision
  }
}

export default (app: Application) => {
  const options = {
    paginate: app.get('paginate')
  }

  /**
   * Initialize our service with any options it requires and docs
   */
  const event = new InstanceProvision(options, app)
  event.docs = instanceProvisionDocs
  app.use('instance-provision', event)

  /**
   * Get our initialized service so that we can register hooks
   */
  const service: any = app.service('instance-provision')

  service.hooks(hooks)

  /**
   * A method which is used to create instance provision
   *
   * @param data which is parsed to create instance provision
   * @returns created instance provision
   */
  service.publish('created', async (data): Promise<any> => {
    try {
      return app.channel(`userIds/${data.userId}`).send({
        ipAddress: data.ipAddress,
        port: data.port,
        locationId: data.locationId,
        sceneId: data.sceneId,
        channelId: data.channelId,
        channelType: data.channelType,
        instanceId: data.instanceId
      })
    } catch (err) {
      logger.error(err)
      throw err
    }
  })
}
