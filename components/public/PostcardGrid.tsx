/**
 * PostcardGrid — below-the-fold grid of all story postcards.
 * Renders after the user scrolls past the DeskHero section.
 */

interface Story {
  _id: string;
  title: string;
  slug: string;
  postcard: {
    alt?: string;
    asset?: unknown;
  } | null;
}

interface PostcardGridProps {
  stories: Story[];
}

export default function PostcardGrid({ stories }: PostcardGridProps) {
  return (
    <section className="postcard-grid bg-[#0A0E11] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <div key={story._id} className="postcard-container">
              <p className="text-white">{story.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
