import BlockBasedTrack from '@gmod/jbrowse-plugin-linear-genome-view/src/BasicTrack/components/BlockBasedTrack'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import React, { useState, useEffect } from 'react'
import { YScaleBar } from '@gmod/jbrowse-plugin-wiggle/src/WiggleTrack/components/WiggleTrackComponent'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Icon from '@material-ui/core/Icon'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import NestedMenuItem from '@gmod/jbrowse-core/ui/NestedMenuItem'
// import ContextMenu from '@gmod/jbrowse-core/ui/ContextMenu'

const initialState = {
  mouseX: null,
  mouseY: null,
}

function AlignmentsTrackComponent(props) {
  const { model } = props
  const {
    PileupTrack,
    SNPCoverageTrack,
    height,
    menuOptions,
    subMenuOptions,
    showPileup,
    showCoverage,
    sortedBy,
  } = model

  let showScalebar = false
  if (SNPCoverageTrack) {
    const { ready, stats, needsScalebar } = SNPCoverageTrack
    if (ready && stats && needsScalebar) showScalebar = true
  }

  // const [sortedBy, setSortedBy] = useState('')
  // const selectedSortOption = e => {
  //   const sortOption = e.target.getAttribute('name')
  //   e.preventDefault()
  //   setSortedBy(sortOption)
  //   // sorting code goes here
  //   switch (sortOption) {
  //     default:
  //       handleClose()
  //   }
  //   handleClose()
  // }

  // Set up context menu
  const [state, setState] = useState(initialState)

  const handleRightClick = e => {
    e.preventDefault()
    setState(() => ({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
    }))
  }

  const handleClose = async () => {
    setState(initialState)
  }

  // when toggling pileuptrack, determines the height of the model
  useEffect(() => {
    const newHeight = !showPileup
      ? Math.min(model.height, SNPCoverageTrack.height)
      : Math.max(model.height, SNPCoverageTrack.height + PileupTrack.height)
    model.setHeight(newHeight)
  }, [PileupTrack.height, SNPCoverageTrack.height, model, showPileup])

  return (
    <div
      onContextMenu={handleRightClick}
      style={{ position: 'relative', height }}
    >
      <BlockBasedTrack
        {...props}
        {...PileupTrack}
        {...SNPCoverageTrack}
        showPileup={showPileup}
        showSNPCoverage={showCoverage}
      >
        {showScalebar && showCoverage ? (
          <YScaleBar model={SNPCoverageTrack} />
        ) : null}
      </BlockBasedTrack>
      <Menu
        keepMounted
        open={state.mouseY !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          state.mouseY !== null && state.mouseX !== null
            ? { top: state.mouseY, left: state.mouseX }
            : undefined
        }
        style={{ zIndex: 10000 }}
      >
        {menuOptions.map(option => {
          return (
            <MenuItem
              key={option.key}
              onClick={() => {
                handleClose().then(option.callback())
                // setTimeout(() => {
                //   option.callback()
                // }, 200)
              }}
              disabled={option.disableCondition || false}
            >
              {option.icon ? (
                <ListItemIcon key={option.key} style={{ minWidth: '30px' }}>
                  <Icon color="primary" fontSize="small">
                    {option.icon}
                  </Icon>
                </ListItemIcon>
              ) : null}

              {option.title}
            </MenuItem>
          )
        })}
        <NestedMenuItem
          {...props}
          label="Sort by"
          parentMenuOpen={state !== initialState}
        >
          {subMenuOptions.map(option => {
            return (
              <MenuItem
                key={option.key}
                style={{
                  backgroundColor:
                    sortedBy !== '' &&
                    sortedBy === option.key &&
                    'darkseagreen',
                }}
                onClick={() => {
                  model.sortSelected(option.key)
                  handleClose()
                }}
              >
                {option.title}
              </MenuItem>
            )
          })}
        </NestedMenuItem>
      </Menu>
    </div>
  )
}

AlignmentsTrackComponent.propTypes = {
  model: MobxPropTypes.observableObject.isRequired,
}

export default observer(AlignmentsTrackComponent)
