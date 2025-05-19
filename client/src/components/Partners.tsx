import * as React from 'react';
import OptimizedImage from './OptimizedImage';

// Sample partners data
const partnersList = [
  {
    name: "Twitch",
    logo: "/images/platforms/twitch.png",
    url: "https://www.twitch.tv"
  },
  {
    name: "YouTube",
    logo: "/images/platforms/youtube.png",
    url: "https://www.youtube.com"
  },
  {
    name: "TikTok",
    logo: "/images/platforms/tiktok.png",
    url: "https://www.tiktok.com"
  },
  {
    name: "Instagram",
    logo: "/images/platforms/instagram.png",
    url: "https://www.instagram.com"
  },
  {
    name: "Kick",
    logo: "/images/platforms/kick.png",
    url: "https://www.kick.com"
  },
  {
    name: "Trovo",
    logo: "/images/platforms/trovo.png",
    url: "https://www.trovo.live"
  }
];

const Partners: React.FC = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Supported Platforms</h2>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {partnersList.map((partner, index) => (
            <a 
              key={index} 
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-transform hover:scale-110"
              aria-label={`Visit ${partner.name}`}
            >
              <div className="w-32 h-16 flex items-center justify-center grayscale transition-all hover:grayscale-0">
                <OptimizedImage
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  width={100}
                  height={50}
                  objectFit="contain"
                  loadingStrategy="lazy"
                />
              </div>
            </a>
          ))}
        </div>
        
        <p className="text-center text-gray-500 mt-8 text-sm">
          We support all major streaming and social media platforms to help grow your audience
        </p>
      </div>
    </section>
  );
};

export default Partners;