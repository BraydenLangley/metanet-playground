import React, { useState, useCallback } from 'react';
import { PaymentForm } from '@/components/PaymentForm';
import { MentionTextArea } from '@/components/MentionTextArea';
import { DisplayableIdentity } from '@/types/identity';
import { Code, MessageSquare, Zap, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Simplified identity display
const IdentityDisplay = React.memo<{
  identity: DisplayableIdentity;
}>(({
  identity
}) => <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
      {identity.name?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{identity.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">@{identity.abbreviatedKey}</p>
    </div>
  </div>);
IdentityDisplay.displayName = 'IdentityDisplay';

const Index = () => {
  const [selectedIdentity, setSelectedIdentity] = useState<DisplayableIdentity | null>(null);
  const { toast } = useToast();
  
  const handleIdentitySelected = useCallback((identity: DisplayableIdentity) => {
    setSelectedIdentity(identity);
  }, []);

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden overscroll-none touch-none relative">
      <main className="h-full flex flex-col px-4 py-8 max-w-4xl mx-auto relative z-10">
        {!selectedIdentity ? <div className="flex-1 flex flex-col justify-center space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Metanet Playground
                </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Experiment with identity mentions and instant payments on the BSV blockchain. 
                Use @ to mention identities or /pay @user to send payments.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Identity Mentions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type @ to search and mention any identity on the network
                </p>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Instant Payments</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use /pay @user to send instant BSV payments
                </p>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Metanet Ready</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Built on BSV blockchain with identity resolution
                </p>
              </div>
            </div>

            {/* Main Playground Area */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Try it out
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Start typing to experiment with mentions and payments
                </p>
              </div>
              
              <MentionTextArea 
                placeholder="Type @ to mention someone or /pay @user to send payment..."
                className="min-h-[120px] text-base resize-none border-2 border-gray-200 dark:border-gray-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 rounded-xl"
              />
              
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Network Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>@ for mentions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>/pay for payments</span>
                </div>
              </div>
            </div>
          </div> : <div className="flex-1 flex flex-col overflow-hidden max-w-2xl mx-auto">
            <div className="mb-6">
              <IdentityDisplay identity={selectedIdentity} />
            </div>
            <PaymentForm recipient={selectedIdentity} onPaymentSent={() => {
          setSelectedIdentity(null);
          toast({
            title: "Payment Sent!",
            description: "Payment sent successfully"
          });
        }} onBack={() => setSelectedIdentity(null)} />
          </div>}
      </main>
    </div>;
};

export default Index;