import React from 'react'
import { observer } from 'mobx-react'
import ReactPropTypes from 'prop-types'

import './DivSequenceRendering.scss'

import { PropTypes as CommonPropTypes } from '../../../mst-types'
import { readConfObject } from '../../../configuration'

function SequenceDivs({ features, region, bpPerPx, horizontallyFlipped }) {
  let s = ''
  for (const seq of features.values()) {
    const seqString = seq.get('seq')
    if (!seqString || seqString.length !== seq.get('end') - seq.get('start'))
      throw new Error(
        `feature ${seq.id()} did not contain a valid \`seq\` attribute`,
      )
    if (seqString) s += seq.get('seq')
  }

  const width = (region.end - region.start) / bpPerPx

  s = s.split('')
  if (horizontallyFlipped) s = s.reverse()

  return (
    <>
      {s.map((letter, iter) => (
        <div
          /* eslint-disable-next-line */
          key={`${region.start}-${iter}`}
          style={{
            width: `${width / s.length}px`,
          }}
          className={`base base-${letter.toLowerCase()}`}
        >
          {bpPerPx < 0.1 ? letter : ''}
        </div>
      ))}
    </>
  )
}

SequenceDivs.propTypes = {
  region: CommonPropTypes.Region.isRequired,
  bpPerPx: ReactPropTypes.number.isRequired,
  features: ReactPropTypes.instanceOf(Map),
  horizontallyFlipped: ReactPropTypes.bool,
}
SequenceDivs.defaultProps = {
  features: new Map(),
  horizontallyFlipped: false,
}

function DivSequenceRendering(props) {
  const { bpPerPx, config } = props
  const height = readConfObject(config, 'height')
  return (
    <div
      className="DivSequenceRendering"
      style={{ height: `${height}px`, fontSize: `${height * 0.8}px` }}
    >
      {bpPerPx >= 1 ? (
        <div className="blur">Zoom in to see sequence</div>
      ) : (
        <SequenceDivs {...props} />
      )}
    </div>
  )
}
DivSequenceRendering.propTypes = {
  config: CommonPropTypes.ConfigSchema.isRequired,
  bpPerPx: ReactPropTypes.number.isRequired,
}

export default observer(DivSequenceRendering)
