import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday,
  Person,
  Assessment,
  GetApp,
  TrendingUp,
  Opacity,
  AttachMoney,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';

function Reports() {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const response = await axios.get('/farmers/read');
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error(t('error') + ': Failed to load farmers');
    }
  };

  const generateDailyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/reports/daily?date=${selectedDate}`);
      setReportData({
        type: 'daily',
        date: selectedDate,
        data: response.data,
      });
    } catch (error) {
      console.error('Error generating daily report:', error);
      toast.error(t('error') + ': Failed to generate daily report');
    } finally {
      setLoading(false);
    }
  };

  const generateFarmerReport = async () => {
    if (!selectedFarmer) {
      toast.error(t('pleaseSelectFarmer'));
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/reports/farmer?farmer_id=${selectedFarmer}`);
      setReportData({
        type: 'farmer',
        farmer_id: selectedFarmer,
        data: response.data,
      });
    } catch (error) {
      console.error('Error generating farmer report:', error);
      toast.error(t('error') + ': Failed to generate farmer report');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/reports/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setReportData({
        type: 'monthly',
        month: selectedMonth,
        year: selectedYear,
        data: response.data,
      });
    } catch (error) {
      console.error('Error generating monthly report:', error);
      toast.error(t('error') + ': Failed to generate monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    switch (reportType) {
      case 'daily':
        generateDailyReport();
        break;
      case 'farmer':
        generateFarmerReport();
        break;
      case 'monthly':
        generateMonthlyReport();
        break;
      default:
        break;
    }
  };

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const renderDailyReport = () => {
    if (!reportData || reportData.type !== 'daily') return null;

    const { daily_stats, session_breakdown } = reportData.data;

    const chartData = session_breakdown.map(session => ({
      session: t(session._id.toLowerCase()),
      milk: session.total_milk,
      value: session.total_value,
      collections: session.collection_count,
    }));

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ marginBottom: 2 }}>
            <Typography variant="h6">
              {t('dailyReport')} - {moment(reportData.date).format('DD/MM/YYYY')}
            </Typography>
          </Alert>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Opacity sx={{ color: '#2196F3' }} />
                <Typography variant="h6" sx={{ color: '#000000' }}>
                  {daily_stats.total_milk?.toFixed(1) || 0}L
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                {t('totalMilk')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#E8F5E8', border: '1px solid #4CAF50' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney sx={{ color: '#4CAF50' }} />
                <Typography variant="h6" sx={{ color: '#000000' }}>
                  ₹{daily_stats.total_value?.toFixed(2) || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                {t('totalValue')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#FFF3E0', border: '1px solid #FF9800' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUp sx={{ color: '#FF9800' }} />
                <Typography variant="h6" sx={{ color: '#000000' }}>
                  ₹{daily_stats.total_deductions?.toFixed(2) || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                {t('deductions')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#F3E5F5', border: '1px solid #9C27B0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Assessment sx={{ color: '#9C27B0' }} />
                <Typography variant="h6" sx={{ color: '#000000' }}>
                  {daily_stats.collection_count || 0}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                {t('totalCollections')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Breakdown Chart */}
        {chartData.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ border: '2px solid #FFD700' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                  Session Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="milk" fill="#FFD700" name="Milk (L)" />
                    <Bar dataKey="value" fill="#FFA500" name="Value (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderFarmerReport = () => {
    if (!reportData || reportData.type !== 'farmer') return null;

    const { farmer, milk_summary, expenses_summary, advances_summary } = reportData.data;

    const expenseChartData = expenses_summary.map(expense => ({
      type: t(expense._id.toLowerCase()) || expense._id,
      amount: expense.total_amount,
      count: expense.count,
    }));

    const COLORS = ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#4169E1'];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ marginBottom: 2 }}>
            <Typography variant="h6">
              {t('farmerReport')} - {farmer.name}
            </Typography>
          </Alert>
        </Grid>

        {/* Farmer Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#FFF8DC', border: '2px solid #FFD700' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                {t('farmerDetails')}
              </Typography>
              <Typography><strong>{t('farmerName')}:</strong> {farmer.name}</Typography>
              <Typography><strong>{t('phone')}:</strong> {farmer.phone}</Typography>
              <Typography><strong>{t('cowCount')}:</strong> {farmer.cows.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Milk Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                Milk Summary
              </Typography>
              <Typography><strong>{t('totalCollections')}:</strong> {milk_summary.total_collections || 0}</Typography>
              <Typography><strong>{t('totalMilk')}:</strong> {milk_summary.total_milk?.toFixed(1) || 0}L</Typography>
              <Typography><strong>{t('totalValue')}:</strong> ₹{milk_summary.total_value?.toFixed(2) || 0}</Typography>
              <Typography><strong>{t('finalAmount')}:</strong> ₹{milk_summary.final_amount?.toFixed(2) || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Advances Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#E8F5E8', border: '1px solid #4CAF50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                {t('advances')} Summary
              </Typography>
              <Typography><strong>{t('totalAdvances')}:</strong> ₹{advances_summary.total_given?.toFixed(2) || 0}</Typography>
              <Typography><strong>{t('totalRemaining')}:</strong> ₹{advances_summary.total_remaining?.toFixed(2) || 0}</Typography>
              <Typography><strong>Total Deducted:</strong> ₹{advances_summary.total_deducted?.toFixed(2) || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Expense Breakdown Chart */}
        {expenseChartData.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ border: '2px solid #FFD700' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                  {t('expenseBreakdown')}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, amount }) => `${type}: ₹${amount}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderMonthlyReport = () => {
    if (!reportData || reportData.type !== 'monthly') return null;

    const { daily_trends } = reportData.data;

    const chartData = daily_trends.map(day => ({
      date: moment(day._id).format('DD/MM'),
      milk: day.total_milk,
      value: day.total_value,
      collections: day.collection_count,
    }));

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ marginBottom: 2 }}>
            <Typography variant="h6">
              {t('monthlyReport')} - {moment().month(reportData.month - 1).format('MMMM')} {reportData.year}
            </Typography>
          </Alert>
        </Grid>

        {/* Monthly Trends Chart */}
        <Grid item xs={12}>
          <Card sx={{ border: '2px solid #FFD700' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                {t('milkTrends')}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="milk" stroke="#FFD700" strokeWidth={3} name="Milk (L)" />
                  <Line type="monotone" dataKey="value" stroke="#FFA500" strokeWidth={3} name="Value (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Data Table */}
        <Grid item xs={12}>
          <Card sx={{ border: '2px solid #FFD700' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                Daily Data
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#FFD700' }}>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                        {t('date')}
                      </TableCell>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                        {t('totalMilk')}
                      </TableCell>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                        {t('totalValue')}
                      </TableCell>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                        {t('collectionCount')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {daily_trends.map((day) => (
                      <TableRow key={day._id} sx={{ '&:hover': { backgroundColor: '#FFF8DC' } }}>
                        <TableCell>{moment(day._id).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>{day.total_milk.toFixed(1)}L</TableCell>
                        <TableCell>₹{day.total_value.toFixed(2)}</TableCell>
                        <TableCell>{day.collection_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Card sx={{ marginBottom: 3, backgroundColor: '#FFF8DC', border: '2px solid #FFD700' }}>
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: '#000000', fontWeight: 600, textAlign: 'center' }}
          >
            {t('reportsAndAnalytics')}
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  sx={{ backgroundColor: 'white' }}
                >
                  <MenuItem value="daily">{t('dailyReport')}</MenuItem>
                  <MenuItem value="farmer">{t('farmerReport')}</MenuItem>
                  <MenuItem value="monthly">{t('monthlyReport')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {reportType === 'daily' && (
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={t('selectDate')}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ backgroundColor: 'white' }}
                />
              </Grid>
            )}

            {reportType === 'farmer' && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('selectFarmerForReport')}</InputLabel>
                  <Select
                    value={selectedFarmer}
                    onChange={(e) => setSelectedFarmer(e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                  >
                    {farmers.map((farmer) => (
                      <MenuItem key={farmer._id} value={farmer._id}>
                        {farmer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {reportType === 'monthly' && (
              <>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>{t('selectMonth')}</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      sx={{ backgroundColor: 'white' }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {moment().month(i).format('MMMM')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label={t('selectYear')}
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    InputProps={{ inputProps: { min: 2020, max: 2030 } }}
                    sx={{ backgroundColor: 'white' }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
                sx={{
                  backgroundColor: '#FFD700',
                  color: '#000000',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#E6C200',
                  },
                }}
              >
                {loading ? 'Generating...' : t('generateReport')}
              </Button>
            </Grid>

            {reportData && (
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={() => {
                    if (reportData.type === 'monthly') {
                      exportToCSV(reportData.data.daily_trends, `monthly-report-${reportData.month}-${reportData.year}.csv`);
                    }
                  }}
                  sx={{
                    borderColor: '#FFD700',
                    color: '#FFD700',
                    '&:hover': {
                      backgroundColor: '#FFF8DC',
                      borderColor: '#E6C200',
                    },
                  }}
                >
                  {t('export')}
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportData && (
        <Card sx={{ border: '2px solid #FFD700' }}>
          <CardContent>
            {reportData.type === 'daily' && renderDailyReport()}
            {reportData.type === 'farmer' && renderFarmerReport()}
            {reportData.type === 'monthly' && renderMonthlyReport()}
          </CardContent>
        </Card>
      )}

      {!reportData && !loading && (
        <Card sx={{ border: '2px solid #FFD700' }}>
          <CardContent>
            <Box textAlign="center" py={6}>
              <Assessment sx={{ fontSize: 60, color: '#FFD700', marginBottom: 2 }} />
              <Typography variant="h6" sx={{ color: '#666666' }}>
                Select report type and parameters, then click "Generate Report" to view analytics
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default Reports;