import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreditCardFormProps {
  value: number;
  installmentCount: number;
  installmentValue: number;
  dueDate: string;
  customerId: string;
  paymentId: string;
  holderName: string;
  holderEmail: string;
  holderCpfCnpj: string;
  holderPostalCode: string;
  holderPhone?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({
  value,
  installmentCount,
  installmentValue,
  dueDate,
  customerId,
  paymentId,
  holderName,
  holderEmail,
  holderCpfCnpj,
  holderPostalCode,
  holderPhone,
  onSuccess,
  onError,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState(holderName);
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const getCardBrand = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(cleaned)) return 'Elo';
    return null;
  };

  const cardBrand = getCardBrand(cardNumber);

  const validateForm = () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      toast.error('Número do cartão inválido');
      return false;
    }
    
    if (!cardHolderName.trim() || cardHolderName.length < 3) {
      toast.error('Nome do titular inválido');
      return false;
    }
    
    const monthNum = parseInt(expiryMonth, 10);
    if (!expiryMonth || monthNum < 1 || monthNum > 12) {
      toast.error('Mês de validade inválido');
      return false;
    }
    
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(expiryYear, 10);
    if (!expiryYear || expiryYear.length !== 4 || yearNum < currentYear || yearNum > currentYear + 20) {
      toast.error('Ano de validade inválido');
      return false;
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
      toast.error('CVV inválido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-credit-card-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            paymentId,
            customerId,
            value,
            installmentCount,
            installmentValue,
            dueDate,
            creditCard: {
              holderName: cardHolderName.toUpperCase(),
              number: cardNumber.replace(/\s/g, ''),
              expiryMonth: expiryMonth.padStart(2, '0'),
              expiryYear,
              ccv: cvv,
            },
            creditCardHolderInfo: {
              name: holderName,
              email: holderEmail,
              cpfCnpj: holderCpfCnpj,
              postalCode: holderPostalCode,
              phone: holderPhone,
              addressNumber: 'S/N',
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Pagamento aprovado!');
        onSuccess();
      } else {
        toast.error(data.error || 'Erro ao processar pagamento');
        onError(data.error || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erro de conexão. Tente novamente.');
      onError('Erro de conexão');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg font-semibold">Dados do Cartão de Crédito</CardTitle>
        <div className="mt-2">
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(installmentValue)}
          </p>
          <p className="text-sm text-muted-foreground">
            Parcela 1/{installmentCount} • Vence em {new Date(dueDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="pr-20"
                disabled={isProcessing}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {cardBrand && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {cardBrand}
                  </span>
                )}
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          {/* Card Holder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardHolderName">Nome no Cartão</Label>
            <Input
              id="cardHolderName"
              type="text"
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
              disabled={isProcessing}
            />
          </div>
          
          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Mês</Label>
              <Input
                id="expiryMonth"
                type="text"
                placeholder="MM"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').substring(0, 2))}
                maxLength={2}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Ano</Label>
              <Input
                id="expiryYear"
                type="text"
                placeholder="AAAA"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').substring(0, 4))}
                maxLength={4}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                maxLength={4}
                disabled={isProcessing}
              />
            </div>
          </div>
          
          {/* Accepted Cards */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="text-xs text-muted-foreground">Aceitamos:</span>
            <div className="flex gap-1">
              <span className="text-xs bg-muted px-2 py-1 rounded">Visa</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">Mastercard</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">Elo</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">Amex</span>
            </div>
          </div>
          
          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium">Dicas de pagamento:</p>
              <ul className="mt-1 space-y-0.5">
                <li>• Verifique se o cartão está desbloqueado para compras online</li>
                <li>• Confira se há limite disponível para a compra</li>
                <li>• Use o nome exatamente como está impresso no cartão</li>
              </ul>
            </div>
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                PAGAR AGORA • {formatCurrency(installmentValue)}
              </>
            )}
          </Button>
          
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Pagamento 100% seguro via Asaas</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreditCardForm;
