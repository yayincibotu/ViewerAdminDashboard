import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ServiceCardProps {
  title: string;
  description: string;
  price: number;
  url: string;
  features: string[];
  popular?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, price, url, features, popular }) => {
  return (
    <Card className={`overflow-hidden border ${popular ? 'border-purple-500 shadow-lg' : 'border-gray-200'} transition-all duration-300 hover:shadow-md`}>
      {popular && (
        <div className="bg-purple-500 text-white text-xs font-semibold py-1 px-3 text-center">
          POPULAR CHOICE
        </div>
      )}
      <CardHeader className={`pb-3 ${popular ? 'bg-purple-50' : ''}`}>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-gray-600 mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4">
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-gray-500 ml-1">/month</span>
        </div>
        <ul className="mb-6 space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className={`w-full ${popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}>
          <Link href={url}>Learn More</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const TwitchPlatform: React.FC = () => {
  const { data: services = [] } = useQuery({ 
    queryKey: ['/api/services'],
  });

  // Filter to only show Twitch services
  const twitchServices = services.filter((service: any) => 
    service.platformId === 1 || service.platform === 'twitch'
  );

  const testimonials = [
    {
      content: "ViewerApps has been a game-changer for my Twitch channel. I went from averaging 5 viewers to consistently having 50+ viewers, which helped me reach affiliate status in just two weeks!",
      author: "StreamerPro92",
      avatar: "/images/testimonials/avatar1.jpg"
    },
    {
      content: "I was skeptical at first, but the viewer bot is undetectable and the chat bot makes my stream look much more active. My channel growth has been incredible since I started using ViewerApps.",
      author: "GamingWithAlex",
      avatar: "/images/testimonials/avatar2.jpg" 
    },
    {
      content: "The customer support is amazing. I had an issue with my viewer count not updating and they fixed it within minutes. Definitely worth every penny!",
      author: "TwitchQueen",
      avatar: "/images/testimonials/avatar3.jpg"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 mb-10 lg:mb-0">
                <span className="inline-block py-1 px-3 rounded-full bg-purple-600 text-white text-xs font-semibold mb-3">TWITCH SERVICES</span>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">Boost Your Twitch <br />Channel Growth</h1>
                <p className="text-lg mb-8 text-purple-100 max-w-lg">Enhance your Twitch presence with our comprehensive suite of viewer, follower, and engagement services designed for streamers of all sizes.</p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-100">
                    <Link href="#services">View Services</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-purple-800">
                    <Link href="#how-it-works">How It Works</Link>
                  </Button>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="relative">
                  <img 
                    src="/images/twitch-stats-dashboard.jpg" 
                    alt="Twitch Dashboard" 
                    className="rounded-lg shadow-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://via.placeholder.com/600x400?text=Twitch+Dashboard';
                    }}
                  />
                  <div className="absolute -bottom-5 -right-5 bg-purple-600 rounded-lg p-4 shadow-lg">
                    <div className="text-2xl font-bold">10K+</div>
                    <div className="text-sm">Happy Streamers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">1.5M+</div>
                <p className="text-gray-600">Monthly Viewers</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">50K+</div>
                <p className="text-gray-600">Affiliates Reached</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">99.9%</div>
                <p className="text-gray-600">Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <p className="text-gray-600">Customer Support</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">HOW IT WORKS</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Grow Your Twitch Audience in 4 Simple Steps</h2>
              <p className="text-gray-600">Our platform makes it easy to boost your Twitch metrics with just a few clicks</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold z-10">1</div>
                <Card className="h-full">
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold mb-3">Create an Account</h3>
                    <p className="text-gray-600">Sign up for a ViewerApps account and complete your profile to get started.</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold z-10">2</div>
                <Card className="h-full">
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold mb-3">Choose a Package</h3>
                    <p className="text-gray-600">Select from our range of viewer, chat, and follower packages to suit your needs.</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold z-10">3</div>
                <Card className="h-full">
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold mb-3">Add Your Channel</h3>
                    <p className="text-gray-600">Enter your Twitch channel details in our dashboard to connect your stream.</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold z-10">4</div>
                <Card className="h-full">
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold mb-3">Go Live & Grow</h3>
                    <p className="text-gray-600">Start streaming and watch your viewer count and engagement metrics rise in real time.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Services Section */}
        <section id="services" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">OUR SERVICES</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Twitch Growth Solutions</h2>
              <p className="text-gray-600">Choose from our most popular Twitch services designed to help you grow faster</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {twitchServices.length > 0 ? (
                twitchServices.map((service: any, index: number) => (
                  <ServiceCard
                    key={service.id}
                    title={service.name}
                    description={service.description}
                    price={service.price / 100} // Convert cents to dollars
                    url={`/twitch-${service.name.toLowerCase().replace(' ', '-')}`}
                    features={service.features || ['24/7 Support', 'Adjustable Settings', 'Real-Time Analytics']}
                    popular={service.isPopular}
                  />
                ))
              ) : (
                // Fallback services if API fails
                <>
                  <ServiceCard
                    title="Twitch Viewers"
                    description="Boost your live viewer count and increase your channel's visibility in Twitch directories"
                    price={29.99}
                    url="/twitch-viewers"
                    features={[
                      'Live viewers for your streams',
                      'Customizable viewer count',
                      'Advanced analytics dashboard', 
                      '24/7 customer support'
                    ]}
                    popular={true}
                  />
                  
                  <ServiceCard
                    title="Twitch Followers"
                    description="Grow your follower count with our high-quality follower service"
                    price={19.99}
                    url="/twitch-followers"
                    features={[
                      'Gradual follower growth',
                      'Real-looking accounts',
                      'Safe and undetectable',
                      'Progress tracking'
                    ]}
                  />
                  
                  <ServiceCard
                    title="Twitch Chat Bot"
                    description="Make your stream chat active with our intelligent chat bot service"
                    price={24.99}
                    url="/twitch-chat-bot"
                    features={[
                      'Active chat participants',
                      'Customizable chat messages',
                      'Realistic conversation',
                      'Multiple chat personas'
                    ]}
                  />
                </>
              )}
            </div>
            
            <div className="mt-12 text-center">
              <Button size="lg" variant="outline" className="border-purple-500 text-purple-700 hover:bg-purple-50">
                <Link href="/app/services">View All Twitch Services</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">TESTIMONIALS</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Streamers Say About Us</h2>
              <p className="text-gray-600">Don't just take our word for it - hear from streamers who have transformed their Twitch presence</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-300">
                        <path d="M14.625 21.75H5.625C5.12772 21.75 4.65081 21.5525 4.29917 21.2008C3.94754 20.8492 3.75 20.3723 3.75 19.875V12.375C3.75 11.3777 3.94388 10.3908 4.3213 9.46766C4.69871 8.54447 5.25438 7.70435 5.95771 7.00104C6.66103 6.29772 7.50115 5.74204 8.42433 5.36463C9.34752 4.98722 10.3344 4.79334 11.3317 4.79334C11.5904 4.79334 11.8386 4.89577 12.0192 5.07845C12.1998 5.26113 12.3001 5.51 12.3001 5.76876C12.3001 6.02752 12.1977 6.27639 12.017 6.45907C11.8364 6.64175 11.5882 6.74417 11.3295 6.74417C9.82572 6.74417 8.38417 7.34652 7.30772 8.42297C6.23127 9.49941 5.62892 10.941 5.62892 12.4447V19.8718H14.629C14.8877 19.8718 15.1359 19.9742 15.3164 20.1569C15.497 20.3396 15.5973 20.5884 15.5973 20.8472C15.5973 21.106 15.4948 21.3548 15.3142 21.5375C15.1336 21.7202 14.8854 21.8226 14.6267 21.8226L14.625 21.75Z" fill="currentColor"></path>
                        <path d="M30.375 21.75H21.375C20.8777 21.75 20.4008 21.5525 20.0492 21.2008C19.6975 20.8492 19.5 20.3723 19.5 19.875V12.375C19.5 11.3777 19.6939 10.3908 20.0713 9.46766C20.4487 8.54447 21.0044 7.70435 21.7077 7.00104C22.411 6.29772 23.2511 5.74204 24.1743 5.36463C25.0975 4.98722 26.0844 4.79334 27.0817 4.79334C27.3404 4.79334 27.5886 4.89577 27.7692 5.07845C27.9498 5.26113 28.0501 5.51 28.0501 5.76876C28.0501 6.02752 27.9477 6.27639 27.767 6.45907C27.5864 6.64175 27.3382 6.74417 27.0795 6.74417C25.5757 6.74417 24.1342 7.34652 23.0577 8.42297C21.9813 9.49941 21.3789 10.941 21.3789 12.4447V19.8718H30.379C30.6377 19.8718 30.8859 19.9742 31.0664 20.1569C31.247 20.3396 31.3473 20.5884 31.3473 20.8472C31.3473 21.106 31.2448 21.3548 31.0642 21.5375C30.8836 21.7202 30.6354 21.8226 30.3767 21.8226L30.375 21.75Z" fill="currentColor"></path>
                      </svg>
                    </div>
                    <p className="text-gray-700 mb-6">{testimonial.content}</p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.author}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/40?text=User';
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{testimonial.author}</p>
                        <p className="text-sm text-gray-500">Twitch Streamer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600">Find answers to common questions about our Twitch services</p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="general">General Questions</TabsTrigger>
                  <TabsTrigger value="technical">Technical Questions</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                  <div className="space-y-4">
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">What is a Twitch viewbot?</h3>
                        <p className="text-gray-600">A Twitch viewbot is a service that increases the number of viewers displayed on your Twitch stream. This helps increase visibility and attract organic viewers to your channel.</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Is using a viewbot against Twitch's TOS?</h3>
                        <p className="text-gray-600">Our service uses advanced methods that are designed to be undetectable. However, we recommend using our service responsibly and within reasonable numbers for your channel size.</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
                        <p className="text-gray-600">We accept all major credit cards, PayPal, and various cryptocurrencies for added privacy and convenience.</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="technical">
                  <div className="space-y-4">
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">How quickly will the viewers appear on my stream?</h3>
                        <p className="text-gray-600">Viewers will start appearing in your stream within 5-10 minutes after activation through our dashboard.</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Can I adjust the number of viewers?</h3>
                        <p className="text-gray-600">Yes, our dashboard allows you to adjust the number of viewers (up to your plan's limit) at any time during your stream.</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Do these viewers chat in my stream?</h3>
                        <p className="text-gray-600">Basic plans include view count only. For chat interaction, you'll need to upgrade to our Chat Package plans which include active chatters.</p>
                      </CardContent>
                    </Card>
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
              <p className="text-lg mb-8 text-purple-100">Join thousands of streamers who have accelerated their Twitch growth with our services</p>
              <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-100 px-8 py-6 text-lg">
                <Link href="/auth?sign-up=true">Get Started Today</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default TwitchPlatform;