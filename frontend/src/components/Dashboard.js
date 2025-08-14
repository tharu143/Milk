import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  People,
  Opacity,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import moment from 'moment';

function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalFarmers: 0,
    todayCollections: 0,
    todayMilk: 0,
    todayRevenue: 0,
    weeklyMilk: 0,
    weeklyRevenue: 0,
    monthlyMilk: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = moment().format('YYYY-MM-DD');
      
      // Fetch farmers count
      const farmersResponse = await axios.get('/farmers/read');
      const totalFarmers = farmersResponse.data.length;

      // Fetch today's collections
      const todayCollectionsResponse = await axios.get(`/collections/read?date=${today}`);
      const todayCollections = todayCollectionsResponse.data;
      
      const todayStats = todayCollections.reduce((acc, collection) => {
        acc.collections += 1;
        acc.milk += collection.total_liters;
        acc.revenue += collection.final_amount;
        return acc;
      }, { collections: 0, milk: 0, revenue: 0 });

      // Fetch daily report for today
      const dailyReportResponse = await axios.get(`/reports/daily?date=${today}`);
      const dailyReport = dailyReportResponse.data;

      setDashboardData({
        totalFarmers,
        todayCollections: todayStats.collections,
        todayMilk: todayStats.milk,
        todayRevenue: todayStats.revenue,
        weeklyMilk: dailyReport.daily_stats?.total_milk || 0,
        weeklyRevenue: dailyReport.daily_stats?.final_amount || 0,
        monthlyMilk: dailyReport.daily_stats?.total_milk || 0,
        monthlyRevenue: dailyReport.daily_stats?.final_amount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 100%)',
        border: '2px solid #FFD700',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(255, 215, 0, 0.3)',
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                color: '#000000',
                fontWeight: 600,
                marginBottom: 1
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{ 
                color: '#000000',
                fontWeight: 700,
                marginBottom: 0.5
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ 
                  color: '#333333',
                  fontWeight: 500
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color || '#FFA500',
              borderRadius: '50%',
              width: 60,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: '#000000',
          fontWeight: 600,
          marginBottom: 3,
          textAlign: 'center'
        }}
      >
        {t('welcomeToDashboard')}
      </Typography>

      <Grid container spacing={3}>
        {/* Today's Summary */}
        <Grid item xs={12}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              color: '#000000',
              fontWeight: 600,
              marginBottom: 2,
              paddingLeft: 1
            }}
          >
            {t('todaysSummary')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('totalFarmers')}
            value={dashboardData.totalFarmers}
            icon={<People fontSize="large" />}
            color="#4CAF50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('totalCollections')}
            value={dashboardData.todayCollections}
            icon={<Opacity fontSize="large" />}
            color="#2196F3"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('totalMilk')}
            value={`${dashboardData.todayMilk.toFixed(1)}${t('liters')}`}
            icon={<Opacity fontSize="large" />}
            color="#FF9800"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('totalRevenue')}
            value={`₹${dashboardData.todayRevenue.toFixed(2)}`}
            icon={<TrendingUp fontSize="large" />}
            color="#9C27B0"
          />
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              color: '#000000',
              fontWeight: 600,
              marginTop: 3,
              marginBottom: 2,
              paddingLeft: 1
            }}
          >
            {t('thisMonthSummary')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <StatCard
            title={t('totalMilk')}
            value={`${dashboardData.monthlyMilk.toFixed(1)}`}
            subtitle={t('liters')}
            icon={<Opacity fontSize="large" />}
            color="#00BCD4"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <StatCard
            title={t('totalRevenue')}
            value={`₹${dashboardData.monthlyRevenue.toFixed(2)}`}
            icon={<AccountBalance fontSize="large" />}
            color="#795548"
          />
        </Grid>

        {/* Welcome Message */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #FFF8DC 0%, #FFD700 100%)',
              border: '2px solid #FFD700',
              marginTop: 3,
              textAlign: 'center',
              padding: 2
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  color: '#000000',
                  fontWeight: 600,
                  marginBottom: 2
                }}
              >
                {t('appTitle')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#333333',
                  fontSize: '1.1rem',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}
              >
                Comprehensive milk collection management system designed for efficiency, 
                accuracy, and ease of use. Track farmers, manage collections, monitor expenses, 
                and generate detailed reports all in one place.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;