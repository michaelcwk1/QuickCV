import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Printer } from 'lucide-react';
import { CVData } from '@/lib/types';
import { toast } from 'sonner';

interface DownloadOptionsProps {
  cvData: CVData;
}

export function DownloadOptions({ cvData }: DownloadOptionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  // ✅ Load Midtrans Snap script
  useEffect(() => {
    const existingScript = document.querySelector('#midtrans-script');
    if (existingScript) {
      setSnapReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-script';
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Midtrans Snap loaded');
      setSnapReady(true);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Midtrans Snap');
      toast.error('Failed to load payment system');
    };

    document.body.appendChild(script);

    return () => {
      // Jangan remove script agar tidak perlu reload
    };
  }, []);

  const generateHtmlContent = (): string => {
    const cvDocument = document.querySelector("#cv-preview")?.cloneNode(true) as HTMLElement;
    cvDocument.style = "width: auto;";
    const content = cvDocument?.outerHTML;
    return `
    <!doctype html>
     <html>
       <head>
         <meta charset="UTF-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
         <style type="text/tailwindcss"></style>
       </head>
       <body style="display: flex;justify-content: center;">
        <div style="max-width: 794px;">
          ${content}
        </div>
       </body>
     </html>
     `;
  };

  // ✅ Panggil API backend untuk buat transaksi Midtrans
  const handlePayment = async (onSuccessAction: () => void) => {
    if (!snapReady) {
      toast.error("Payment system not ready yet. Please wait...");
      return;
    }

    try {
      setIsGenerating(true);
      console.log('🔄 Initiating payment...');

      const payload = {
        orderId: `ORDER-${Date.now()}`,
        amount: 5000,
        email: cvData.basicInfo.email || 'guest@quickcv.com',
        phone: cvData.basicInfo.phone || '08123456789',
        name: cvData.basicInfo.name || 'Guest User',
        itemDetails: [
          {
            id: 'cv-export',
            price: 5000,
            quantity: 1,
            name: 'CV Export & Print License'
          }
        ]
      };

      console.log('📤 Sending payload:', payload);

      const response = await fetch("http://localhost:3001/api/payment/init", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Payment data received:', data);

      if (!data.success || !data.token) {
        throw new Error(data.message || "Failed to get payment token");
      }

      // ✅ Pastikan window.snap tersedia
      if (!window.snap) {
        throw new Error("Midtrans Snap not loaded");
      }

      // ✅ Jalankan Snap popup
      window.snap.pay(data.token, {
        onSuccess: function (result) {
          console.log('✅ Payment success:', result);
          toast.success("Payment successful! Generating your file...");
          // Jangan ada redirect, langsung jalankan action
          onSuccessAction();
        },
        onPending: function (result) {
          console.log('⏳ Payment pending:', result);
          toast.message("Payment pending. Please complete the transaction.");
          setIsGenerating(false);
        },
        onError: function (result) {
          console.error('❌ Payment error:', result);
          toast.error("Payment failed. Please try again.");
          setIsGenerating(false);
        },
        onClose: function () {
          console.log('🚪 Snap popup closed');
          toast.message("Payment canceled. You can try again anytime.");
          setIsGenerating(false);
        },
      });

    } catch (error) {
      console.error('❌ Payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to initiate payment: ${errorMsg}`);
      setIsGenerating(false);
    }
  };

  // ✅ Fungsi export HTML (dipanggil setelah bayar sukses)
  const exportHtml = () => {
    handlePayment(() => {
      const htmlContent = generateHtmlContent();
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${cvData.basicInfo.name.replace(/\s+/g, '-')}-${cvData.basicInfo.role.replace(/\s+/g, '-')}-CV.html`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, 100);

      toast.success("CV exported as HTML successfully");
    });
  };

  // ✅ Fungsi print (dipanggil setelah bayar sukses)
  const openPrintPreview = () => {
    handlePayment(() => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Please allow popups to print your CV");
        setIsGenerating(false);
        return;
      }

      printWindow.document.write(generateHtmlContent());
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      setIsGenerating(false);
      toast.success("Print preview opened");
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Download Options
        </h3>
        <p className="text-xs text-muted-foreground">
          Pay once (Rp5.000) to unlock download & print features
        </p>
        {!snapReady && (
          <p className="text-xs text-yellow-600">
            ⏳ Loading payment system...
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-2 justify-center"
          onClick={exportHtml}
          disabled={isGenerating || !snapReady}
        >
          <FileText className="h-4 w-4" />
          <span>Export HTML</span>
        </Button>

        <Button
          variant="outline"
          className="flex items-center gap-2 justify-center"
          onClick={openPrintPreview}
          disabled={isGenerating || !snapReady}
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </Button>
      </div>
    </div>
  );
}

export default DownloadOptions;