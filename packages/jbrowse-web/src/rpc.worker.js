import './workerPolyfill'

import RpcServer from '@librpc/web'
import { useStaticRendering } from 'mobx-react'

import PluginManager from './PluginManager'
import corePlugins from './corePlugins'

import { getRefNames, getRegions, renderRegion, freeResources } from './render'

// prevent mobx-react from doing funny things when we render in the worker
useStaticRendering(true)

const jbPluginManager = new PluginManager(corePlugins.map(P => new P()))
jbPluginManager.configure()

function wrapForRpc(func) {
  return async args => {
    // console.log(`${func.name} args`, args)
    let result
    try {
      result = func(jbPluginManager, ...args)
    } catch (error) {
      console.error(error)
      throw error
    }
    // uncomment the below to log the data that the worker is
    // returning to the main thread
    // console.log(`${func.name} returned`, await result)
    return result
  }
}

// eslint-disable-next-line no-restricted-globals
self.rpcServer = new RpcServer.Server({
  getRefNames: wrapForRpc(getRefNames),
  getRegions: wrapForRpc(getRegions),
  renderRegion: wrapForRpc(renderRegion),
  freeResources: wrapForRpc(freeResources),
})
