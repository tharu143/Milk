import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Select, MenuItem, FormControl, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, CircularProgress, useTheme
} from '@mui/material';
import { Assessment, GetApp, TrendingUp, Opacity, AttachMoney } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';

function Reports() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [reportData, setReportData] = useState(null);

  const fetchFarmers = useCallback(async () => {
    try {
      const response = await axios.get('/farmers/read');
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error(t('error') + ': Failed to load farmers');
    }
  }, [t]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    let url = '';
    let params = {};
    switch (reportType) {
      case 'daily':
        url = '/reports/daily';
        params = { date: selectedDate };
        break;
      case 'farmer':
        if (!selectedFarmer) {
          toast.error(t('pleaseSelectFarmer'));
          setLoading(false);
          return;
        }
        url = '/reports/farmer';
        params = { farmer_id: selectedFarmer };
        break;
      case 'monthly':
        url = '/reports/monthly';
        params = { month: selectedMonth, year: selectedYear };
        break;
      default:
        setLoading(false);
        return;
    }

    try {
      const response = await axios.get(url, { params });
      setReportData({ type: reportType, data: response.data, params });
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      toast.error(t('error') + `: Failed to generate ${reportType} report`);
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedDate, selectedFarmer, selectedMonth, selectedYear, t]);

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + Object.keys(data[0]).join(",") + "\n" + data.map(row => Object.values(row).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  const renderDailyReport = () => {
    const { daily_stats, session_breakdown } = reportData.data;
    const chartData = session_breakdown.map(s => ({ session: t(s._id.toLowerCase()), milk: s.total_milk, value: s.total_value }));
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}><Alert severity="info"><Typography variant="h6">{t('dailyReport')} - {moment(reportData.params.date).format('DD/MM/YYYY')}</Typography></Alert></Grid>
        <Grid item xs={6} md={3}><Card><CardContent><Opacity color="primary" /><Typography variant="h6">{daily_stats.total_milk?.toFixed(1) || 0}L</Typography><Typography variant="body2">{t('totalMilk')}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} md={3}><Card><CardContent><AttachMoney color="primary" /><Typography variant="h6">₹{daily_stats.total_value?.toFixed(2) || 0}</Typography><Typography variant="body2">{t('totalValue')}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} md={3}><Card><CardContent><TrendingUp color="primary" /><Typography variant="h6">₹{daily_stats.total_deductions?.toFixed(2) || 0}</Typography><Typography variant="body2">{t('deductions')}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} md={3}><Card><CardContent><Assessment color="primary" /><Typography variant="h6">{daily_stats.collection_count || 0}</Typography><Typography variant="body2">{t('totalCollections')}</Typography></CardContent></Card></Grid>
        {chartData.length > 0 && <Grid item xs={12}><Card><CardContent><Typography variant="h6">Session Breakdown</Typography><ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid /><XAxis dataKey="session" /><YAxis /><Tooltip /><Legend /><Bar dataKey="milk" fill={theme.palette.primary.main} name="Milk (L)" /><Bar dataKey="value" fill={theme.palette.secondary.main} name="Value (₹)" /></BarChart></ResponsiveContainer></CardContent></Card></Grid>}
      </Grid>
    );
  };

  const renderFarmerReport = () => {
    const { farmer, milk_summary, expenses_summary, advances_summary } = reportData.data;
    const expenseChartData = expenses_summary.map(e => ({ type: t(e._id.toLowerCase()) || e._id, amount: e.total_amount }));
    const COLORS = [theme.palette.primary.main, theme.palette.secondary.main, '#FF6347', '#4CAF50'];
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}><Alert severity="info"><Typography variant="h6">{t('farmerReport')} - {farmer.name}</Typography></Alert></Grid>
        <Grid item xs={12} md={4}><Card><CardContent><Typography variant="h6">{t('farmerDetails')}</Typography><Typography><strong>{t('phone')}:</strong> {farmer.phone}</Typography><Typography><strong>{t('cowCount')}:</strong> {farmer.cows.length}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={4}><Card><CardContent><Typography variant="h6">Milk Summary</Typography><Typography><strong>{t('totalCollections')}:</strong> {milk_summary.total_collections || 0}</Typography><Typography><strong>{t('totalMilk')}:</strong> {milk_summary.total_milk?.toFixed(1) || 0}L</Typography><Typography><strong>{t('finalAmount')}:</strong> ₹{milk_summary.final_amount?.toFixed(2) || 0}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={4}><Card><CardContent><Typography variant="h6">{t('advances')} Summary</Typography><Typography><strong>{t('totalAdvances')}:</strong> ₹{advances_summary.total_given?.toFixed(2) || 0}</Typography><Typography><strong>{t('totalRemaining')}:</strong> ₹{advances_summary.total_remaining?.toFixed(2) || 0}</Typography></CardContent></Card></Grid>
        {expenseChartData.length > 0 && <Grid item xs={12}><Card><CardContent><Typography variant="h6">{t('expenseBreakdown')}</Typography><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={expenseChartData} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={100} label>{expenseChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card></Grid>}
      </Grid>
    );
  };
  
  const renderMonthlyReport = () => {
    const { daily_trends } = reportData.data;
    const chartData = daily_trends.map(d => ({ date: moment(d._id).format('DD/MM'), milk: d.total_milk, value: d.total_value }));
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}><Alert severity="info"><Typography variant="h6">{t('monthlyReport')} - {moment().month(reportData.params.month - 1).format('MMMM')} {reportData.params.year}</Typography></Alert></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">{t('milkTrends')}</Typography><ResponsiveContainer width="100%" height={300}><LineChart data={chartData}><CartesianGrid /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="milk" stroke={theme.palette.primary.main} strokeWidth={3} name="Milk (L)" /><Line type="monotone" dataKey="value" stroke={theme.palette.secondary.main} strokeWidth={3} name="Value (₹)" /></LineChart></ResponsiveContainer></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">Daily Data</Typography><TableContainer component={Paper}><Table size="small"><TableHead><TableRow sx={{backgroundColor: 'primary.light'}}><TableCell>{t('date')}</TableCell><TableCell>{t('totalMilk')}</TableCell><TableCell>{t('totalValue')}</TableCell><TableCell>{t('collectionCount')}</TableCell></TableRow></TableHead><TableBody>{daily_trends.map((d) => (<TableRow key={d._id}>
          <TableCell>{moment(d._id).format('DD/MM/YYYY')}</TableCell><TableCell>{d.total_milk.toFixed(1)}L</TableCell><TableCell>₹{d.total_value.toFixed(2)}</TableCell><TableCell>{d.collection_count}</TableCell>
        </TableRow>))}</TableBody></Table></TableContainer></CardContent></Card></Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 600 }}>{t('reportsAndAnalytics')}</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>Report Type</InputLabel><Select value={reportType} onChange={(e) => setReportType(e.target.value)}><MenuItem value="daily">{t('dailyReport')}</MenuItem><MenuItem value="farmer">{t('farmerReport')}</MenuItem><MenuItem value="monthly">{t('monthlyReport')}</MenuItem></Select></FormControl></Grid>
            {reportType === 'daily' && <Grid item xs={12} md={3}><TextField fullWidth label={t('selectDate')} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>}
            {reportType === 'farmer' && <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>{t('selectFarmer')}</InputLabel><Select value={selectedFarmer} onChange={(e) => setSelectedFarmer(e.target.value)}>{farmers.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>))}</Select></FormControl></Grid>}
            {reportType === 'monthly' && <>
              <Grid item xs={6} md={2}><FormControl fullWidth><InputLabel>{t('selectMonth')}</InputLabel><Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>{Array.from({ length: 12 }, (_, i) => (<MenuItem key={i + 1} value={i + 1}>{moment().month(i).format('MMMM')}</MenuItem>))}</Select></FormControl></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth label={t('selectYear')} type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} /></Grid>
            </>}
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={handleGenerateReport} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}>{loading ? 'Generating...' : t('generateReport')}</Button></Grid>
            {reportData && <Grid item xs={12} md={2}><Button fullWidth variant="outlined" startIcon={<GetApp />} onClick={() => exportToCSV(reportData.data.daily_trends || reportData.data, `report.csv`)}>{t('export')}</Button></Grid>}
          </Grid>
        </CardContent>
      </Card>
      
      {loading && <Box textAlign="center" py={5}><CircularProgress /></Box>}
      
      {reportData && <Card><CardContent>
        {reportType === 'daily' && renderDailyReport()}
        {reportType === 'farmer' && renderFarmerReport()}
        {reportType === 'monthly' && renderMonthlyReport()}
      </CardContent></Card>}

      {!reportData && !loading && <Card><CardContent><Box textAlign="center" py={6}><Assessment sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} /><Typography variant="h6" color="text.secondary">Select report parameters and click "Generate Report"</Typography></Box></CardContent></Card>}
    </Box>
  );
}

export default Reports;
