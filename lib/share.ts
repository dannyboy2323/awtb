/** Link destination rendered in the desktop share widget. */
export interface ShareLinkDestination {
  id: string
  label: string
  kind: 'link'
  href: string
}

/** Clipboard action rendered in the desktop share widget. */
export interface ShareCopyDestination {
  id: string
  label: string
  kind: 'copy'
}

/** Print action rendered in the desktop share widget. */
export interface SharePrintDestination {
  id: string
  label: string
  kind: 'print'
}

/** Any supported destination rendered in the desktop share widget. */
export type ShareDestination = ShareLinkDestination | ShareCopyDestination | SharePrintDestination
function addToAnyUrl(service: string, url: string, title: string): string {
  const params = new URLSearchParams({ linkurl: url, linkname: title })
  return `https://www.addtoany.com/add_to/${service}?${params.toString()}`
}

/**
 * Builds the complete desktop sharing menu for the current page.
 *
 * Instagram does not expose a web sharing endpoint, so that destination copies
 * the URL for pasting. The final AddToAny item exposes its broader service list.
 */
export function getShareDestinations(url: string, title: string): ShareDestination[] {
  const encodedMessage = encodeURIComponent(`${title} ${url}`)
  const emailParams = new URLSearchParams({ subject: title, body: url })

  return [
    { id: 'sms', label: 'SMS / Messages', kind: 'link', href: `sms:?body=${encodedMessage}` },
    { id: 'email', label: 'Email', kind: 'link', href: `mailto:?${emailParams.toString()}` },
    { id: 'print', label: 'Print', kind: 'print' },
    {
      id: 'facebook',
      label: 'Facebook',
      kind: 'link',
      href: addToAnyUrl('facebook', url, title),
    },
    { id: 'x', label: 'X', kind: 'link', href: addToAnyUrl('x', url, title) },
    { id: 'reddit', label: 'Reddit', kind: 'link', href: addToAnyUrl('reddit', url, title) },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      kind: 'link',
      href: addToAnyUrl('linkedin', url, title),
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      kind: 'link',
      href: `https://wa.me/?text=${encodedMessage}`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      kind: 'link',
      href: addToAnyUrl('telegram', url, title),
    },
    {
      id: 'pinterest',
      label: 'Pinterest',
      kind: 'link',
      href: addToAnyUrl('pinterest', url, title),
    },
    {
      id: 'threads',
      label: 'Threads',
      kind: 'link',
      href: addToAnyUrl('threads', url, title),
    },
    { id: 'instagram', label: 'Instagram (copy link)', kind: 'copy' },
    { id: 'copy', label: 'Copy link', kind: 'copy' },
    {
      id: 'more',
      label: 'More apps & sites',
      kind: 'link',
      href: `https://www.addtoany.com/share?${new URLSearchParams({
        linkurl: url,
        linkname: title,
      }).toString()}`,
    },
  ]
}
