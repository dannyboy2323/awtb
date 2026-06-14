import { CogIcon, DocumentIcon, ImageIcon } from "@sanity/icons";
import type { StructureBuilder, StructureResolver } from "sanity/structure";

/**
 * Custom Studio sidebar structure for Postcard Stories.
 * Shows Stories and Site Settings prominently.
 * Template document types (post, page, person) are hidden from the sidebar.
 */

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title("Postcard Stories")
    .items([
      // Stories — the main content type
      S.listItem()
        .title("Stories")
        .icon(ImageIcon)
        .schemaType("story")
        .child(S.documentTypeList("story").title("All Stories")),

      S.divider(),

      // Site Settings singleton — only one document allowed
      S.listItem()
        .title("Site Settings")
        .icon(CogIcon)
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
    ]);
