import assert from 'assert'

import { destroyEngine } from '@etherealengine/engine/src/ecs/classes/Engine'

import { Application } from '../../../declarations'
import { createFeathersKoaApp } from '../../createApp'
import { copyDefaultProject, uploadLocalProjectToProvider } from '../../projects/project/project.class'

// import { generateAvatarThumbnail } from './generateAvatarThumbnail'
// import fs from 'fs'
// import path from 'path'
// import appRootPath from 'app-root-path'

// const debugThumbnail = false

// causes CI/CD weirdness
describe('avatar-helper', () => {
  let app: Application
  before(async () => {
    app = createFeathersKoaApp()
    await app.setup()

    // reset default project in case another test has tampered with it
    copyDefaultProject()
    await app.service('project')._seedProject('default-project')
    await uploadLocalProjectToProvider(app, 'default-project')
  })

  after(() => {
    return destroyEngine()
  })
})
