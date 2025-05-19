import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Users, BarChart2, Shield, Clock, LifeBuoy, Zap } from 'lucide-react';

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const Features: React.FC = () => {
  const features: FeatureProps[] = [
    {
      title: "Real Human Viewers",
      description: "Our service provides real human viewers, not bots, ensuring genuine engagement for your streams.",
      icon: <Users size={24} />,
      color: "text-blue-500"
    },
    {
      title: "Detailed Analytics",
      description: "Track your growth and engagement with comprehensive analytics and performance metrics.",
      icon: <BarChart2 size={24} />,
      color: "text-purple-500"
    },
    {
      title: "Account Safety",
      description: "Our services are compliant with platform policies, keeping your accounts safe and secure.",
      icon: <Shield size={24} />,
      color: "text-green-500"
    },
    {
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to assist with any questions or issues.",
      icon: <LifeBuoy size={24} />,
      color: "text-red-500"
    },
    {
      title: "Instant Delivery",
      description: "Get viewers, followers, and engagement delivered to your streams within minutes of purchase.",
      icon: <Zap size={24} />,
      color: "text-yellow-500"
    },
    {
      title: "Scheduled Services",
      description: "Plan your viewer boosts ahead of time with our advanced scheduling options.",
      icon: <Clock size={24} />,
      color: "text-indigo-500"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose ViewerApps</h2>
          <p className="text-gray-600">
            We provide industry-leading solutions to help content creators grow their audience
            and boost engagement across all major streaming platforms.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm transition-all hover:shadow-md"
            >
              <div className={`${feature.color} mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-opacity-10`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;