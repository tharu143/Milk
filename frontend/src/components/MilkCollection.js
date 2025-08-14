import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ContentCopy,
  Opacity,
  Person,
  CalendarToday,
  AccessTime,
  AttachMoney,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';

function MilkCollection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [collections, setCollections] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedSms, setSelectedSms] = useState('');
  const [formData, setFormData] = useState({
    date: moment().format('YYYY-MM-DD'),
    session: 'Morning',
    farmer_id: '',
    per_cow_liters: {},
    daily_rate: 0,
    deduct_full_amount: false,
    per_liter_deduction: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/collections/read');
      setCollections(response.data);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error(t('error') + ': Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    fetchCollections();
    fetchFarmers();
  }, [fetchCollections, fetchFarmers]);

  const validateForm = () => {
    const errors = {};
    if (!formData.date) errors.date = t('required');
    if (!formData.session) errors.session = t('required');
    if (!formData.farmer_id) errors.farmer_id = t('pleaseSelectFarmer');
    if (formData.daily_rate <= 0) errors.daily_rate = t('pleaseEnterValidAmount');
    if (!Object.values(formData.per_cow_liters).some((l) => l > 0)) errors.per_cow_liters = t('pleaseEnterMilkQuantity');
    if (!formData.deduct_full_amount && formData.per_liter_deduction < 0) errors.per_liter_deduction = t('invalidAmount');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingCollection) {
        await axios.put(`/collections/update/${editingCollection._id}`, formData);
        toast.success(t('collectionUpdated'));
      } else {
        await axios.post('/collections/create', formData);
        toast.success(t('collectionAdded'));
      }
      setDialogOpen(false);
      setEditingCollection(null);
      resetForm();
      fetchCollections();
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error(t('error') + ': ' + (error.response?.data?.detail || 'Failed to save collection'));
    }
  };

  const handleEdit = (collection) => {
    const farmer = farmers.find((f) => f._id === collection.farmer_id);
    setEditingCollection(collection);
    setSelectedFarmer(farmer);
    setFormData({ ...collection });
    setDialogOpen(true);
  };

  const handleDelete = async (collectionId) => {
    try {
      await axios.delete(`/collections/delete/${collectionId}`);
      toast.success(t('collectionDeleted'));
      fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error(t('error') + ': Failed to delete collection');
    }
  };

  const handleFarmerChange = (farmerId) => {
    const farmer = farmers.find((f) => f._id === farmerId);
    setSelectedFarmer(farmer);
    const per_cow_liters = farmer?.cows.reduce((acc, cow) => ({ ...acc, [cow.cow_id]: 0 }), {}) || {};
    setFormData({ ...formData, farmer_id: farmerId, per_cow_liters });
  };

  const handleCowLitersChange = (cowId, liters) => {
    setFormData({ ...formData, per_cow_liters: { ...formData.per_cow_liters, [cowId]: parseFloat(liters) || 0 } });
  };

  const calculateTotalLiters = () => Object.values(formData.per_cow_liters).reduce((sum, liters) => sum + (liters || 0), 0);
  const calculateTotalValue = () => calculateTotalLiters() * (formData.daily_rate - (formData.deduct_full_amount ? 0 : formData.per_liter_deduction));

  const resetForm = () => {
    setFormData({
      date: moment().format('YYYY-MM-DD'),
      session: 'Morning',
      farmer_id: '',
      per_cow_liters: {},
      daily_rate: 0,
      deduct_full_amount: false,
      per_liter_deduction: 0,
    });
    setSelectedFarmer(null);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCollection(null);
    resetForm();
  };

  const handleShowSms = (smsText) => {
    setSelectedSms(smsText);
    setSmsDialogOpen(true);
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(selectedSms).then(() => toast.success(t('copiedToClipboard')), () => toast.error(t('failedToCopy')));
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress size={60} sx={{ color: 'primary.main' }} /></Box>;
  }

  return (
    <Box>
      <Card sx={{ marginBottom: 3, backgroundColor: theme.palette.background.paper }}>
        <CardContent sx={{ padding: { xs: '12px', sm: '16px' } }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, textAlign: 'center' }}>{t('milkCollectionManagement')}</Typography>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item><Typography variant="h6" sx={{ color: 'text.primary' }}>{t('totalCollections')}: {collections.length}</Typography></Grid>
            <Grid item><Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>{t('addCollection')}</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ padding: { xs: '12px', sm: '16px' } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: '650px' }}>
              <TableHead><TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('date')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('session')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('farmer')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('totalLiters')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('dailyRate')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('finalAmount')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('actions')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {collections.map((col) => (
                  <TableRow key={col._id} hover>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><CalendarToday sx={{ color: 'primary.main' }} />{moment(col.date).format('DD/MM/YYYY')}</Box></TableCell>
                    <TableCell><Chip icon={<AccessTime />} label={t(col.session.toLowerCase())} sx={{ backgroundColor: col.session === 'Morning' ? theme.palette.secondary.light : theme.palette.secondary.dark, color: theme.palette.secondary.contrastText }} /></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><Person sx={{ color: 'primary.main' }} />{col.farmer_name}</Box></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><Opacity sx={{ color: 'primary.main' }} />{col.total_liters.toFixed(1)}L</Box></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><AttachMoney sx={{ color: 'primary.main' }} />₹{col.daily_rate.toFixed(2)}</Box></TableCell>
                    <TableCell><Typography sx={{ fontWeight: 600 }}>₹{col.final_amount.toFixed(2)}</Typography></TableCell>
                    <TableCell><Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title={t('edit')}><IconButton onClick={() => handleEdit(col)} color="primary"><Edit /></IconButton></Tooltip>
                      <Tooltip title={t('delete')}><IconButton onClick={() => handleDelete(col._id)} color="error"><Delete /></IconButton></Tooltip>
                      <Tooltip title={t('smsPreview')}><IconButton onClick={() => handleShowSms(col.sms_text)} sx={{ color: '#2196F3' }}><ContentCopy /></IconButton></Tooltip>
                    </Box></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>{editingCollection ? t('editCollection') : t('addCollection')}</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'background.paper' }}>
          <Grid container spacing={3} sx={{ pt: 2 }}>
            <Grid item xs={12} md={4}><TextField fullWidth label={t('date')} type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} error={!!formErrors.date} helperText={formErrors.date} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={4}><FormControl fullWidth><InputLabel>{t('session')}</InputLabel><Select value={formData.session} onChange={(e) => setFormData({ ...formData, session: e.target.value })} error={!!formErrors.session}><MenuItem value="Morning">{t('morning')}</MenuItem><MenuItem value="Evening">{t('evening')}</MenuItem></Select></FormControl></Grid>
            <Grid item xs={12} md={4}><FormControl fullWidth><InputLabel>{t('farmer')}</InputLabel><Select value={formData.farmer_id} onChange={(e) => handleFarmerChange(e.target.value)} error={!!formErrors.farmer_id}>{farmers.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>))}</Select></FormControl></Grid>
            {selectedFarmer && (<>
              <Grid item xs={12}><Divider><Typography variant="h6">{t('milkPerCow')}</Typography></Divider></Grid>
              {selectedFarmer.cows.map((cow) => (<Grid item xs={12} md={6} key={cow.cow_id}><TextField fullWidth label={`${cow.cow_id} (${cow.breed || 'N/A'})`} type="number" value={formData.per_cow_liters[cow.cow_id] || 0} onChange={(e) => handleCowLitersChange(cow.cow_id, e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.1 }, endAdornment: <InputAdornment position="end">L</InputAdornment> }} /></Grid>))}
            </>)}
            <Grid item xs={12} md={6}><TextField fullWidth label={t('dailyRate')} type="number" value={formData.daily_rate} onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })} error={!!formErrors.daily_rate} helperText={formErrors.daily_rate} InputProps={{ inputProps: { min: 0, step: 0.1 }, startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">/L</InputAdornment> }} /></Grid>
            <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={formData.deduct_full_amount} onChange={(e) => setFormData({ ...formData, deduct_full_amount: e.target.checked, per_liter_deduction: e.target.checked ? 0 : formData.per_liter_deduction })} />} label={t('deductFullAmount')} /></Grid>
            {!formData.deduct_full_amount && (<Grid item xs={12} md={6}><TextField fullWidth label={t('perLiterDeduction')} type="number" value={formData.per_liter_deduction} onChange={(e) => setFormData({ ...formData, per_liter_deduction: parseFloat(e.target.value) || 0 })} error={!!formErrors.per_liter_deduction} helperText={formErrors.per_liter_deduction} InputProps={{ inputProps: { min: 0, step: 0.1 }, startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">/L</InputAdornment> }} /></Grid>)}
            <Grid item xs={12}><Alert severity="info"><strong>{t('totalLiters')}:</strong> {calculateTotalLiters().toFixed(1)}L | <strong>{t('totalValue')}:</strong> ₹{calculateTotalValue().toFixed(2)}</Alert></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: 'background.paper' }}><Button onClick={handleCloseDialog}>{t('cancel')}</Button><Button onClick={handleSubmit} variant="contained">{t('save')}</Button></DialogActions>
      </Dialog>
      <Dialog open={smsDialogOpen} onClose={() => setSmsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>{t('smsPreview')}</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'background.paper' }}><Paper sx={{ p: 2, my: 2 }}><Typography sx={{ whiteSpace: 'pre-line' }}>{selectedSms}</Typography></Paper></DialogContent>
        <DialogActions sx={{ backgroundColor: 'background.paper' }}><Button onClick={() => setSmsDialogOpen(false)}>{t('close')}</Button><Button onClick={handleCopySms} variant="contained" startIcon={<ContentCopy />}>{t('copyToClipboard')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default MilkCollection;
