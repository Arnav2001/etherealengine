import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { PresentationSystemGroup } from '@etherealengine/engine/src/ecs/functions/EngineFunctions'
import { useSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Chip from '@etherealengine/ui/src/primitives/mui/Chip'
import CircularProgress from '@etherealengine/ui/src/primitives/mui/CircularProgress'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'

import { ProjectService, ProjectState } from '../../../common/services/ProjectService'
import { ProjectUpdateSystem } from '../../../systems/ProjectUpdateSystem'
import { AuthState } from '../../../user/services/AuthService'
import styles from '../../styles/admin.module.scss'
import BuildStatusDrawer from './BuildStatusDrawer'
import ProjectDrawer from './ProjectDrawer'
import ProjectTable from './ProjectTable'
import UpdateDrawer from './UpdateDrawer'

const Projects = () => {
  const authState = useHookstate(getMutableState(AuthState))
  const user = authState.user
  const projectState = useHookstate(getMutableState(ProjectState))
  const builderTags = projectState.builderTags.value
  const { t } = useTranslation()
  const githubProvider = user.identityProviders.value?.find((ip) => ip.type === 'github')

  const projectDrawerOpen = useHookstate(false)
  const updateDrawerOpen = useHookstate(false)
  const buildStatusDrawerOpen = useHookstate(false)
  const isFirstRun = useHookstate(true)

  const refreshGithubRepoAccess = () => {
    ProjectService.refreshGithubRepoAccess()
  }

  useSystem(ProjectUpdateSystem, { after: PresentationSystemGroup })

  useEffect(() => {
    ProjectService.checkReloadStatus()
  }, [])

  useEffect(() => {
    if (user?.scopes?.value?.find((scope) => scope.type === 'projects:read')) {
      ProjectService.fetchBuilderTags()
      ProjectService.getBuilderInfo()
    }
  }, [user])

  useEffect(() => {
    let interval

    isFirstRun.set(false)

    if (projectState.rebuilding.value) {
      interval = setInterval(ProjectService.checkReloadStatus, 10000)
    } else {
      clearInterval(interval)
      ProjectService.fetchProjects()
    }

    return () => clearInterval(interval)
  }, [projectState.rebuilding.value])

  return (
    <div>
      <Grid container spacing={1} className={styles.mb10px}>
        <Grid item xs={4}>
          <Button
            className={styles.openModalBtn}
            type="button"
            variant="contained"
            color="primary"
            onClick={() => projectDrawerOpen.set(true)}
          >
            {t('admin:components.project.addProject')}
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            className={styles.openModalBtn}
            type="button"
            variant="contained"
            color="primary"
            onClick={() => updateDrawerOpen.set(true)}
          >
            {projectState.rebuilding.value ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress color="inherit" size={24} sx={{ marginRight: 1 }} />
                {isFirstRun.value ? t('admin:components.project.checking') : t('admin:components.project.rebuilding')}
              </Box>
            ) : (
              t('admin:components.project.updateAndRebuild')
            )}
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            className={styles.openModalBtn}
            type="button"
            variant="contained"
            color="primary"
            onClick={() => buildStatusDrawerOpen.set(true)}
          >
            {t('admin:components.project.buildStatus')}
          </Button>
        </Grid>
      </Grid>

      <div className={styles.engineInfo}>
        <Chip label={`Current Engine Version: ${projectState.builderInfo.engineVersion.value}`} />
        <Chip label={`Current Engine Commit: ${projectState.builderInfo.engineCommit.value}`} />
        {githubProvider != null && (
          <Button
            className={styles.refreshGHBtn}
            type="button"
            variant="contained"
            color="primary"
            disabled={projectState.refreshingGithubRepoAccess.value}
            onClick={() => refreshGithubRepoAccess()}
          >
            {projectState.refreshingGithubRepoAccess.value ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress color="inherit" size={24} sx={{ marginRight: 1 }} />
                {t('admin:components.project.refreshingGithubRepoAccess')}
              </Box>
            ) : (
              t('admin:components.project.refreshGithubRepoAccess')
            )}
          </Button>
        )}
      </div>

      <ProjectTable className={styles.rootTableWithSearch} />

      <UpdateDrawer
        open={updateDrawerOpen.value}
        builderTags={builderTags}
        onClose={() => updateDrawerOpen.set(false)}
      />

      <ProjectDrawer open={projectDrawerOpen.value} onClose={() => projectDrawerOpen.set(false)} />

      <BuildStatusDrawer open={buildStatusDrawerOpen.value} onClose={() => buildStatusDrawerOpen.set(false)} />
    </div>
  )
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default Projects
