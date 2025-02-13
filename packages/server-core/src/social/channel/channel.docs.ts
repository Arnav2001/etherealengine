/**
 * An object for swagger documentation configuration
 */
export default {
  definitions: {
    channel: {
      type: 'object',
      properties: {}
    },
    channel_list: {
      type: 'array',
      items: { $ref: '#/definitions/channel' }
    }
  },
  securities: ['create', 'update', 'patch', 'remove'],
  operations: {
    find: {
      security: [{ bearer: [] }]
    }
  }
}
