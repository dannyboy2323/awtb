import { GetPageQueryResult } from '@/sanity.types'

export type PageBuilderSection = NonNullable<NonNullable<GetPageQueryResult>['pageBuilder']>[number]
export type ExtractPageBuilderType<T extends PageBuilderSection['_type']> = Extract<
  PageBuilderSection,
  { _type: T }
>

/**
 * Represents a Link after GROQ dereferencing (page becomes a slug string).
 *
 * The Sanity starter also supported `post` links; that document type has been
 * removed, so the post linkType and field are gone.
 */
export type DereferencedLink = {
  _type: 'link'
  linkType?: 'href' | 'page'
  href?: string
  page?: string | null
  openInNewTab?: boolean
}
