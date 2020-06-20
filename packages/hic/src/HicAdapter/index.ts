import PluginManager from '@gmod/jbrowse-core/PluginManager'
import configSchemaF from './configSchema'
import AdapterF from './HicAdapter'

export default (pluginManager: PluginManager) => {
  return {
    configSchema: pluginManager.load(configSchemaF),
    AdapterClass: pluginManager.load(AdapterF),
  }
}
