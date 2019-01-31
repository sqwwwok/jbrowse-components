import { types } from 'mobx-state-tree'
import { MenuItemModel, MainMenuBarModel } from './model'
import { ConfigurationSchema } from '../../configuration'

jest.mock('file-saver')

test('can download configuration', () => {
  const rootSchema = types.model({
    configuration: ConfigurationSchema('Toaster', {
      foo: { type: 'number', defaultValue: 42 },
    }),
    item: MenuItemModel,
  })

  const model = rootSchema.create({
    item: {
      name: 'doonlood',
      callback: 'downloadConfiguration',
    },
  })

  const jsonString = model.item.func()
  expect(jsonString).toContain('"configId"')
})

test('can push menus', () => {
  const menubar = MainMenuBarModel.create({ type: 'MainMenuBar' })
  menubar.pushMenu({
    name: 'Admin',
    menuItems: [
      {
        name: 'Download configuration',
        icon: 'get_app',
        callback: 'downloadConfiguration',
      },
    ],
  })

  expect(menubar.menus.length).toBe(2)
  expect(menubar.menus.map(m => m.name)).toEqual(['Help', 'Admin'])
})

test('can unshift menus', () => {
  const menubar = MainMenuBarModel.create({ type: 'MainMenuBar' })
  menubar.unshiftMenu({
    name: 'Admin',
    menuItems: [
      {
        name: 'Download configuration',
        icon: 'get_app',
        callback: 'downloadConfiguration',
      },
    ],
  })

  expect(menubar.menus.length).toBe(2)
  expect(menubar.menus.map(m => m.name)).toEqual(['Admin', 'Help'])
})
