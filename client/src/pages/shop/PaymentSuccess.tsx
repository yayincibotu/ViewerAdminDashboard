import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

const PaymentSuccess = () => {
  const [, setLocation] = useLocation();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  
  // URL'den ödeme bilgilerini çekme
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentIntent = query.get('payment_intent');
    const paymentIntentClientSecret = query.get('payment_intent_client_secret');
    const redirectStatus = query.get('redirect_status');
    
    if (paymentIntent && paymentIntentClientSecret && redirectStatus) {
      setPaymentInfo({
        paymentIntent,
        paymentIntentClientSecret,
        redirectStatus
      });
    }
  }, []);

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
          
          <h1 className="text-2xl font-bold mb-2">Ödeme Başarılı!</h1>
          <p className="text-gray-500 mb-6">
            Siparişiniz başarıyla oluşturuldu. İşleminiz kısa süre içinde tamamlanacak.
          </p>
          
          <div className="border-t border-gray-200 w-full my-6 pt-6">
            <p className="text-sm text-gray-500 mb-2">
              Sipariş numaranız: {paymentInfo?.paymentIntent || 'Yükleniyor...'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Bu bilgileri referans için saklayabilirsiniz.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setLocation('/shop')}
            >
              <Home className="mr-2 h-4 w-4" /> Ana Sayfa
            </Button>
            
            <Button 
              className="flex-1" 
              onClick={() => setLocation('/shop')}
            >
              Alışverişe Devam Et <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;