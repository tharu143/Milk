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
  Divider,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
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
    deduct_full_amount: false, // New field for full amount deduction
    per_liter_deduction: 0, // New field for per-liter deduction
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  useEffect(() => {
    fetchCollections();
    fetchFarmers();
  }, []);

  const fetchCollections = async () => {
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

    if (!formData.session) {
      errors.session = t('required');
    }

    if (!formData.farmer_id) {
      errors.farmer_id = t('pleaseSelectFarmer');
    }

    if (formData.daily_rate <= 0) {
      errors.daily_rate = t('pleaseEnterValidAmount');
    }

    const hasValidLiters = Object.values(formData.per_cow_liters).some((liters) => liters > 0);
    if (!hasValidLiters) {
      errors.per_cow_liters = t('pleaseEnterMilkQuantity');
    }

    if (!formData.deduct_full_amount && formData.per_liter_deduction < 0) {
      errors.per_liter_deduction = t('invalidAmount');
    }

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
    setEditingCollection(collection);
    const farmer = farmers.find((f) => f._id === collection.farmer_id);
    setSelectedFarmer(farmer);

    setFormData({
      date: collection.date,
      session: collection.session,
      farmer_id: collection.farmer_id,
      per_cow_liters: collection.per_cow_liters,
      daily_rate: collection.daily_rate,
      deduct_full_amount: collection.deduct_full_amount || false,
      per_liter_deduction: collection.per_liter_deduction || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (collectionId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`/collections/delete/${collectionId}`);
        toast.success(t('collectionDeleted'));
        fetchCollections();
      } catch (error) {
        console.error('Error deleting collection:', error);
        toast.error(t('error') + ': Failed to delete collection');
      }
    }
  };

  const handleFarmerChange = (farmerId) => {
    const farmer = farmers.find((f) => f._id === farmerId);
    setSelectedFarmer(farmer);

    const perCowLiters = {};
    if (farmer && farmer.cows) {
      farmer.cows.forEach((cow) => {
        perCowLiters[cow.cow_id] = 0;
      });
    }

    setFormData({
      ...formData,
      farmer_id: farmerId,
      per_cow_liters: perCowLiters,
    });
  };

  const handleCowLitersChange = (cowId, liters) => {
    setFormData({
      ...formData,
      per_cow_liters: {
        ...formData.per_cow_liters,
        [cowId]: parseFloat(liters) || 0,
      },
    });
  };

  const calculateTotalLiters = () => {
    return Object.values(formData.per_cow_liters).reduce((sum, liters) => sum + (liters || 0), 0);
  };

  const calculateTotalValue = () => {
    const totalLiters = calculateTotalLiters();
    let deduction = 0;
    if (formData.deduct_full_amount) {
      // Backend will handle full amount deduction
      return totalLiters * formData.daily_rate;
    } else if (formData.per_liter_deduction > 0) {
      deduction = totalLiters * formData.per_liter_deduction;
    }
    return totalLiters * (formData.daily_rate - formData.per_liter_deduction);
  };

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
            {t('milkCollectionManagement')}
          </Typography>

          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h6" sx={{ color: '#000000' }}>
                {t('totalCollections')}: {collections.length}
              </Typography>
            </Grid>
            <Grid item>
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
                {t('addCollection')}
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
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('session')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('farmer')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('totalLiters')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('dailyRate')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('finalAmount')}</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ color: '#666666', padding: 3 }}>
                        {t('noDataAvailable')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  collections.map((collection) => (
                    <TableRow key={collection._id} sx={{ '&:hover': { backgroundColor: '#FFF8DC' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarToday sx={{ color: '#FFD700' }} />
                          {moment(collection.date).format('DD/MM/YYYY')}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<AccessTime />}
                          label={t(collection.session.toLowerCase())}
                          sx={{
                            backgroundColor: collection.session === 'Morning' ? '#FFE082' : '#FFCC02',
                            color: '#000000',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person sx={{ color: '#FFD700' }} />
                          {collection.farmer_name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Opacity sx={{ color: '#FFD700' }} />
                          {collection.total_liters.toFixed(1)}L
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AttachMoney sx={{ color: '#FFD700' }} />
                          ₹{collection.daily_rate.toFixed(2)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#000000', fontWeight: 600 }}>
                          ₹{collection.final_amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title={t('edit')}>
                            <IconButton onClick={() => handleEdit(collection)} sx={{ color: '#FFD700' }}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('delete')}>
                            <IconButton onClick={() => handleDelete(collection._id)} sx={{ color: '#FF4444' }}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('smsPreview')}>
                            <IconButton onClick={() => handleShowSms(collection.sms_text)} sx={{ color: '#2196F3' }}>
                              <ContentCopy />
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
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { border: '2px solid #FFD700', borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ backgroundColor: '#FFD700', color: '#000000', fontWeight: 600 }}>
          {editingCollection ? t('editCollection') : t('addCollection')}
        </DialogTitle>
        <DialogContent sx={{ padding: 3, backgroundColor: '#FFF8DC' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('date')}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                error={!!formErrors.date}
                helperText={formErrors.date}
                InputLabelProps={{ shrink: true }}
                sx={{ marginTop: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ marginTop: 1 }}>
                <InputLabel>{t('session')}</InputLabel>
                <Select
                  value={formData.session}
                  onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                  error={!!formErrors.session}
                >
                  <MenuItem value="Morning">{t('morning')}</MenuItem>
                  <MenuItem value="Evening">{t('evening')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ marginTop: 1 }}>
                <InputLabel>{t('farmer')}</InputLabel>
                <Select
                  value={formData.farmer_id}
                  onChange={(e) => handleFarmerChange(e.target.value)}
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
            {selectedFarmer && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ margin: '16px 0' }} />
                  <Typography variant="h6" sx={{ color: '#000000', marginBottom: 2 }}>
                    {t('milkPerCow')}
                  </Typography>
                </Grid>
                {selectedFarmer.cows.map((cow) => (
                  <Grid item xs={12} md={6} key={cow.cow_id}>
                    <TextField
                      fullWidth
                      label={`${cow.cow_id} (${cow.breed || 'Unknown breed'})`}
                      type="number"
                      value={formData.per_cow_liters[cow.cow_id] || 0}
                      onChange={(e) => handleCowLitersChange(cow.cow_id, e.target.value)}
                      InputProps={{
                        inputProps: { min: 0, step: 0.1 },
                        endAdornment: <InputAdornment position="end">L</InputAdornment>,
                      }}
                    />
                  </Grid>
                ))}
              </>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('dailyRate')}
                type="number"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                error={!!formErrors.daily_rate}
                helperText={formErrors.daily_rate}
                InputProps={{
                  inputProps: { min: 0, step: 0.1 },
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/L</InputAdornment>,
                }}
                sx={{ marginTop: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.deduct_full_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deduct_full_amount: e.target.checked,
                        per_liter_deduction: e.target.checked ? 0 : formData.per_liter_deduction,
                      })
                    }
                    sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                  />
                }
                label={t('deductFullAmount')}
                sx={{ color: '#000000' }}
              />
            </Grid>
            {!formData.deduct_full_amount && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('perLiterDeduction')}
                  type="number"
                  value={formData.per_liter_deduction}
                  onChange={(e) =>
                    setFormData({ ...formData, per_liter_deduction: parseFloat(e.target.value) || 0 })
                  }
                  error={!!formErrors.per_liter_deduction}
                  helperText={formErrors.per_liter_deduction}
                  InputProps={{
                    inputProps: { min: 0, step: 0.1 },
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/L</InputAdornment>,
                  }}
                  sx={{ marginTop: 1 }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Alert
                severity="info"
                sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1', marginTop: 1 }}
              >
                <Typography variant="body2">
                  <strong>{t('totalLiters')}:</strong> {calculateTotalLiters().toFixed(1)}L<br />
                  <strong>{t('totalValue')}:</strong> ₹{calculateTotalValue().toFixed(2)}
                </Typography>
              </Alert>
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
      {/* SMS Preview Dialog */}
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

export default MilkCollection;