import { Card } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Transaction {
  id: number;
  type: 'payment' | 'deposit';
  status: 'successful' | 'failed';
  description: string;
  amount: number;
  currency: string;
  date: string;
  time: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isSuccessful = transaction.status === 'successful';
  const isDeposit = transaction.type === 'deposit';

  const icon = isDeposit ? ArrowUpRight : ArrowDownLeft;
  const iconColor = isDeposit ? 'text-green-600' : 'text-purple-800';
  const iconBg = isDeposit ? 'bg-green-100' : 'bg-purple-100';

  const statusColor = isSuccessful ? 'text-green-600' : 'text-red-500';
  const statusText = isSuccessful ? 'Successful' : 'Failed';

  const formattedAmount = `${transaction.currency}${new Intl.NumberFormat('en-US').format(
    transaction.amount
  )}`;

  return (
    <Card className="p-4 shadow-none border-0 rounded-none cursor-pointer hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
       
        <div
          className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center shrink-0`}
        >
          {/* Note: figma uses an ArrowDownLeft for payment and ArrowUpRight for deposit (opposite of typical wallet conventions, but matching the figma style) */}
          {isDeposit ? (
            <ArrowUpRight className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <ArrowDownLeft className={`h-5 w-5 ${iconColor}`} />
          )}
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 mb-0.5 truncate">
            {transaction.description}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{transaction.date}</span>
            <span>|</span>
            <span>{transaction.time}</span>
          </div>
        </div>

        {/* Right Info: Amount and Status */}
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">
            {formattedAmount}
          </p>
          <p className={`text-xs font-medium ${statusColor}`}>
            {statusText}
          </p>
        </div>
      </div>
    </Card>
  );
}