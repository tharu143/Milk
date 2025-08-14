import React, { useState, useEffect } from 'react';
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
    is_credit: false, // New field for credit checkbox
  });
  const [formErrors, setFormErrors] = useState({});
  const [filterFarmer, setFilterFarmer] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchFarmers();
  }, []);

  const fetchExpenses = async () => {
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
  };

  const fetchFarmers = async () => {
    try {
      const response = await axios.get('/farmers/read');
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error(t('error') + ': Failed to load farmers');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.date) {
      errors.date = t('required');
    }

    if (!formData.farmer_id) {
      errors.farmer_id = t('pleaseSelectFarmer');
    }

    if (!formData.type) {
      errors.type = t('required');
    }

    if (!formData.description.trim()) {
      errors.description = t('required');
    }

    if (formData.amount <= 0) {
      errors.amount = t('pleaseEnterValidAmount');
    }

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
    setFormData({
      date: expense.date,
      farmer_id: expense.farmer_id,
      type: expense.type,
      description: expense.description,
      amount: expense.amount,
      is_credit: expense.is_credit || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`/expenses/delete/${expenseId}`);
        toast.success(t('expenseDeleted'));
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error(t('error') + ': Failed to delete expense');
      }
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

  const filteredExpenses = filterFarmer
    ? expenses.filter((expense) => expense.farmer_id === filterFarmer)
    : expenses;

  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpenseTypeIcon = (type) => {
    switch (type) {
      case 'Veterinary':
        return <LocalHospital sx={{ color: '#FFD700' }} />;
      case 'Food':
        return <Restaurant sx={{ color: '#FFD700' }} />;
      default:
        return <Receipt sx={{ color: '#FFD700' }} />;
    }
  };

  const getExpenseTypeColor = (type) => {
    switch (type) {
      case 'Veterinary':
        return '#FF5722';
      case 'Food':
        return '#4CAF50';
      default:
        return '#FFD700';
    }
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
            {t('expenseManagement')}
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>{t('farmer')}</InputLabel>
                <Select
                  value={filterFarmer}
                  onChange={(e) => setFilterFarmer(e.target.value)}
                  sx={{ backgroundColor: 'white' }}
                >
                  <MenuItem value="">{t('allFarmers') || 'All Farmers'}</MenuItem>
                  {farmers.map((farmer) => (
                    <MenuItem key={farmer._id} value={farmer._id}>
                      {farmer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ color: '#000000' }}>
                {t('totalExpenses')}: ₹{calculateTotalExpenses().toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  backgroundColor: '#FFD700',
                  color: '#000000',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E6C200' },
                }}
              >
                {t('addExpense')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ border: '2px solid #FFD700' }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FFD700' }}>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('date')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('farmer')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('expenseType')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('description')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('amount')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Credit</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ color: '#666666', padding: 3 }}>
                        {t('noDataAvailable')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense._id} sx={{ '&:hover': { backgroundColor: '#FFF8DC' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarToday sx={{ color: '#FFD700' }} />
                          {moment(expense.date).format('DD/MM/YYYY')}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person sx={{ color: '#FFD700' }} />
                          {expense.farmer_name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getExpenseTypeIcon(expense.type)}
                          label={t(expense.type.toLowerCase()) || expense.type}
                          sx={{
                            backgroundColor: getExpenseTypeColor(expense.type),
                            color: '#FFFFFF',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Description sx={{ color: '#FFD700' }} />
                          <Typography sx={{ color: '#000000' }}>{expense.description}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AttachMoney sx={{ color: '#FFD700' }} />
                          <Typography sx={{ color: '#000000', fontWeight: 600 }}>
                            ₹{expense.amount.toFixed(2)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.is_credit ? 'Credit' : 'Cash'}
                          sx={{
                            backgroundColor: expense.is_credit ? '#FF9800' : '#4CAF50',
                            color: '#FFFFFF',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title={t('edit')}>
                            <IconButton onClick={() => handleEdit(expense)} sx={{ color: '#FFD700' }}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('delete')}>
                            <IconButton onClick={() => handleDelete(expense._id)} sx={{ color: '#FF4444' }}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { border: '2px solid #FFD700', borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ backgroundColor: '#FFD700', color: '#000000', fontWeight: 600 }}>
          {editingExpense ? t('editExpense') : t('addExpense')}
        </DialogTitle>
        <DialogContent sx={{ padding: 3, backgroundColor: '#FFF8DC' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('date')}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                error={!!formErrors.date}
                helperText={formErrors.date}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginTop: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ marginTop: 1 }}>
                <InputLabel>{t('farmer')}</InputLabel>
                <Select
                  value={formData.farmer_id}
                  onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                  error={!!formErrors.farmer_id}
                >
                  {farmers.map((farmer) => (
                    <MenuItem key={farmer._id} value={farmer._id}>
                      {farmer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ marginTop: 1 }}>
                <InputLabel>{t('expenseType')}</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  error={!!formErrors.type}
                >
                  <MenuItem value="Veterinary">{t('veterinary')}</MenuItem>
                  <MenuItem value="Food">{t('food')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('amount')}
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginTop: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!formErrors.description}
                helperText={formErrors.description}
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginTop: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_credit}
                    onChange={(e) => setFormData({ ...formData, is_credit: e.target.checked })}
                    sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                  />
                }
                label={t('addToAdvance')}
                sx={{ color: '#000000' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: 2, backgroundColor: '#FFF8DC' }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#666666' }}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#FFD700',
              color: '#000000',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#E6C200' },
            }}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Expenses;