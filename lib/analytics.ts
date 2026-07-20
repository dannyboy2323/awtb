/**
 * Stable semantic event names used by the browser analytics boundary.
 *
 * Keep names in past tense and never include user-provided data in the event
 * name. Dynamic context belongs in PostHog's event properties.
 */
export const analyticsEvents = {
  contentAnchorOpened: 'content_anchor_opened',
  draftModeDisabled: 'draft_mode_disabled',
  footerAboutOpened: 'footer_about_opened',
  headerAboutOpened: 'header_about_opened',
  headerHomeOpened: 'header_home_opened',
  lightboxClosed: 'story_lightbox_closed',
  panelOpened: 'story_panel_opened',
  portableLinkOpened: 'portable_link_opened',
  sanityCorsManagementOpened: 'sanity_cors_management_opened',
  storyOpened: 'story_opened',
} as const

/** Every supported semantic browser event. */
export type AnalyticsEvent = (typeof analyticsEvents)[keyof typeof analyticsEvents]
