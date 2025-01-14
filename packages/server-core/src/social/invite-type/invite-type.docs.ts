/**
 * An object for swagger documentation configuration
 */
export default {
  definitions: {
    'invite-type': {
      type: 'object',
      properties: {
        type: {
          type: 'string'
        }
      }
    },
    'invite-type_list': {
      type: 'array',
      items: { $ref: '#/definitions/invite-type' }
    }
  }
}
