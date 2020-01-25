import { featureSpanPx } from '@gmod/jbrowse-core/util'
import { Feature } from '@gmod/jbrowse-core/util/simpleFeature'
import { IRegion } from '@gmod/jbrowse-core/mst-types'
import BaseAdapter from '@gmod/jbrowse-core/BaseAdapter'
import BaseRenderer from '@gmod/jbrowse-core/WiggleSNPAbstraction/BaseRenderer'
import {
  getOrigin,
  getScale,
} from '@gmod/jbrowse-core/WiggleSNPAbstraction/util'
import SNPBaseRenderer from '../SNPBaseRenderer'
import NestedFrequencyTable from '../NestedFrequencyTable'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SNPXYRendererProps {
  features: Map<string, Feature>
  layout: any
  config: any
  region: IRegion
  bpPerPx: number
  height: number
  width: number
  horizontallyFlipped: boolean
  highResolutionScaling: number
  blockKey: string
  dataAdapter: BaseAdapter
  notReady: boolean
  originalRegion: IRegion
  scaleOpts: any
  sessionId: string
  signal: any
  trackModel: any
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface BaseInfo {
  base: string
  score: number
  strands?: {
    [key: string]: number
  }
}

export default class SNPXYRenderer extends BaseRenderer {
  draw(ctx: CanvasRenderingContext2D, props: SNPXYRendererProps) {
    const {
      features,
      region,
      bpPerPx,
      scaleOpts,
      height,
      horizontallyFlipped,
    } = props

    const viewScale = getScale({ ...scaleOpts, range: [0, height] })
    const originY = getOrigin(scaleOpts.scaleType)
    const toY = (rawscore: number) => height - viewScale(rawscore)
    const toHeight = (rawscore: number) => toY(originY) - toY(rawscore)

    const insRegex = /^ins.[A-Za-z0-9]/
    // A: green, C: blue, g: orange, t: red, deletion: dark grey, total: light grey
    const colorForBase: { [key: string]: string } = {
      A: '#00bf00',
      C: '#4747ff',
      G: '#ffa500',
      T: '#f00',
      '*': 'darkgrey',
      total: 'lightgrey',
    }
    for (const feature of features.values()) {
      const [leftPx, rightPx] = featureSpanPx(
        feature,
        region,
        bpPerPx,
        horizontallyFlipped,
      )
      const score = feature.get('score')

      // draw total
      ctx.fillStyle = colorForBase.total
      const w = rightPx - leftPx + 0.3
      ctx.fillRect(leftPx, toY(score), w, toHeight(score))

      // generate array with nestedtable's info, draw mismatches
      const infoArray = feature.get('snpinfo')
      infoArray.forEach(function iterate(info: BaseInfo, index: number) {
        if (info.base === 'reference' || info.base === 'total') return
        ctx.fillStyle = info.base.match(insRegex)
          ? 'darkgrey'
          : colorForBase[info.base]
        ctx.fillRect(leftPx, toY(info.score), w, toHeight(info.score))
      })
    }
  }
}
