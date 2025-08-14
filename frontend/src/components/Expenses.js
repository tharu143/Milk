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
  CircularProgress,
  FormControlLabel,
  Checkbox,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Receipt,
  Person,
  CalendarToday,
  AttachMoney,
  Description,
  LocalHospital,
  Restaurant,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';

function Expenses() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    date: moment().format('YYYY-MM-DD'),
    farmer_id: '',
    type: 'Veterinary',
    description: '',
    amount: 0,
    is_credit: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [filterFarmer, setFilterFarmer] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/expenses/read');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error(t('error') + ': Failed to load expenses');
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
    fetchExpenses();
    fetchFarmers();
  }, [fetchExpenses, fetchFarmers]);

  const validateForm = () => {
    const errors = {};
    if (!formData.date) errors.date = t('required');
    if (!formData.farmer_id) errors.farmer_id = t('pleaseSelectFarmer');
    if (!formData.type) errors.type = t('required');
    if (!formData.description.trim()) errors.description = t('required');
    if (formData.amount <= 0) errors.amount = t('pleaseEnterValidAmount');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingExpense) {
        await axios.put(`/expenses/update/${editingExpense._id}`, formData);
        toast.success(t('expenseUpdated'));
      } else {
        await axios.post('/expenses/create', formData);
        toast.success(t('expenseAdded'));
      }
      setDialogOpen(false);
      setEditingExpense(null);
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(t('error') + ': ' + (error.response?.data?.detail || 'Failed to save expense'));
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({ ...expense });
    setDialogOpen(true);
  };

  const handleDelete = async (expenseId) => {
    try {
      await axios.delete(`/expenses/delete/${expenseId}`);
      toast.success(t('expenseDeleted'));
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(t('error') + ': Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      date: moment().format('YYYY-MM-DD'),
      farmer_id: '',
      type: 'Veterinary',
      description: '',
      amount: 0,
      is_credit: false,
    });
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    resetForm();
  };

  const filteredExpenses = filterFarmer ? expenses.filter((e) => e.farmer_id === filterFarmer) : expenses;
  const calculateTotalExpenses = () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getExpenseTypeIcon = (type) => {
    const iconProps = { sx: { color: 'primary.main' } };
    switch (type) {
      case 'Veterinary': return <LocalHospital {...iconProps} />;
      case 'Food': return <Restaurant {...iconProps} />;
      default: return <Receipt {...iconProps} />;
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress size={60} color="primary" /></Box>;
  }

  return (
    <Box>
      <Card sx={{ marginBottom: 3, backgroundColor: 'background.paper' }}>
        <CardContent sx={{ padding: { xs: '12px', sm: '16px' } }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>{t('expenseManagement')}</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}><FormControl fullWidth><InputLabel>{t('farmer')}</InputLabel><Select value={filterFarmer} onChange={(e) => setFilterFarmer(e.target.value)} sx={{ backgroundColor: 'background.default' }}><MenuItem value="">{t('allFarmers')}</MenuItem>{farmers.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>))}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="h6">{t('totalExpenses')}: ₹{calculateTotalExpenses().toFixed(2)}</Typography></Grid>
            <Grid item xs={12} md={4} display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }}><Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>{t('addExpense')}</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ padding: { xs: '12px', sm: '16px' } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: '650px' }}>
              <TableHead><TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('date')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('farmer')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('expenseType')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('description')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('amount')}</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Credit</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>{t('actions')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filteredExpenses.map((exp) => (
                  <TableRow key={exp._id} hover>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><CalendarToday color="primary" />{moment(exp.date).format('DD/MM/YYYY')}</Box></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><Person color="primary" />{exp.farmer_name}</Box></TableCell>
                    <TableCell><Chip icon={getExpenseTypeIcon(exp.type)} label={t(exp.type.toLowerCase()) || exp.type} color="secondary" variant="outlined" /></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><Description color="primary" />{exp.description}</Box></TableCell>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><AttachMoney color="primary" /><Typography sx={{ fontWeight: 600 }}>₹{exp.amount.toFixed(2)}</Typography></Box></TableCell>
                    <TableCell><Chip label={exp.is_credit ? 'Credit' : 'Cash'} color={exp.is_credit ? 'warning' : 'success'} /></TableCell>
                    <TableCell><Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title={t('edit')}><IconButton onClick={() => handleEdit(exp)} color="primary"><Edit /></IconButton></Tooltip>
                      <Tooltip title={t('delete')}><IconButton onClick={() => handleDelete(exp._id)} color="error"><Delete /></IconButton></Tooltip>
                    </Box></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>{editingExpense ? t('editExpense') : t('addExpense')}</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'background.paper', pt: '20px !important' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><TextField fullWidth label={t('date')} type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} error={!!formErrors.date} helperText={formErrors.date} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarToday /></InputAdornment>) }} /></Grid>
            <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>{t('farmer')}</InputLabel><Select value={formData.farmer_id} onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })} error={!!formErrors.farmer_id}>{farmers.map((f) => (<MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>))}</Select></FormControl></Grid>
            <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>{t('expenseType')}</InputLabel><Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} error={!!formErrors.type}><MenuItem value="Veterinary">{t('veterinary')}</MenuItem><MenuItem value="Food">{t('food')}</MenuItem></Select></FormControl></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label={t('amount')} type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} error={!!formErrors.amount} helperText={formErrors.amount} InputProps={{ inputProps: { min: 0, step: 0.01 }, startAdornment: (<InputAdornment position="start"><AttachMoney /></InputAdornment>) }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label={t('description')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} error={!!formErrors.description} helperText={formErrors.description} multiline rows={3} InputProps={{ startAdornment: (<InputAdornment position="start"><Description /></InputAdornment>) }} /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Checkbox checked={formData.is_credit} onChange={(e) => setFormData({ ...formData, is_credit: e.target.checked })} />} label={t('addToAdvance')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: 'background.paper' }}><Button onClick={handleCloseDialog}>{t('cancel')}</Button><Button onClick={handleSubmit} variant="contained">{t('save')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default Expenses;
