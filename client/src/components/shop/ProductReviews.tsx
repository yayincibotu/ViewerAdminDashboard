import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Star, AlertCircle, CheckCircle2, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ProductReviewsProps {
  productId: number;
  platform: string;
  category: string;
}

// Types for our interface
interface Review {
  id: number;
  product_id: number;
  user_id: number | null;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  verified_purchase: boolean;
  helpful_count: number;
  report_count: number;
  status: string;
  source: 'user' | 'auto';
  author_info: string | null;
  platform: string | null;
  country_code: string | null;
  device_type: string | null;
  social_proof: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
  // Resolved from relations
  user?: {
    username: string;
  };
}

interface NewReviewForm {
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
}

export function ProductReviews({ productId, platform, category }: ProductReviewsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [newReview, setNewReview] = useState<NewReviewForm>({
    rating: 5,
    title: '',
    content: '',
    pros: [''],
    cons: [''],
  });

  // Fetch reviews for this product
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['/api/product-reviews', productId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/product-reviews?productId=${productId}`);
      const data = await response.json();
      return data as Review[];
    },
    enabled: !!productId,
  });
  
  // Check if the current user has already submitted a review
  useEffect(() => {
    if (reviews && user) {
      const userReview = reviews.find(review => 
        review.user_id === user.id || 
        (review.user && review.user.username === user.username)
      );
      
      setHasUserReviewed(!!userReview);
    }
  }, [reviews, user]);

  // Mutation for adding a new review
  const addReviewMutation = useMutation({
    mutationFn: async (newReview: any) => {
      const response = await apiRequest('POST', '/api/product-reviews', newReview);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the reviews query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/product-reviews', productId] });
      
      // Reset the form and hide it
      setNewReview({
        rating: 5,
        title: '',
        content: '',
        pros: [''],
        cons: [''],
      });
      setShowWriteReview(false);
      
      // Show success toast
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error) => {
      console.error('Failed to submit review:', error);
      toast({
        title: "Failed to submit review",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Mutation for marking a review as helpful
  const markHelpfulMutation = useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: number, isHelpful: boolean }) => {
      const response = await apiRequest('POST', '/api/review-votes', { reviewId, isHelpful });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-reviews', productId] });
    },
  });

  // Handle adding a review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to submit a review",
        variant: "destructive",
      });
      return;
    }
    
    // Filter out empty pros and cons
    const filteredPros = newReview.pros.filter(pro => pro.trim() !== '');
    const filteredCons = newReview.cons.filter(con => con.trim() !== '');
    
    addReviewMutation.mutate({
      productId,
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      pros: filteredPros,
      cons: filteredCons,
      platform,
      category,
    });
  };

  // Handle marking a review as helpful or not
  const handleVote = (reviewId: number, isHelpful: boolean) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to vote on reviews",
        variant: "destructive",
      });
      return;
    }
    
    markHelpfulMutation.mutate({ reviewId, isHelpful });
  };

  // Helper function to calculate rating statistics
  const getRatingStats = () => {
    if (!reviews || reviews.length === 0) return { 
      avgRating: 0, 
      ratingCounts: [0, 0, 0, 0, 0],
      totalReviews: 0
    };
    
    const totalReviews = reviews.length;
    let sumRatings = 0;
    const ratingCounts = [0, 0, 0, 0, 0]; // 5 star, 4 star, 3 star, 2 star, 1 star
    
    reviews.forEach(review => {
      sumRatings += review.rating;
      ratingCounts[5 - review.rating]++;
    });
    
    return {
      avgRating: sumRatings / totalReviews,
      ratingCounts,
      totalReviews
    };
  };

  // Handle adding more pros/cons fields
  const handleAddField = (field: 'pros' | 'cons') => {
    setNewReview(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  // Handle removing pros/cons fields
  const handleRemoveField = (field: 'pros' | 'cons', index: number) => {
    setNewReview(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Handle updating pros/cons field content
  const handleUpdateField = (field: 'pros' | 'cons', index: number, value: string) => {
    setNewReview(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  // Filter reviews based on active tab
  const filteredReviews = reviews?.filter(review => {
    if (activeTab === 'all') return true;
    if (activeTab === 'verified') return review.verified_purchase;
    if (activeTab === '5star') return review.rating === 5;
    if (activeTab === 'critical') return review.rating < 4;
    return true;
  });

  const stats = getRatingStats();

  // Generate star display for a rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex flex-row gap-0.5">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
      </div>
    );
  };

  // Schema.org review aggregate markup for SEO
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": stats.avgRating.toFixed(1),
      "reviewCount": stats.totalReviews,
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <section className="w-full" itemScope itemType="https://schema.org/Product">
      {/* JSON-LD script for SEO */}
      {stats.totalReviews > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdData)
          }}
        />
      )}
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between" id="customer-reviews">
            <h2 className="text-2xl">Customer Reviews</h2>
            {!showWriteReview && user && (
              <Button 
                onClick={() => setShowWriteReview(true)} 
                disabled={hasUserReviewed}
                title={hasUserReviewed ? "You have already reviewed this product" : "Share your experience"}
                aria-label={hasUserReviewed ? "You have already reviewed this product" : "Write a review"}
              >
                {hasUserReviewed ? "Already Reviewed" : "Write a Review"}
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            <meta itemProp="reviewCount" content={stats.totalReviews.toString()} />
            {stats.totalReviews} reviews for this product
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Show write review form if button clicked */}
          {showWriteReview && (
            <Card className="mb-6 border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Write Your Review</CardTitle>
                <CardDescription>Share your experience with this product</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddReview}>
                  <div className="flex flex-col gap-4">
                    {/* Rating */}
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-8 h-8 cursor-pointer ${
                              star <= newReview.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Review Title</Label>
                      <Input
                        id="title"
                        required
                        value={newReview.title}
                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                        placeholder="Summarize your experience"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-2">
                      <Label htmlFor="content">Review Details</Label>
                      <Textarea
                        id="content"
                        required
                        value={newReview.content}
                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                        placeholder="Tell others about your experience with this product"
                        rows={5}
                      />
                    </div>
                    
                    {/* Pros */}
                    <div className="space-y-2">
                      <Label>What did you like?</Label>
                      {newReview.pros.map((pro, index) => (
                        <div key={`pro-${index}`} className="flex gap-2 items-center">
                          <Input
                            value={pro}
                            onChange={(e) => handleUpdateField('pros', index, e.target.value)}
                            placeholder={`Pro #${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField('pros', index)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddField('pros')}
                      >
                        + Add more
                      </Button>
                    </div>
                    
                    {/* Cons */}
                    <div className="space-y-2">
                      <Label>What could be improved?</Label>
                      {newReview.cons.map((con, index) => (
                        <div key={`con-${index}`} className="flex gap-2 items-center">
                          <Input
                            value={con}
                            onChange={(e) => handleUpdateField('cons', index, e.target.value)}
                            placeholder={`Con #${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField('cons', index)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddField('cons')}
                      >
                        + Add more
                      </Button>
                    </div>
                    
                    <div className="flex gap-4 justify-end mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowWriteReview(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addReviewMutation.isPending}>
                        {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        
          {/* Rating Summary with structured data*/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-5xl font-bold mb-2" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <meta itemProp="worstRating" content="1" />
                <meta itemProp="bestRating" content="5" />
                <span itemProp="ratingValue">{stats.avgRating.toFixed(1)}</span>
              </div>
              <div className="flex mb-2">
                {renderStars(Math.round(stats.avgRating))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Based on <span itemProp="reviewCount">{stats.totalReviews}</span> reviews
              </div>
            </div>
            
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-4">
                  <div className="flex items-center w-16">
                    {renderStars(star)}
                  </div>
                  <Progress
                    value={stats.totalReviews ? (stats.ratingCounts[5 - star] / stats.totalReviews) * 100 : 0}
                    className="h-2 flex-1"
                  />
                  <div className="w-12 text-xs text-gray-500 dark:text-gray-400">
                    {stats.ratingCounts[5 - star]}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Reviews Tabs */}
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-4 overflow-x-auto">
              <TabsTrigger value="all">All Reviews</TabsTrigger>
              <TabsTrigger value="verified">Verified Purchases</TabsTrigger>
              <TabsTrigger value="5star">5 Star</TabsTrigger>
              <TabsTrigger value="critical">Critical Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="pt-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                  <p>Failed to load reviews. Please try again later.</p>
                </div>
              ) : !filteredReviews?.length ? (
                <div className="flex flex-col items-center p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No reviews found in this category.
                  </p>
                </div>
              ) : (
                <div className="space-y-6" itemProp="review">
                  {filteredReviews.map((review) => (
                    <article 
                      key={review.id} 
                      className="mb-6"
                      itemScope 
                      itemType="https://schema.org/Review"
                    >
                      <meta itemProp="datePublished" content={new Date(review.created_at).toISOString()} />
                      
                      <Card className="overflow-hidden">
                        <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl mb-1" itemProp="name">{review.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                                  <meta itemProp="worstRating" content="1" />
                                  <meta itemProp="bestRating" content="5" />
                                  <meta itemProp="ratingValue" content={review.rating.toString()} />
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  <time dateTime={new Date(review.created_at).toISOString()}>
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </time>
                                </span>
                                {review.verified_purchase && (
                                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {review.source === 'auto' && (
                                <Badge variant="outline" className="text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30">
                                  Auto-generated
                                </Badge>
                              )}
                              {review.platform && (
                                <Badge variant="outline">
                                  {review.platform}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="mb-4" itemProp="reviewBody">{review.content}</p>
                          
                          {(review.pros?.length > 0 || review.cons?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              {review.pros?.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-green-600 dark:text-green-400 flex items-center">
                                    <ThumbsUp className="w-4 h-4 mr-2" /> Pros
                                  </h4>
                                  <ul className="space-y-1 list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                                    {review.pros.map((pro, i) => (
                                      <li key={i}>{pro}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {review.cons?.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center">
                                    <ThumbsDown className="w-4 h-4 mr-2" /> Cons
                                  </h4>
                                  <ul className="space-y-1 list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                                    {review.cons.map((con, i) => (
                                      <li key={i}>{con}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between p-4 border-t">
                          <div className="flex items-center gap-2" itemProp="author" itemScope itemType="https://schema.org/Person">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback>{review.user?.username?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium" itemProp="name">
                              {review.user?.username || review.author_info || 'Anonymous'}
                            </span>
                            {review.country_code && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {review.country_code}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleVote(review.id, true)}
                              aria-label="Mark as helpful"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{review.helpful_count || 0}</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleVote(review.id, false)}
                              aria-label="Mark as not helpful"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                              title="Report this review"
                              aria-label="Report this review"
                            >
                              <Flag className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}