import { useHookstate } from '@hookstate/core'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { getMutableState } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Container from '@etherealengine/ui/src/primitives/mui/Container'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { AuthService } from '../../services/AuthService'
import { AuthState } from '../../services/AuthService'
import styles from './index.module.scss'

const ConfirmEmail = (): JSX.Element => {
  const auth = useHookstate(getMutableState(AuthState))
  const { t } = useTranslation()
  const handleResendEmail = (e: any): any => {
    e.preventDefault()

    const identityProvider = auth.authUser.identityProvider

    AuthService.resendVerificationEmail(identityProvider.token.value)
  }

  return (
    <Container component="main" maxWidth="md">
      <div className={styles.paper}>
        <Typography component="h1" variant="h5">
          {t('user:auth.confirmEmail.header')}
        </Typography>
        <Box mt={3}>
          <Typography variant="body2" color="textSecondary" align="center">
            <Trans t={t} i18nKey="user:auth.confirmEmail.resendEmail">
              {t('user:auth.confirmEmail.resendEmail', {
                here: `${(
                  <Button variant="contained" color="primary" onClick={(e) => handleResendEmail(e)}>
                    here
                  </Button>
                )}`
              })}
            </Trans>
          </Typography>
        </Box>
      </div>
    </Container>
  )
}

export default ConfirmEmail
