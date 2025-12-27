import { Play } from "lucide-react";

const videos = [
  { id: "1", title: "CA Final FR Complete Revision", thumbnail: "/placeholder.svg" },
  { id: "2", title: "GST Amendments 2024", thumbnail: "/placeholder.svg" },
  { id: "3", title: "Audit Standards Summary", thumbnail: "/placeholder.svg" },
];

const YoutubeSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="section-title">Learning Videos</h2>
          <p className="text-muted-foreground mt-4">Watch free educational content on our YouTube channel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-navy/20 flex items-center justify-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="text-accent-foreground ml-1" size={24} fill="currentColor" />
                  </div>
                </div>
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors">
                {video.title}
              </h3>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block btn-secondary"
          >
            Visit YouTube Channel
          </a>
        </div>
      </div>
    </section>
  );
};

export default YoutubeSection;
