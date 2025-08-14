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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccountBalance,
  Person,
  CalendarToday,
  AttachMoney,
  ExpandMore,
  History,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';

function Advances() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [advances, setAdvances] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [formData, setFormData] = useState({
    farmer_id: '',
    date: moment().format('YYYY-MM-DD'),
    amount_given: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [filterFarmer, setFilterFarmer] = useState('');

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/advances/read');
      setAdvances(response.data);
    } catch (error) {
      console.error('Error fetching advances:', error);
      toast.error(t('error') + ': Failed to load advances');
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
    fetchAdvances();
    fetchFarmers();
  }, [fetchAdvances, fetchFarmers]);

  const validateForm = () => {
    const errors = {};
    if (!formData.date) errors.date = t('required');
    if (!formData.farmer_id) errors.farmer_id = t('pleaseSelectFarmer');
    if (formData.amount_given <= 0) errors.amount_given = t('pleaseEnterValidAmount');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingAdvance) {
        await axios.put(`/advances/update/${editingAdvance._id}`, { remaining: formData.remaining });
        toast.success(t('advanceUpdated'));
      } else {
        await axios.post('/advances/create', formData);
        toast.success(t('advanceGiven'));
      }
      setDialogOpen(false);
      setEditingAdvance(null);
      resetForm();
      fetchAdvances();
    } catch (error) {
      console.error('Error saving advance:', error);
      toast.error(t('error') + ': ' + (error.response?.data?.detail || 'Failed to save advance'));
    }
  };

  const handleEdit = (advance) => {
    setEditingAdvance(advance);
    setFormData({ ...advance });
    setDialogOpen(true);
  };

  const handleDelete = async (advanceId) => {
    try {
      await axios.delete(`/advances/delete/${advanceId}`);
      toast.success(t('advanceDeleted'));
      fetchAdvances();
    } catch (error) {
      console.error('Error deleting advance:', error);
      toast.error(t('error') + ': Failed to delete advance');
    }
  };

  const resetForm = () => {
    setFormData({ farmer_id: '', date: moment().format('YYYY-MM-DD'), amount_given: 0 });
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAdvance(null);
    resetForm();
  };

  const filteredAdvances = filterFarmer ? advances.filter(adv => adv.farmer_id === filterFarmer) : advances;
  const calculateTotalAdvances = () => filteredAdvances.reduce((sum, adv) => sum + adv.amount_given, 0);
  const calculateTotalRemaining = () => filteredAdvances.reduce((sum, adv) => sum + adv.remaining, 0);

  const getStatusColor = (remaining, amountGiven) => {
    if (remaining === 0) return 'success';
    if (remaining === amountGiven) return 'warning';
    return 'info';
  };

  const getStatusText = (remaining, amountGiven) => {
    if (remaining === 0) return 'Fully Deducted';
    if (remaining === amountGiven) return 'Pending';
    return 'Partially Deducted';
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress color="primary" /></Box>;
  }

  return (
    <Box>
      <Card sx={{ marginBottom: 3, backgroundColor: 'background.paper' }}>
        <CardContent sx={{ padding: { xs: '12px', sm: '16px' } }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>{t('advanceManagement')}</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>{t('farmer')}</InputLabel><Select value={filterFarmer} onChange={(e) => setFilterFarmer(e.target.value)} sx={{ backgroundColor: 'background.default' }}><MenuItem value="">{t('allFarmers')}</MenuItem>{farmers.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>))}</Select></FormControl></Grid>
            <Grid item xs={12} md={3}><Typography variant="body1"><strong>{t('totalAdvances')}:</strong> ₹{calculateTotalAdvances().toFixed(2)}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body1"><strong>{t('totalRemaining')}:</strong> ₹{calculateTotalRemaining().toFixed(2)}</Typography></Grid>
            <Grid item xs={12} md={3} display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }}><Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>{t('giveAdvance')}</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ padding: { xs: '12px', sm: '16px' } }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('date')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('farmer')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('amountGiven')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('remaining')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('actions')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filteredAdvances.map((adv) => (
                  <React.Fragment key={adv._id}>
                    <TableRow hover>
                      <TableCell><Box display="flex" alignItems="center" gap={1}><CalendarToday color="primary" />{moment(adv.date).format('DD/MM/YYYY')}</Box></TableCell>
                      <TableCell><Box display="flex" alignItems="center" gap={1}><Person color="primary" />{adv.farmer_name}</Box></TableCell>
                      <TableCell><Box display="flex" alignItems="center" gap={1}><AttachMoney color="primary" /><Typography sx={{ fontWeight: 600 }}>₹{adv.amount_given.toFixed(2)}</Typography></Box></TableCell>
                      <TableCell><Box display="flex" alignItems="center" gap={1}><AccountBalance color="primary" /><Typography sx={{ fontWeight: 600 }}>₹{adv.remaining.toFixed(2)}</Typography></Box></TableCell>
                      <TableCell><Chip label={getStatusText(adv.remaining, adv.amount_given)} color={getStatusColor(adv.remaining, adv.amount_given)} /></TableCell>
                      <TableCell><Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title={t('edit')}><IconButton onClick={() => handleEdit(adv)} color="primary"><Edit /></IconButton></Tooltip>
                        <Tooltip title={t('delete')}><IconButton onClick={() => handleDelete(adv._id)} color="error"><Delete /></IconButton></Tooltip>
                      </Box></TableCell>
                    </TableRow>
                    {adv.deduction_logs?.length > 0 && (
                      <TableRow><TableCell colSpan={6} sx={{ p: 0, backgroundColor: 'action.hover' }}>
                        <Accordion sx={{ boxShadow: 'none' }}>
                          <AccordionSummary expandIcon={<ExpandMore />}><Box display="flex" alignItems="center" gap={1}><History color="primary" /><Typography variant="body2" sx={{ fontWeight: 500 }}>{t('deductionHistory')} ({adv.deduction_logs.length})</Typography></Box></AccordionSummary>
                          <AccordionDetails><List dense>{adv.deduction_logs.map((log, i) => (<ListItem key={i}><ListItemText primary={`₹${log.amount_deducted.toFixed(2)}`} secondary={moment(log.date).format('DD/MM/YYYY')} /></ListItem>))}</List></AccordionDetails>
                        </Accordion>
                      </TableCell></TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>{editingAdvance ? t('editAdvance') : t('giveAdvance')}</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'background.paper', pt: '20px !important' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}><TextField fullWidth label={t('date')} type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} error={!!formErrors.date} helperText={formErrors.date} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarToday /></InputAdornment>) }} disabled={!!editingAdvance} /></Grid>
            <Grid item xs={12}><FormControl fullWidth><InputLabel>{t('farmer')}</InputLabel><Select value={formData.farmer_id} onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })} error={!!formErrors.farmer_id} disabled={!!editingAdvance}>{farmers.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>))}</Select></FormControl></Grid>
            {editingAdvance ? (
              <Grid item xs={12}><TextField fullWidth label={t('remaining')} type="number" value={formData.remaining} onChange={(e) => setFormData({ ...formData, remaining: parseFloat(e.target.value) || 0 })} InputProps={{ inputProps: { min: 0, step: 0.01 }, startAdornment: (<InputAdornment position="start"><AttachMoney /></InputAdornment>) }} /></Grid>
            ) : (
              <Grid item xs={12}><TextField fullWidth label={t('amountGiven')} type="number" value={formData.amount_given} onChange={(e) => setFormData({ ...formData, amount_given: parseFloat(e.target.value) || 0 })} error={!!formErrors.amount_given} helperText={formErrors.amount_given} InputProps={{ inputProps: { min: 0, step: 0.01 }, startAdornment: (<InputAdornment position="start"><AttachMoney /></InputAdornment>) }} /></Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: 'background.paper' }}><Button onClick={handleCloseDialog}>{t('cancel')}</Button><Button onClick={handleSubmit} variant="contained">{t('save')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default Advances;
