import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateProductFaq } from '@/utils/seoOptimizer';

interface ProductFaqProps {
  platform: {
    name: string;
  };
  category: {
    name: string;
  };
  deliveryTime?: string;
}

export function ProductFaq({ platform, category, deliveryTime }: ProductFaqProps) {
  // Otomatik olarak SSS oluştur
  const { questions } = generateProductFaq({ platform, category, deliveryTime });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {questions.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}