import Component from './index'

const argTypes = {}

export default {
  title: 'Primitives/MUI/Drawer',
  component: Component,
  parameters: {
    componentSubtitle: 'Drawer',
    jest: 'Drawer.test.tsx',
    design: {
      type: 'figma',
      url: ''
    }
  },
  argTypes
}

export const Primary = { args: Component.defaultProps }
