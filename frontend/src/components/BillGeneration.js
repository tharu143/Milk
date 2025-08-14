import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import { GetApp, ContentCopy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import notoSansTamil from '../fonts/notoSansTamil'; // Adjust path as needed

function BillGeneration() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
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

  const fetchFarmers = useCallback(async () => {
    try {
      const response = await axios.get('/farmers/read');
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error(t('error') + ': Failed to load farmers');
    }
  }, [t]);

  const fetchData = useCallback(async () => {
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
  }, [t]);

  useEffect(() => {
    fetchFarmers();
    fetchData();
  }, [fetchFarmers, fetchData]);

  const generateReport = () => {
    if (!selectedFarmer) {
      toast.error(t('pleaseSelectFarmer'));
      return;
    }
    const farmer = farmers.find((f) => f._id === selectedFarmer);
    const filteredCollections = collections.filter(c => c.farmer_id === selectedFarmer && moment(c.date).isBetween(startDate, endDate, null, '[]'));
    const filteredExpenses = expenses.filter(e => e.farmer_id === selectedFarmer && moment(e.date).isBetween(startDate, endDate, null, '[]'));
    const filteredAdvances = advances.filter(a => a.farmer_id === selectedFarmer && moment(a.date).isBetween(startDate, endDate, null, '[]'));
    
    const totalMilkLiters = filteredCollections.reduce((sum, col) => sum + col.total_liters, 0);
    const totalMilkValue = filteredCollections.reduce((sum, col) => sum + col.value, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalAdvances = filteredAdvances.reduce((sum, adv) => sum + adv.amount_given, 0);
    const remaining = totalMilkValue - totalExpenses - totalAdvances;

    const dailyMilk = filteredCollections.reduce((acc, col) => {
      const day = moment(col.date).format('DD/MM/YYYY');
      if (!acc[day]) acc[day] = { liters: 0, rate: col.daily_rate, total: 0 };
      acc[day].liters += col.total_liters;
      acc[day].total += col.value;
      return acc;
    }, {});

    setReportData({
      farmerName: farmer?.name || 'Unknown',
      totalMilkLiters, totalMilkValue, totalExpenses, totalAdvances, remaining,
      collections: filteredCollections, expenses: filteredExpenses, advances: filteredAdvances,
      dailyMilk: Object.entries(dailyMilk).map(([day, data]) => ({ day, ...data })),
    });

    let smsText = `Bill for ${farmer?.name}\n${moment(startDate).format('DD/MM')} - ${moment(endDate).format('DD/MM')}\n\n`;
    Object.entries(dailyMilk).forEach(([day, data]) => {
      smsText += `${day}: ${data.liters.toFixed(1)}L = ₹${data.total.toFixed(2)}\n`;
    });
    smsText += `\nTotal Milk: ₹${totalMilkValue.toFixed(2)}\nExpenses: ₹${totalExpenses.toFixed(2)}\nAdvances: ₹${totalAdvances.toFixed(2)}\nRemaining: ₹${remaining.toFixed(2)}`;
    setSelectedSms(smsText);
  };

  const generatePDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const isTamil = i18n.language === 'ta';
    if (isTamil) {
      doc.addFileToVFS('NotoSansTamil-Regular.ttf', notoSansTamil.font);
      doc.addFont('NotoSansTamil-Regular.ttf', 'NotoSansTamil', 'normal');
      doc.setFont('NotoSansTamil');
    }
    doc.setFontSize(18);
    doc.text(t('billSummary'), 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${t('farmer')}: ${reportData.farmerName}`, 20, 40);
    doc.text(`${t('period')}: ${moment(startDate).format('DD/MM/YYYY')} to ${moment(endDate).format('DD/MM/YYYY')}`, 20, 50);

    const headStyles = { fillColor: theme.palette.primary.main, textColor: theme.palette.primary.contrastText, font: isTamil ? 'NotoSansTamil' : 'helvetica' };
    const styles = { font: isTamil ? 'NotoSansTamil' : 'helvetica' };

    autoTable(doc, { startY: 60, head: [[t('description'), t('value')]], body: [
        [t('totalMilkValue'), `₹${reportData.totalMilkValue.toFixed(2)}`],
        [t('totalExpenses'), `₹${reportData.totalExpenses.toFixed(2)}`],
        [t('totalAdvances'), `₹${reportData.totalAdvances.toFixed(2)}`],
        [t('remainingAmount'), `₹${reportData.remaining.toFixed(2)}`],
    ], theme: 'striped', headStyles, styles });

    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [[t('date'), t('session'), t('liters'), t('rate'), t('value')]], body: reportData.collections.map(c => [moment(c.date).format('DD/MM'), t(c.session.toLowerCase()), c.total_liters.toFixed(1), `₹${c.daily_rate.toFixed(2)}`, `₹${c.value.toFixed(2)}`]), headStyles, styles });
    
    if(reportData.expenses.length > 0) autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [[t('date'), t('description'), t('amount')]], body: reportData.expenses.map(e => [moment(e.date).format('DD/MM'), e.description, `₹${e.amount.toFixed(2)}`]), headStyles, styles });
    if(reportData.advances.length > 0) autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [[t('date'), t('amountGiven')]], body: reportData.advances.map(a => [moment(a.date).format('DD/MM'), `₹${a.amount_given.toFixed(2)}`]), headStyles, styles });

    doc.save(`bill_${reportData.farmerName}_${startDate}_${endDate}.pdf`);
    toast.success('PDF generated successfully');
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(selectedSms).then(() => toast.success(t('copiedToClipboard')), () => toast.error(t('failedToCopy')));
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress color="primary" /></Box>;

  return (
    <Box>
      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 600 }}>{t('bills')}</Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>{t('farmer')}</InputLabel><Select value={selectedFarmer} onChange={(e) => setSelectedFarmer(e.target.value)}>{farmers.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>))}</Select></FormControl></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label={t('startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label={t('endDate')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="contained" onClick={generateReport}>{t('generateBill')}</Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>{t('periodSummary')}</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md><Alert severity="info"><strong>{t('totalMilkValue')}:</strong> ₹{reportData.totalMilkValue.toFixed(2)}</Alert></Grid>
                <Grid item xs={6} md><Alert severity="warning"><strong>{t('totalExpenses')}:</strong> ₹{reportData.totalExpenses.toFixed(2)}</Alert></Grid>
                <Grid item xs={6} md><Alert severity="error"><strong>{t('totalAdvances')}:</strong> ₹{reportData.totalAdvances.toFixed(2)}</Alert></Grid>
                <Grid item xs={6} md><Alert severity="success"><strong>{t('remainingAmount')}:</strong> ₹{reportData.remaining.toFixed(2)}</Alert></Grid>
            </Grid>
            <TableContainer component={Paper}><Table size="small">
              <TableHead><TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell>{t('day')}</TableCell><TableCell>{t('liters')}</TableCell><TableCell>{t('rate')}</TableCell><TableCell>{t('total')}</TableCell>
              </TableRow></TableHead>
              <TableBody>{reportData.dailyMilk.map((d) => (<TableRow key={d.day}>
                <TableCell>{d.day}</TableCell><TableCell>{d.liters.toFixed(1)}L</TableCell><TableCell>₹{d.rate.toFixed(2)}</TableCell><TableCell>₹{d.total.toFixed(2)}</TableCell>
              </TableRow>))}</TableBody>
            </Table></TableContainer>
            <Box display="flex" justifyContent="center" gap={2} mt={2}>
              <Button variant="contained" startIcon={<GetApp />} onClick={generatePDF}>{t('downloadPDF')}</Button>
              <Button variant="contained" color="secondary" startIcon={<ContentCopy />} onClick={() => setSmsDialogOpen(true)}>{t('viewSMS')}</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={smsDialogOpen} onClose={() => setSmsDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>{t('smsPreview')}</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'background.paper' }}><Paper sx={{ p: 2, my: 2, whiteSpace: 'pre-line' }}>{selectedSms}</Paper></DialogContent>
        <DialogActions sx={{ backgroundColor: 'background.paper' }}><Button onClick={() => setSmsDialogOpen(false)}>{t('close')}</Button><Button onClick={handleCopySms} variant="contained" startIcon={<ContentCopy />}>{t('copyToClipboard')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default BillGeneration;
