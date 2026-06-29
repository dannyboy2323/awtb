import { person } from './documents/person'
import { page } from './documents/page'
import { post } from './documents/post'
import { callToAction } from './objects/callToAction'
import { infoSection } from './objects/infoSection'
import { settings } from './singletons/settings'
import { link } from './objects/link'
import { blockContent } from './objects/blockContent'
import button from './objects/button'
import { blockContentTextOnly } from './objects/blockContentTextOnly'

// Postcard Stories schema types
import { panelImageType } from './objects/panelImage'
import { storyPageType } from './documents/storyPage'
import { storyType } from './documents/story'
import { siteSettingsType } from './singletons/siteSettings'

export const schemaTypes = [
  // Singletons
  settings,
  siteSettingsType,
  // Documents
  page,
  post,
  person,
  storyType,
  // Objects — panelImage must come before storyPage since storyPage references it
  panelImageType,
  storyPageType,
  button,
  blockContent,
  blockContentTextOnly,
  infoSection,
  callToAction,
  link,
]
