import React from 'react';
import { useQuery } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TwitchViewers: React.FC = () => {
  // Fetch Twitch Viewer plans
  const { data: plans = [] } = useQuery({ 
    queryKey: ['/api/subscription-plans'],
  });

  // Filter plans related to Twitch viewers
  const twitchViewerPlans = plans.filter((plan: any) => 
    plan.platform === 'twitch' && plan.name.includes('Viewers')
  );

  // Convert API plans to pricing card format
  const pricingPlans = twitchViewerPlans.map((plan: any) => ({
    name: plan.name,
    price: plan.price,
    period: "month",
    planId: plan.id,
    popular: plan.isPopular,
    features: plan.features.map((feature: string) => ({
      name: feature,
      included: true
    })).concat(
      plan.geographicTargeting 
        ? [{ name: "Geographic Targeting", included: true }] 
        : [{ name: "Geographic Targeting", included: false }]
    )
  }));

  const faqs = [
    {
      question: "What is a Twitch viewbot?",
      answer: "A Twitch viewbot is a service that increases the number of viewers displayed on your Twitch stream. This helps increase visibility and attract organic viewers to your channel."
    },
    {
      question: "Is using a viewbot against Twitch's TOS?",
      answer: "Our service uses advanced methods that are designed to be undetectable. However, we recommend using our service responsibly and within reasonable numbers for your channel size."
    },
    {
      question: "How quickly will the viewers appear on my stream?",
      answer: "Viewers will start appearing in your stream within 5-10 minutes after activation through our dashboard."
    },
    {
      question: "Can I adjust the number of viewers?",
      answer: "Yes, our dashboard allows you to adjust the number of viewers (up to your plan's limit) at any time during your stream."
    },
    {
      question: "Do these viewers chat in my stream?",
      answer: "Basic plans include view count only. For chat interaction, you'll need to upgrade to our Chat Package plans which include active chatters."
    }
  ];

  const benefits = [
    {
      title: "Increased Visibility",
      description: "Higher viewer counts push your stream up in Twitch's directory, making it more visible to organic viewers.",
      icon: "fas fa-chart-line"
    },
    {
      title: "Easier Path to Affiliate & Partner",
      description: "Maintain the viewership requirements needed to qualify for Twitch Affiliate and Partner programs.",
      icon: "fas fa-handshake"
    },
    {
      title: "Attract Real Viewers",
      description: "Psychology shows people prefer active streams. More viewers attracts organic viewers to your content.",
      icon: "fas fa-users"
    },
    {
      title: "Customizable Viewcount",
      description: "Adjust your viewer count through our dashboard to maintain realistic growth patterns.",
      icon: "fas fa-sliders-h"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-purple-900 to-purple-700 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <span className="inline-block py-1 px-3 rounded-full bg-purple-500 text-white text-xs font-semibold mb-3">TWITCH SERVICES</span>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Twitch Viewbot Service</h1>
                <p className="text-lg mb-6 text-purple-100">Boost your Twitch channel's visibility with our reliable, undetectable viewer bot service. Get higher rankings in Twitch categories and attract real viewers.</p>
                <div className="flex gap-4">
                  <Button className="bg-white text-purple-800 hover:bg-purple-100">
                    <a href="#pricing">View Pricing</a>
                  </Button>
                  <Button variant="outline" className="border-white text-white hover:bg-purple-800">
                    <a href="#how-it-works">How It Works</a>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="relative">
                  <Card className="border-0 shadow-2xl">
                    <CardContent className="p-0">
                      <img 
                        src="/images/twitch-viewers-hero.jpg" 
                        alt="Twitch stream with viewers" 
                        className="rounded-lg w-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://via.placeholder.com/600x400?text=Twitch+Streaming';
                        }}
                      />
                    </CardContent>
                  </Card>
                  <div className="absolute -bottom-5 -right-5 bg-purple-600 rounded-lg p-4 shadow-lg">
                    <div className="text-2xl font-bold">1000+</div>
                    <div className="text-sm">Happy Streamers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">EASY TO USE</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How Our Twitch Viewbot Works</h2>
              <p className="text-gray-600">Get started with our service in just a few simple steps and start boosting your Twitch presence immediately.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
                <p className="text-gray-600">Create an account and choose a subscription plan that fits your streaming needs.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect Channel</h3>
                <p className="text-gray-600">Enter your Twitch channel name in your dashboard settings.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Go Live</h3>
                <p className="text-gray-600">Start your stream on Twitch as you normally would.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">4</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Activate Viewers</h3>
                <p className="text-gray-600">Use our dashboard to activate viewers and adjust the count as needed.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">WHY CHOOSE US</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits of Our Twitch Viewbot</h2>
              <p className="text-gray-600">Our service provides multiple advantages to help you grow your Twitch channel organically.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <i className={`${benefit.icon} text-purple-600`}></i>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">PRICING</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Twitch Viewer Plan</h2>
              <p className="text-gray-600">Affordable plans to boost your Twitch channel's growth and visibility.</p>
            </div>
            
            {/* Pricing toggle */}
            <div className="flex justify-center mb-10">
              <div className="relative flex items-center p-1 bg-gray-100 rounded-lg">
                <button className="py-2 px-5 rounded-md bg-white shadow-sm text-blue-700 font-medium">
                  Monthly Billing
                </button>
                <button className="py-2 px-5 rounded-md text-gray-700 font-medium">
                  Annual Billing
                </button>
                <span className="absolute right-0 top-0 transform translate-x-2 -translate-y-1/2 bg-green-500 text-white text-xs font-bold rounded-full py-0.5 px-2">
                  Save 20%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingPlans.length > 0 ? (
                pricingPlans.map((plan, index) => (
                  <PricingCard
                    key={index}
                    name={plan.name}
                    price={plan.price}
                    period={plan.period}
                    features={plan.features}
                    popular={plan.popular}
                    planId={plan.planId}
                  />
                ))
              ) : (
                // Fallback plans if API fails
                <>
                  <PricingCard
                    name="25 Viewers"
                    price={19.99}
                    period="month"
                    features={[
                      { name: "25 Live Viewers", included: true },
                      { name: "Basic Chat Bot", included: true },
                      { name: "Adjustable View Count", included: true },
                      { name: "24/7 Support", included: true },
                      { name: "Geographic Targeting", included: false }
                    ]}
                    popular={false}
                    planId={1}
                  />
                  <PricingCard
                    name="50 Viewers"
                    price={34.99}
                    period="month"
                    features={[
                      { name: "50 Live Viewers", included: true },
                      { name: "Advanced Chat Bot", included: true },
                      { name: "Adjustable View Count", included: true },
                      { name: "24/7 Support", included: true },
                      { name: "Geographic Targeting", included: false }
                    ]}
                    popular={true}
                    planId={2}
                  />
                  <PricingCard
                    name="100 Viewers"
                    price={59.99}
                    period="month"
                    features={[
                      { name: "100 Live Viewers", included: true },
                      { name: "Premium Chat Bot", included: true },
                      { name: "Adjustable View Count", included: true },
                      { name: "24/7 Support", included: true },
                      { name: "Geographic Targeting", included: true }
                    ]}
                    popular={false}
                    planId={3}
                  />
                  <PricingCard
                    name="250 Viewers"
                    price={119.99}
                    period="month"
                    features={[
                      { name: "250 Live Viewers", included: true },
                      { name: "Premium Chat Bot", included: true },
                      { name: "Adjustable View Count", included: true },
                      { name: "Priority 24/7 Support", included: true },
                      { name: "Geographic Targeting", included: true }
                    ]}
                    popular={false}
                    planId={4}
                  />
                </>
              )}
            </div>
          </div>
        </section>
        
        {/* FAQs Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">QUESTIONS</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600">Find answers to common questions about our Twitch viewer service.</p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="general">General Questions</TabsTrigger>
                  <TabsTrigger value="technical">Technical Questions</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                  <div className="space-y-4">
                    {faqs.slice(0, 3).map((faq, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                          <p className="text-gray-600">{faq.answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="technical">
                  <div className="space-y-4">
                    {faqs.slice(3).map((faq, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                          <p className="text-gray-600">{faq.answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-purple-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Boost Your Twitch Channel?</h2>
              <p className="text-lg mb-8 text-purple-100">Join thousands of streamers who have accelerated their Twitch growth with our viewer service.</p>
              <Button className="bg-white text-purple-900 hover:bg-purple-100 px-8 py-6 text-lg">
                <a href="#pricing">Get Started Today</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default TwitchViewers;