import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { apiRequest } from '../../lib/queryClient';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

// Stripe publishable key'i yükleyin
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Stripe Public Key eksik');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutProps {
  productId: number;
  quantity: number;
}

// Ödeme formu komponenti
const PaymentForm = ({ productDetails }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/shop/success',
      },
      redirect: 'if_required',
    });

    if (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Ödeme Hatası',
        description: error.message || 'Ödeme işlemi sırasında bir hata oluştu.',
        variant: 'destructive',
      });
      setPaymentStatus('error');
    } else {
      toast({
        title: 'Ödeme Başarılı!',
        description: 'Ödemeniz başarıyla tamamlandı.',
      });
      setPaymentStatus('success');
      
      // Başarı sayfasına yönlendir
      setTimeout(() => {
        setLocation('/shop/success');
      }, 2000);
    }

    setIsProcessing(false);
  };
  
  return (
    <div className="py-4">
      {paymentStatus === 'success' ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ödeme Başarılı!</h2>
          <p className="mb-6">Siparişiniz işleme alındı.</p>
          <Button onClick={() => setLocation('/shop')}>
            Alışverişe Devam Et
          </Button>
        </div>
      ) : paymentStatus === 'error' ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ödeme Hatası</h2>
          <p className="mb-6">Ödeme işlemi sırasında bir sorun oluştu. Lütfen tekrar deneyin.</p>
          <Button onClick={() => setPaymentStatus('idle')}>
            Tekrar Dene
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border p-4 rounded-lg bg-gray-50 mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Ürün:</span>
              <span>{productDetails.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Miktar:</span>
              <span>{productDetails.quantity}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Birim Fiyat:</span>
              <span>{productDetails.price.toFixed(2)} ₺</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam:</span>
              <span>{productDetails.totalAmount.toFixed(2)} ₺</span>
            </div>
          </div>

          <PaymentElement />
          
          <div className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Geri
            </Button>
            
            <Button 
              type="submit" 
              disabled={!stripe || isProcessing}
              className="ml-auto"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ödemeyi Tamamla
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

// Ana Checkout sayfası
const Checkout = () => {
  const { productId } = useParams();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState<number>(0);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [productDetails, setProductDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // URL'den quantity parametresini al
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qtyParam = urlParams.get('quantity');
    setQuantity(qtyParam ? parseInt(qtyParam) : 1);
  }, []);
  
  // Ödeme niyeti oluştur
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!productId || !quantity) return;
      
      try {
        setIsLoading(true);
        const response = await apiRequest('POST', '/api/create-digital-product-payment', {
          productId: parseInt(productId),
          quantity
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setClientSecret(data.clientSecret);
          setProductDetails(data.productDetails);
        } else {
          setError(data.error || 'Ödeme başlatılırken bir hata oluştu');
          toast({
            title: 'Hata',
            description: data.error || 'Ödeme başlatılırken bir hata oluştu',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Payment intent error:', err);
        setError('Ödeme sistemi ile bağlantı kurulamadı');
        toast({
          title: 'Bağlantı Hatası',
          description: 'Ödeme sistemi ile bağlantı kurulamadı',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [productId, quantity, toast]);
  
  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-center text-gray-500">Ödeme hazırlanıyor...</p>
          </div>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">İşlem Hatası</h2>
            <p className="mb-6">{error}</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Ödeme</h1>
        
        {clientSecret && productDetails ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm productDetails={productDetails} />
          </Elements>
        ) : (
          <div className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-center text-gray-500">Ödeme bilgileri yüklenemedi. Lütfen tekrar deneyin.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Tekrar Dene
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Checkout;