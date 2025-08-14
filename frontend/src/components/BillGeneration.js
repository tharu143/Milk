// BillGeneration.js
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
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CalendarToday,
  Person,
  GetApp,
  ContentCopy,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import notoSansTamil from '../fonts/notoSansTamil'; // Adjust path as needed

function BillGeneration() {
  const { t, i18n } = useTranslation();
  const [farmers, setFarmers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [startDate, setStartDate] = useState(moment().subtract(1, 'month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [reportData, setReportData] = useState(null);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedSms, setSelectedSms] = useState('');

  useEffect(() => {
    fetchFarmers();
    fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [collectionsRes, expensesRes, advancesRes] = await Promise.all([
        axios.get('/collections/read'),
        axios.get('/expenses/read'),
        axios.get('/advances/read'),
      ]);
      setCollections(collectionsRes.data);
      setExpenses(expensesRes.data);
      setAdvances(advancesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('error') + ': Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    if (!selectedFarmer) {
      toast.error(t('pleaseSelectFarmer'));
      return;
    }

    const filteredCollections = collections.filter(
      (col) =>
        col.farmer_id === selectedFarmer &&
        moment(col.date).isBetween(startDate, endDate, null, '[]')
    );

    const filteredExpenses = expenses.filter(
      (exp) =>
        exp.farmer_id === selectedFarmer &&
        moment(exp.date).isBetween(startDate, endDate, null, '[]')
    );

    const filteredAdvances = advances.filter(
      (adv) =>
        adv.farmer_id === selectedFarmer &&
        moment(adv.date).isBetween(startDate, endDate, null, '[]')
    );

    const totalMilkLiters = filteredCollections.reduce((sum, col) => sum + col.total_liters, 0);
    const totalMilkValue = filteredCollections.reduce((sum, col) => sum + col.value, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalAdvances = filteredAdvances.reduce((sum, adv) => sum + adv.amount_given, 0);
    const remaining = totalMilkValue - totalExpenses - totalAdvances;

    // Group collections by day for detailed bill
    const dailyMilk = filteredCollections.reduce((acc, col) => {
      const day = moment(col.date).format('DD/MM/YYYY');
      if (!acc[day]) {
        acc[day] = { liters: 0, rate: col.daily_rate, total: 0 };
      }
      acc[day].liters += col.total_liters;
      acc[day].total += col.value;
      return acc;
    }, {});

    const farmer = farmers.find((f) => f._id === selectedFarmer);

    setReportData({
      farmerName: farmer ? farmer.name : 'Unknown',
      totalMilkLiters,
      totalMilkValue,
      totalExpenses,
      totalAdvances,
      remaining,
      collections: filteredCollections,
      expenses: filteredExpenses,
      advances: filteredAdvances,
      dailyMilk: Object.entries(dailyMilk).map(([day, data]) => ({ day, ...data })),
    });

    // Generate SMS with daily breakdown
    let smsText = `Bill Summary for ${farmer ? farmer.name : 'Unknown'}\nPeriod: ${moment(startDate).format(
      'DD/MM/YYYY'
    )} to ${moment(endDate).format('DD/MM/YYYY')}\n\nDaily Milk Details:\n`;
    Object.entries(dailyMilk).forEach(([day, data]) => {
      smsText += `${day}: ${data.liters.toFixed(1)}L @ ₹${data.rate.toFixed(2)}/L = ₹${data.total.toFixed(2)}\n`;
    });
    smsText += `\nTotal Milk: ${totalMilkLiters.toFixed(1)}L\nTotal Milk Value: ₹${totalMilkValue.toFixed(
      2
    )}\nTotal Expenses: ₹${totalExpenses.toFixed(2)}\nTotal Advances: ₹${totalAdvances.toFixed(
      2
    )}\nRemaining Amount: ₹${remaining.toFixed(2)}`;
    setSelectedSms(smsText);
  };

  const generatePDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();

    // Add custom font for Tamil if language is 'ta'
    const isTamil = i18n.language === 'ta';
    if (isTamil) {
      doc.addFileToVFS('NotoSansTamil-Regular.ttf', notoSansTamil.font);
      doc.addFont('NotoSansTamil-Regular.ttf', 'NotoSansTamil', 'normal');
      doc.setFont('NotoSansTamil');
    } else {
      doc.setFont("helvetica");
    }

    // Add title and headers
    doc.setFontSize(18);
    doc.text(t('billSummary'), 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${t('farmer')}: ${reportData.farmerName}`, 20, 40);
    doc.text(
      `${t('period')}: ${moment(startDate).format('DD/MM/YYYY')} to ${moment(endDate).format('DD/MM/YYYY')}`,
      20,
      50
    );

    // Summary Table
    autoTable(doc, {
      startY: 60,
      head: [[t('description'), t('value')]],
      body: [
        [t('totalMilkLiters'), `${reportData.totalMilkLiters.toFixed(1)}L`],
        [t('totalMilkValue'), `₹${reportData.totalMilkValue.toFixed(2)}`],
        [t('totalExpenses'), `₹${reportData.totalExpenses.toFixed(2)}`],
        [t('totalAdvances'), `₹${reportData.totalAdvances.toFixed(2)}`],
        [t('remainingAmount'), `₹${reportData.remaining.toFixed(2)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      styles: { textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      columnStyles: {
        0: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        1: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      },
    });

    // Daily Milk Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [[t('day'), t('liters'), t('rate'), t('total')]],
      body: reportData.dailyMilk.map((daily) => [
        daily.day,
        daily.liters.toFixed(1),
        `₹${daily.rate.toFixed(2)}`,
        `₹${daily.total.toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      styles: { textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      columnStyles: {
        0: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        1: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        2: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        3: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      },
    });

    // Detailed Collections Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [[t('date'), t('session'), t('totalLiters'), t('rate'), t('value')]],
      body: reportData.collections.map((col) => [
        moment(col.date).format('DD/MM/YYYY'),
        t(col.session.toLowerCase()),
        col.total_liters.toFixed(1),
        `₹${col.daily_rate.toFixed(2)}`,
        `₹${col.value.toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      styles: { textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      columnStyles: {
        0: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        1: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        2: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        3: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        4: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      },
    });

    // Detailed Expenses Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [[t('date'), t('type'), t('description'), t('amount')]],
      body: reportData.expenses.map((exp) => [
        moment(exp.date).format('DD/MM/YYYY'),
        t(exp.type.toLowerCase()),
        exp.description,
        `₹${exp.amount.toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      styles: { textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      columnStyles: {
        0: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        1: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        2: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        3: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      },
    });

    // Detailed Advances Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [[t('date'), t('amountGiven'), t('remaining')]],
      body: reportData.advances.map((adv) => [
        moment(adv.date).format('DD/MM/YYYY'),
        `₹${adv.amount_given.toFixed(2)}`,
        `₹${adv.remaining.toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      styles: { textColor: [0, 0, 0], font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      columnStyles: {
        0: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        1: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
        2: { font: isTamil ? 'NotoSansTamil' : 'helvetica' },
      },
    });

    doc.save(`bill_${reportData.farmerName}_${startDate}_${endDate}.pdf`);
    toast.success('PDF generated successfully');
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(selectedSms).then(() => {
      toast.success(t('copiedToClipboard'));
    }).catch(() => {
      toast.error(t('failedToCopy'));
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ marginBottom: 3, backgroundColor: '#FFF8DC', border: '2px solid #FFD700' }}>
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: '#000000', fontWeight: 600, textAlign: 'center' }}
          >
            {t('bills')}
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('farmer')}</InputLabel>
                <Select
                  value={selectedFarmer}
                  onChange={(e) => setSelectedFarmer(e.target.value)}
                  sx={{ backgroundColor: 'white' }}
                >
                  <MenuItem value="">{t('selectFarmer')}</MenuItem>
                  {farmers.map((farmer) => (
                    <MenuItem key={farmer._id} value={farmer._id}>
                      {farmer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('startDate')}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ backgroundColor: 'white' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('endDate')}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ backgroundColor: 'white' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={generateReport}
                sx={{
                  backgroundColor: '#FFD700',
                  color: '#000000',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E6C200' },
                }}
              >
                {t('generateBill')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {reportData && (
        <Card sx={{ border: '2px solid #FFD700' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ color: '#000000', textAlign: 'center' }}>
              {t('periodSummary')}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={2}>
                <Alert severity="info" sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                  <Typography variant="body1">
                    <strong>{t('totalMilkLiters')}:</strong> {reportData.totalMilkLiters.toFixed(1)}L
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={2}>
                <Alert severity="info" sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                  <Typography variant="body1">
                    <strong>{t('totalMilkValue')}:</strong> ₹{reportData.totalMilkValue.toFixed(2)}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={2}>
                <Alert severity="info" sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                  <Typography variant="body1">
                    <strong>{t('totalExpenses')}:</strong> ₹{reportData.totalExpenses.toFixed(2)}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={2}>
                <Alert severity="info" sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                  <Typography variant="body1">
                    <strong>{t('totalAdvances')}:</strong> ₹{reportData.totalAdvances.toFixed(2)}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={2}>
                <Alert severity="info" sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                  <Typography variant="body1">
                    <strong>{t('remainingAmount')}:</strong> ₹{reportData.remaining.toFixed(2)}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#000000', marginTop: 2 }}>
                  {t('dailyMilkDetails')}
                </Typography>
                <Paper sx={{ marginTop: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#FFD700' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('day')}</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('liters')}</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('rate')}</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.dailyMilk.map((daily) => (
                        <tr key={daily.day} style={{ '&:hover': { backgroundColor: '#FFF8DC' } }}>
                          <td style={{ padding: '8px' }}>{daily.day}</td>
                          <td style={{ padding: '8px' }}>{daily.liters.toFixed(1)}L</td>
                          <td style={{ padding: '8px' }}>₹{daily.rate.toFixed(2)}</td>
                          <td style={{ padding: '8px' }}>₹{daily.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Paper>
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="center" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={generatePDF}
                  sx={{
                    backgroundColor: '#FFD700',
                    color: '#000000',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#E6C200' },
                  }}
                >
                  {t('downloadPDF')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ContentCopy />}
                  onClick={() => setSmsDialogOpen(true)}
                  sx={{
                    backgroundColor: '#2196F3',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#1976D2' },
                  }}
                >
                  {t('viewSMS')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={smsDialogOpen}
        onClose={() => setSmsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { border: '2px solid #FFD700', borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ backgroundColor: '#FFD700', color: '#000000', fontWeight: 600 }}>
          {t('smsPreview')}
        </DialogTitle>
        <DialogContent sx={{ padding: 3, backgroundColor: '#FFF8DC' }}>
          <Paper
            sx={{
              padding: 2,
              backgroundColor: 'white',
              border: '1px solid #FFD700',
              borderRadius: '8px',
            }}
          >
            <Typography variant="body1" sx={{ color: '#000000', whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
              {selectedSms}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ padding: 2, backgroundColor: '#FFF8DC' }}>
          <Button onClick={() => setSmsDialogOpen(false)} sx={{ color: '#666666' }}>
            {t('close')}
          </Button>
          <Button
            onClick={handleCopySms}
            variant="contained"
            startIcon={<ContentCopy />}
            sx={{
              backgroundColor: '#FFD700',
              color: '#000000',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#E6C200' },
            }}
          >
            {t('copyToClipboard')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BillGeneration;