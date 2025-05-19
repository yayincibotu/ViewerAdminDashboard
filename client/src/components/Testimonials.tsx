import * as React from 'react';
import OptimizedImage from './OptimizedImage';

interface TestimonialProps {
  name: string;
  role: string;
  image: string;
  quote: string;
  company: string;
}

const testimonials: TestimonialProps[] = [
  {
    name: "Alex Johnson",
    role: "Twitch Streamer",
    image: "/images/testimonials/user1.jpg",
    quote: "ViewerApps has been a game-changer for my channel. I've seen a 300% increase in viewer engagement since I started using their services.",
    company: "GamerLogic"
  },
  {
    name: "Sarah Williams",
    role: "Content Creator",
    image: "/images/testimonials/user2.jpg",
    quote: "I was struggling to gain traction on YouTube until I discovered ViewerApps. Their services helped me reach the algorithm threshold I needed.",
    company: "CreativeMinds"
  },
  {
    name: "Michael Chen",
    role: "Social Media Manager",
    image: "/images/testimonials/user3.jpg",
    quote: "The analytics and support provided by ViewerApps have been invaluable for our marketing campaigns. Highly recommended!",
    company: "DigitalVision"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 mr-4 rounded-full overflow-hidden">
                  <OptimizedImage 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12"
                    loadingStrategy="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;