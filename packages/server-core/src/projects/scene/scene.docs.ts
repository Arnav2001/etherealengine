/**
 * An object for swagger documentation configuration
 */
export default {
  definitions: {
    scene: {
      type: 'object',
      properties: {}
    },
    scene_list: {
      type: 'array',
      items: { $ref: '#/definitions/project' }
    }
  },
  securities: ['create', 'update', 'patch', 'remove'],
  operations: {
    find: {
      security: [{ bearer: [] }]
    }
  }
}
