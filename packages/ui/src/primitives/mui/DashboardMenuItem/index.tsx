import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { SidebarItems } from '@etherealengine/ui/src/primitives/mui/DashboardItems'
import Divider from '@etherealengine/ui/src/primitives/mui/Divider'
import List from '@etherealengine/ui/src/primitives/mui/List'
import ListItem from '@etherealengine/ui/src/primitives/mui/ListItem'
import ListItemIcon from '@etherealengine/ui/src/primitives/mui/ListItemIcon'
import ListItemText from '@etherealengine/ui/src/primitives/mui/ListItemText'

import styles from './index.module.scss'

const DashboardMenuItem = () => {
  const location = useLocation()
  const { pathname } = location

  const authState = useHookstate(getMutableState(AuthState))
  const { user } = authState
  const { scopes } = user

  const { t } = useTranslation()

  const [allowedRoutes, setAllowedRoutes] = useState({
    analytics: true,
    location: false,
    user: false,
    bot: false,
    scene: false,
    party: false,
    groups: false,
    instance: false,
    invite: false,
    globalAvatars: false,
    static_resource: false,
    benchmarking: false,
    routes: false,
    projects: false,
    settings: false,
    server: false,
    recording: false
  })

  useEffect(() => {
    const { value } = scopes
    if (value) {
      setAllowedRoutes({
        ...allowedRoutes,
        ...value?.reduce((prevoius, current) => Object.assign({}, prevoius, { [current.type.split(':')[0]]: true }))
      })
    }
  }, [scopes])

  return (
    <>
      <Divider />
      <List>
        {SidebarItems(allowedRoutes)
          .filter(Boolean)
          .map((sidebarItem, index) => {
            return (
              <Link key={index} to={sidebarItem.path} className={styles.textLink} title={t(sidebarItem.name)}>
                <ListItem
                  classes={{ selected: styles.selected }}
                  style={{ color: 'var(--iconButtonColor)' }}
                  selected={sidebarItem.path === pathname}
                  button
                >
                  <ListItemIcon className={styles.drawerIconColor}>{sidebarItem.icon}</ListItemIcon>
                  <ListItemText primary={t(sidebarItem.name)} />
                </ListItem>
              </Link>
            )
          })}
      </List>
    </>
  )
}

export default DashboardMenuItem
