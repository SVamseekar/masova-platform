import React, { useEffect, useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import axios from 'axios';

interface KPITile {
  kpiName: string;
  category: string;
  currentValue: number;
  unit: string;
  previousValue: number;
  percentChange: number;
  trend: string;
  status: string;
  target: number;
}

interface ExecutiveSummary {
  reportPeriod: string;
  startDate: string;
  endDate: string;
  financialSummary: {
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    netProfit: number;
    grossProfitMargin: number;
    netProfitMargin: number;
    operatingExpenses: number;
    ebitda: number;
    roi: number;
    revenueByChannel: Record<string, number>;
  };
  operationalMetrics: {
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    customerRetentionRate: number;
    averageDeliveryTime: number;
    orderAccuracyRate: number;
  };
  kpiTiles: KPITile[];
  growthMetrics: {
    revenueGrowthRate: number;
    customerGrowthRate: number;
    orderGrowthRate: number;
    profitGrowthRate: number;
    projectedAnnualRevenue: string;
    topDrivers: Array<{
      driverName: string;
      description: string;
      contribution: number;
    }>;
  };
  insights: Array<{
    priority: string;
    category: string;
    title: string;
    description: string;
    recommendation: string;
    potentialImpact: number;
    impactType: string;
  }>;
}

const ExecutiveDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('MONTH');
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    fetchExecutiveSummary();
  }, [period]);

  const fetchExecutiveSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8086/api/bi/executive-summary?period=${period}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch executive summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Excellent': return '#10b981';
      case 'Good': return '#0066CC';
      case 'Warning': return '#f59e0b';
      case 'Critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div>
        <AppHeader title="Executive Dashboard" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading Executive Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <AppHeader title="Executive Dashboard" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ fontSize: '18px', color: '#ef4444' }}>Failed to load data</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <AppHeader title="Executive Dashboard" />

      <div style={{ padding: '30px' }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>
              Executive Summary
            </h1>
            <p style={{ color: '#6b7280', margin: '0' }}>
              {summary.startDate} to {summary.endDate}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['WEEK', 'MONTH', 'QUARTER', 'YEAR'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  ...(period === p
                    ? {
                        background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(0, 102, 204, 0.3)'
                      }
                    : {
                        backgroundColor: 'white',
                        color: '#1f2937',
                        border: '1px solid #e5e7eb'
                      })
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {summary.kpiTiles.map((kpi, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
                  {kpi.kpiName}
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: getStatusColor(kpi.status) + '20',
                  color: getStatusColor(kpi.status)
                }}>
                  {kpi.status}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>
                  {kpi.unit === 'INR' ? formatCurrency(kpi.currentValue) : kpi.currentValue.toFixed(2)}
                </span>
                {kpi.unit !== 'INR' && (
                  <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>{kpi.unit}</span>
                )}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: kpi.percentChange >= 0 ? '#10b981' : '#ef4444' }}>
                {formatPercent(kpi.percentChange)} vs previous
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Target: {kpi.unit === 'INR' ? formatCurrency(kpi.target) : kpi.target.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e5e7eb' }}>
            {['overview', 'financial', 'operations', 'growth', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: activeTab === tab ? '#0066CC' : '#6b7280',
                  borderBottom: activeTab === tab ? '3px solid #0066CC' : '3px solid transparent',
                  marginBottom: '-2px',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Financial Snapshot */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              }}>
                <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                  Financial Snapshot
                </h3>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Revenue</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                    {formatCurrency(summary.financialSummary.totalRevenue)}
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Net Profit</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                    {formatCurrency(summary.financialSummary.netProfit)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Gross Margin</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066CC' }}>
                      {summary.financialSummary.grossProfitMargin.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Net Margin</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066CC' }}>
                      {summary.financialSummary.netProfitMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              }}>
                <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                  Growth Metrics
                </h3>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Revenue Growth</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                      {formatPercent(summary.growthMetrics.revenueGrowthRate)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Customer Growth</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066CC' }}>
                      {formatPercent(summary.growthMetrics.customerGrowthRate)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Order Growth</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                      {formatPercent(summary.growthMetrics.orderGrowthRate)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Profit Growth</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {formatPercent(summary.growthMetrics.profitGrowthRate)}
                    </div>
                  </div>
                </div>
                <div style={{ paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Projected Annual Revenue</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                    {summary.growthMetrics.projectedAnnualRevenue}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
                Profit & Loss Summary
              </h3>
              {[
                { label: 'Total Revenue', value: summary.financialSummary.totalRevenue, color: '#10b981' },
                { label: 'Total Costs', value: -summary.financialSummary.totalCosts, color: '#ef4444' },
                { label: 'Gross Profit', value: summary.financialSummary.grossProfit, color: '#1f2937' },
                { label: 'Operating Expenses', value: -summary.financialSummary.operatingExpenses, color: '#ef4444' },
                { label: 'EBITDA', value: summary.financialSummary.ebitda, color: '#1f2937' },
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: idx < 4 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <span style={{ color: '#6b7280' }}>{item.label}</span>
                  <span style={{ fontWeight: 'bold', color: item.color }}>
                    {formatCurrency(Math.abs(item.value))}
                  </span>
                </div>
              ))}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '2px solid #1f2937',
                marginTop: '8px'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Net Profit</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                  {formatCurrency(summary.financialSummary.netProfit)}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
                Revenue by Channel
              </h3>
              {Object.entries(summary.financialSummary.revenueByChannel).map(([channel, revenue]) => {
                const percentage = (revenue / summary.financialSummary.totalRevenue) * 100;
                return (
                  <div key={channel} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>{channel}</span>
                      <span style={{ color: '#6b7280' }}>{formatCurrency(revenue)}</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '10px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '5px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      {percentage.toFixed(1)}% of total
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {[
              { label: 'Total Orders', value: summary.operationalMetrics.totalOrders, color: '#0066CC' },
              { label: 'Avg Order Value', value: formatCurrency(summary.operationalMetrics.averageOrderValue), color: '#10b981' },
              { label: 'Active Customers', value: summary.operationalMetrics.activeCustomers, color: '#8b5cf6' },
              { label: 'New Customers', value: summary.operationalMetrics.newCustomers, color: '#f59e0b' },
              { label: 'Retention Rate', value: summary.operationalMetrics.customerRetentionRate.toFixed(1) + '%', color: '#0066CC' },
              { label: 'Avg Delivery Time', value: summary.operationalMetrics.averageDeliveryTime.toFixed(0) + ' mins', color: '#10b981' },
            ].map((metric, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '15px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{metric.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: metric.color }}>
                  {typeof metric.value === 'number' ? metric.value.toLocaleString('en-IN') : metric.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'growth' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
                Top Growth Drivers
              </h3>
              {summary.growthMetrics.topDrivers.map((driver, idx) => (
                <div key={idx} style={{
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: idx < summary.growthMetrics.topDrivers.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{driver.driverName}</div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#10b98120',
                      color: '#10b981'
                    }}>
                      {driver.contribution.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{driver.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            {summary.insights.map((insight, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '24px',
                marginBottom: '20px',
                borderLeft: `5px solid ${insight.priority === 'HIGH' ? '#ef4444' : insight.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: '0' }}>
                    {insight.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: insight.priority === 'HIGH' ? '#ef444420' : insight.priority === 'MEDIUM' ? '#f59e0b20' : '#10b98120',
                      color: insight.priority === 'HIGH' ? '#ef4444' : insight.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'
                    }}>
                      {insight.priority}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#6b728020',
                      color: '#6b7280'
                    }}>
                      {insight.category}
                    </span>
                  </div>
                </div>
                <p style={{ color: '#4b5563', margin: '0 0 16px 0' }}>{insight.description}</p>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Recommendation:</div>
                  <div style={{ color: '#4b5563' }}>{insight.recommendation}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>Potential Impact:</span>
                  <span style={{ color: '#4b5563' }}>
                    {insight.impactType.includes('Revenue') || insight.impactType.includes('Cost')
                      ? formatCurrency(insight.potentialImpact)
                      : `${insight.potentialImpact}%`}
                  </span>
                  <span style={{ color: '#9ca3af' }}>({insight.impactType})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDashboardPage;
