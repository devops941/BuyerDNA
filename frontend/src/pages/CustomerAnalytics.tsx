import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { customerApi } from '../api';
import { Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { BarChart } from '../components/charts/BarChart';
import { Users, Search, Filter, ArrowUpDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerAnalytics: React.FC = () => {
  const { selectedDatasetId } = useDataset();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [churnFilter, setChurnFilter] = useState('All');
  const [sortBy, setSortBy] = useState('monetary');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (selectedDatasetId) {
      loadCustomers();
    }
  }, [selectedDatasetId, pagination.page, segmentFilter, churnFilter, sortBy, order]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.getCustomers({
        datasetId: selectedDatasetId,
        page: pagination.page,
        limit: 15,
        search: search || undefined,
        segment: segmentFilter,
        churnRisk: churnFilter,
        sortBy,
        order,
      });

      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadCustomers();
  };

  if (!selectedDatasetId) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select an active dataset to view customer analytics and intelligence."
        actionText="Select Dataset"
        onAction={() => navigate('/workspace')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Analytics Directory</h2>
          <p className="text-xs text-slate-500">
            Granular transaction history, RFM quantile rankings, and predictive churn indicators per customer
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer ID or name..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filters:</span>
          </div>

          <select
            value={segmentFilter}
            onChange={(e) => {
              setSegmentFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            <option value="All">All Segments</option>
            <option value="Champions">Champions</option>
            <option value="Loyal Customers">Loyal Customers</option>
            <option value="Potential Loyalists">Potential Loyalists</option>
            <option value="Recent Customers">Recent Customers</option>
            <option value="Promising Customers">Promising Customers</option>
            <option value="Customers Needing Attention">Customers Needing Attention</option>
            <option value="At Risk Customers">At Risk Customers</option>
            <option value="Hibernating Customers">Hibernating Customers</option>
            <option value="Lost Customers">Lost Customers</option>
          </select>

          <select
            value={churnFilter}
            onChange={(e) => {
              setChurnFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            <option value="All">All Churn Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            <option value="monetary">Sort by Monetary Spend</option>
            <option value="frequency">Sort by Order Count</option>
            <option value="recencyDays">Sort by Inactivity Days</option>
            <option value="rfmCompositeScore">Sort by RFM Score</option>
          </select>

          <button
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Customer Intelligence Table */}
      <Card title="Customer Records" subtitle={`Showing ${customers.length} of ${pagination.total} customer accounts`}>
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying customer database..." />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No customer accounts matched the applied filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Assigned Segment</th>
                  <th className="py-2.5 px-3">ML Cluster</th>
                  <th className="py-2.5 px-3">Recency</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3">Total Spend</th>
                  <th className="py-2.5 px-3">AOV</th>
                  <th className="py-2.5 px-3">RFM Score</th>
                  <th className="py-2.5 px-3">Churn Risk</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{c.customerId}</div>
                      {c.name && <div className="text-[11px] text-slate-500">{c.name}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          c.segment === 'Champions'
                            ? 'success'
                            : c.segment === 'Loyal Customers'
                            ? 'teal'
                            : c.segment === 'At Risk Customers'
                            ? 'danger'
                            : 'default'
                        }
                        size="sm"
                      >
                        {c.segment}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-medium text-slate-700">{c.clusterName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{c.recencyDays}d ago</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{c.frequency}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      ${Number(c.monetary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      ${Number(c.avgOrderValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                        {c.rfmScoreStr}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          c.churnRiskLevel === 'High'
                            ? 'danger'
                            : c.churnRiskLevel === 'Medium'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {c.churnRiskLevel}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`/profiles?id=${c.customerId}`)}
                      >
                        View 360°
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
