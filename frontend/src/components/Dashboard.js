import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
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
  const theme = useTheme();
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

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const today = moment().format('YYYY-MM-DD');
      const startWeek = moment().startOf('week').format('YYYY-MM-DD');
      const endWeek = moment().endOf('week').format('YYYY-MM-DD');
      const startMonth = moment().startOf('month').format('YYYY-MM-DD');
      const endMonth = moment().endOf('month').format('YYYY-MM-DD');

      const farmersResponse = await axios.get('/farmers/read');
      const totalFarmers = farmersResponse.data.length;

      const allCollectionsResponse = await axios.get('/collections/read');
      const allCollections = allCollectionsResponse.data;

      const todayCollectionsData = allCollections.filter(c => c.date === today);
      const todayStats = todayCollectionsData.reduce((acc, collection) => {
        acc.collections += 1;
        acc.milk += collection.total_liters;
        acc.revenue += collection.final_amount;
        return acc;
      }, { collections: 0, milk: 0, revenue: 0 });

      const weeklyCollections = allCollections.filter(c => moment(c.date).isBetween(startWeek, endWeek, null, '[]'));
      const weeklyStats = weeklyCollections.reduce((acc, collection) => {
        acc.milk += collection.total_liters;
        acc.revenue += collection.final_amount;
        return acc;
      }, { milk: 0, revenue: 0 });

      const monthlyCollections = allCollections.filter(c => moment(c.date).isBetween(startMonth, endMonth, null, '[]'));
      const monthlyStats = monthlyCollections.reduce((acc, collection) => {
        acc.milk += collection.total_liters;
        acc.revenue += collection.final_amount;
        return acc;
      }, { milk: 0, revenue: 0 });

      setDashboardData({
        totalFarmers,
        todayCollections: todayStats.collections,
        todayMilk: todayStats.milk,
        todayRevenue: todayStats.revenue,
        weeklyMilk: weeklyStats.milk,
        weeklyRevenue: weeklyStats.revenue,
        monthlyMilk: monthlyStats.milk,
        monthlyRevenue: monthlyStats.revenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.background.paper} 100%)`,
        border: `2px solid ${theme.palette.primary.main}`,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 16px ${theme.palette.primary.main}33`,
        },
      }}
    >
      <CardContent sx={{ padding: { xs: '12px', sm: '16px' } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                marginBottom: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                marginBottom: 0.5,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color || theme.palette.secondary.main,
              borderRadius: '50%',
              width: { xs: 40, sm: 60 },
              height: { xs: 40, sm: 60 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.getContrastText(color || theme.palette.secondary.main),
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
        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: 'text.primary',
          fontWeight: 600,
          marginBottom: 3,
          textAlign: 'center',
          fontSize: { xs: '1.5rem', sm: '2rem' },
        }}
      >
        {t('welcomeToDashboard')}
      </Typography>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Today's Summary */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, marginBottom: 2, paddingLeft: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {t('todaysSummary')}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('totalFarmers')} value={dashboardData.totalFarmers} icon={<People fontSize="large" />} color="#4CAF50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('totalCollections')} value={dashboardData.todayCollections} icon={<Opacity fontSize="large" />} color="#2196F3" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('totalMilk')} value={`${dashboardData.todayMilk.toFixed(1)}${t('liters')}`} icon={<Opacity fontSize="large" />} color="#FF9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('totalRevenue')} value={`₹${dashboardData.todayRevenue.toFixed(2)}`} icon={<TrendingUp fontSize="large" />} color="#9C27B0" />
        </Grid>
        
        {/* Weekly Summary */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, marginTop: 3, marginBottom: 2, paddingLeft: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {t('thisWeekSummary')}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard title={t('totalMilk')} value={`${dashboardData.weeklyMilk.toFixed(1)}`} subtitle={t('liters')} icon={<Opacity fontSize="large" />} color="#00BCD4" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard title={t('totalRevenue')} value={`₹${dashboardData.weeklyRevenue.toFixed(2)}`} icon={<AccountBalance fontSize="large" />} color="#795548" />
        </Grid>
        
        {/* Monthly Summary */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, marginTop: 3, marginBottom: 2, paddingLeft: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {t('thisMonthSummary')}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard title={t('totalMilk')} value={`${dashboardData.monthlyMilk.toFixed(1)}`} subtitle={t('liters')} icon={<Opacity fontSize="large" />} color="#00BCD4" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard title={t('totalRevenue')} value={`₹${dashboardData.monthlyRevenue.toFixed(2)}`} icon={<AccountBalance fontSize="large" />} color="#795548" />
        </Grid>
        
        {/* Welcome Message */}
        <Grid item xs={12}>
          <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main} 100%)`, border: `2px solid ${theme.palette.primary.main}`, marginTop: 3, textAlign: 'center', padding: { xs: 1, sm: 2 } }}>
            <CardContent>
              <Typography variant="h5" component="div" sx={{ color: 'text.primary', fontWeight: 600, marginBottom: 2, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {t('appTitle')}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1.1rem' }, maxWidth: '800px', margin: '0 auto' }}>
                Comprehensive milk collection management system designed for efficiency, accuracy, and ease of use. Track farmers, manage collections, monitor expenses, and generate detailed reports all in one place.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
