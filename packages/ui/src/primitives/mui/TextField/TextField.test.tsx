import { describe, expect, it } from '@jest/globals'
import { shallow } from 'enzyme'
import React from 'react'

import TextField from './index'
import { Primary as story } from './index.stories'

describe('TextField', () => {
  it('- should render', () => {
    const wrapper = shallow(<TextField {...story?.args} />)
    expect(wrapper).toMatchSnapshot()
  })
})
