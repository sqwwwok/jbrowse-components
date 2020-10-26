import { getConf } from '@jbrowse/core/configuration'
import { useDebounce } from '@jbrowse/core/util'
import {
  App,
  StartScreen,
  createJBrowseTheme,
  AssemblyManager,
} from '@jbrowse/core/ui'

import CssBaseline from '@material-ui/core/CssBaseline'

import { ThemeProvider } from '@material-ui/core/styles'

import { observer } from 'mobx-react'
import { onSnapshot } from 'mobx-state-tree'
import React, { useEffect, useState } from 'react'
import factoryReset from './factoryReset'

const debounceMs = 1000

const JBrowse = observer(({ pluginManager }) => {
  const { electron = {} } = window
  const { desktopCapturer, ipcRenderer } = electron
  const [firstLoad, setFirstLoad] = useState(true)
  const [sessionSnapshot, setSessionSnapshot] = useState()
  const [configSnapshot, setConfigSnapshot] = useState()
  const debouncedSessionSnapshot = useDebounce(sessionSnapshot, debounceMs)
  const debouncedConfigSnapshot = useDebounce(configSnapshot, debounceMs)

  const { rootModel } = pluginManager
  const { session, jbrowse, error } = rootModel
  if (firstLoad && session) setFirstLoad(false)

  useEffect(() => {
    return jbrowse
      ? onSnapshot(jbrowse, snap => {
          setConfigSnapshot(snap)
        })
      : () => {}
  }, [jbrowse])
  useEffect(() => {
    return session
      ? onSnapshot(session, snap => {
          setSessionSnapshot(snap)
        })
      : () => {}
  }, [session])

  useEffect(() => {
    ;(async () => {
      if (debouncedSessionSnapshot) {
        const sources = await desktopCapturer.getSources({
          types: ['window'],
          thumbnailSize: { width: 500, height: 500 },
        })
        const jbWindow = sources.find(source => source.name === 'JBrowse')
        const screenshot = jbWindow.thumbnail.toDataURL()
        ipcRenderer.send('saveSession', debouncedSessionSnapshot, screenshot)
      }
    })()
  }, [debouncedSessionSnapshot, desktopCapturer, ipcRenderer])

  useEffect(() => {
    if (debouncedConfigSnapshot) {
      ipcRenderer.send('saveConfig', debouncedConfigSnapshot)
    }
  }, [debouncedConfigSnapshot, ipcRenderer])

  if (error) {
    throw new Error(error)
  }

  const theme = getConf(rootModel.jbrowse, 'theme')

  return (
    <ThemeProvider theme={createJBrowseTheme(theme)}>
      <CssBaseline />
      {rootModel.session ? (
        <>
          <App session={rootModel.session} />
          <AssemblyManager
            rootModel={rootModel}
            open={rootModel.isEditing}
            onClose={() => {
              rootModel.setEditing(false)
            }}
          />
        </>
      ) : (
        <StartScreen
          root={rootModel}
          bypass={firstLoad}
          onFactoryReset={factoryReset}
        />
      )}
    </ThemeProvider>
  )
})

export default JBrowse
