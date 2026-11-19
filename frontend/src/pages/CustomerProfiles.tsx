import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { customerApi } from '../api';
import { Customer, Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  User,
  ShoppingBag,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  CreditCard,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerProfiles: React.FC = () => {
  const { selectedDatasetId } = useDataset();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [profileData, setProfileData] = useState<{ customer: Customer; transactions: Transaction[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial customer list load
  useEffect(() => {
    if (selectedDatasetId) {
      loadCustomerList();
    }
  }, [selectedDatasetId]);

  // Load individual profile when selectedCustomerId changes
  useEffect(() => {
    if (selectedDatasetId && selectedCustomerId) {
      loadCustomerProfile(selectedCustomerId);
    }
  }, [selectedDatasetId, selectedCustomerId]);

  const loadCustomerList = async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.getCustomers({ datasetId: selectedDatasetId, limit: 100, sortBy: 'monetary' });
      setCustomerList(res.data.data);

      const queryId = searchParams.get('id');
      if (queryId) {
        setSelectedCustomerId(queryId);
      } else if (res.data.data.length > 0) {
        setSelectedCustomerId(res.data.data[0].customerId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerProfile = async (cId: string) => {
    setIsLoading(true);
    try {
      const res = await customerApi.getCustomerProfile(selectedDatasetId, cId);
      setProfileData(res.data.data);
    } catch {
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDatasetId) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Choose a dataset to explore 360-degree customer intelligence profiles."
        actionText="Select Dataset"
        onAction={() => navigate('/workspace')}
      />
    );
  }

  const customer = profileData?.customer;
  const transactions = profileData?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer 360° Intelligence Profile</h2>
          <p className="text-xs text-slate-500">
            Comprehensive lifecycle overview, RFM score vector, projected CLV, and purchase history timeline
          </p>
        </div>

        {/* Customer Select Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
          <User className="w-4 h-4 text-slate-400 ml-1" />
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              setSelectedCustomerId(e.target.value);
              setSearchParams({ id: e.target.value });
            }}
            className="text-xs font-semibold text-slate-800 focus:outline-none bg-transparent cursor-pointer"
          >
            {customerList.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                {c.customerId} - {c.segment} (${c.monetary.toFixed(0)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && !customer ? (
        <LoadingSpinner message="Retrieving individual customer transaction dossier..." />
      ) : !customer ? (
        <div className="py-12 text-center text-xs text-slate-400">Customer record not found.</div>
      ) : (
        <div className="space-y-6">
          {/* Hero Profile Header */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {customer.customerId.substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">{customer.customerId}</h3>
                    <Badge
                      variant={
                        customer.segment === 'Champions'
                          ? 'success'
                          : customer.segment === 'Loyal Customers'
                          ? 'teal'
                          : 'default'
                      }
                    >
                      {customer.segment}
                    </Badge>
                    <Badge variant="purple">{customer.clusterName}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {customer.city || 'Global Customer'} • {customer.region || 'Omnichannel'} • RFM Vector:{' '}
                    <span className="font-mono font-bold text-slate-800">{customer.rfmScoreStr}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Churn Probability</span>
                  <Badge
                    variant={
                      customer.churnRiskLevel === 'High'
                        ? 'danger'
                        : customer.churnRiskLevel === 'Medium'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {customer.churnRiskLevel} ({(customer.churnProbability * 100).toFixed(0)}%)
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Analytical KPI Cards for Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Gross Spend</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ${customer.monetary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Historical cumulative GMV</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Projected CLV</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ${customer.clvProjected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Multi-year discounted customer lifetime value</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Orders Placed</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{customer.frequency} orders</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                AOV: ${customer.avgOrderValue.toFixed(2)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Last Active</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{customer.recencyDays} days ago</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          </div>

          {/* Transaction History Timeline */}
          <Card
            title="Customer Transaction History"
            subtitle={`All ${transactions.length} recorded purchases for account ${customer.customerId}`}
          >
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-mono font-medium text-slate-800">{tx.transactionId}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {tx.productCategory}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700">{tx.quantity}</td>
                      <td className="py-2 px-3 text-slate-700">${Number(tx.unitPrice).toFixed(2)}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">${Number(tx.totalAmount).toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-600">{tx.paymentMethod}</td>
                      <td className="py-2 px-3 text-slate-600">{tx.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
